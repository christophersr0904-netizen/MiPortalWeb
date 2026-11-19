/**
 * ============================================================================
 * SUPABASE EDGE FUNCTION: gcal-auth
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-GCAL-BACKEND-02
 * RUNTIME: Deno / TypeScript
 * ROL: Pasarela segura OAuth 2.0 Offline para Google Calendar API v3
 *      con persistencia de Refresh Token multi-dispositivo y RLS service_role.
 * ============================================================================
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Declaración ambiental de tipos de Deno para análisis estático
declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
  env: {
    get: (key: string) => string | undefined;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';

interface RequestPayload {
  action: 'exchange' | 'token' | 'status' | 'disconnect';
  userId?: string;
  code?: string;
  redirectUri?: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
  // Manejo de preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método no permitido. Use POST.' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID') || '';
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET') || '';

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: 'Faltan variables SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno de la función.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  try {
    const body: RequestPayload = await req.json().catch(() => ({ action: 'status' }));
    const action = body.action || 'status';
    const targetUserId = body.userId && body.userId.trim() ? body.userId.trim() : DEFAULT_USER_ID;

    // ------------------------------------------------------------------------
    // 1. ACTION: 'status' — Consulta si existe integración conectada
    // ------------------------------------------------------------------------
    if (action === 'status') {
      const { data, error } = await supabase
        .from('google_calendar_integrations')
        .select('google_email, refresh_token, expires_at')
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.warn('[gcal-auth] Error consultando status:', error);
      }

      const connected = Boolean(data && data.refresh_token);
      return new Response(
        JSON.stringify({
          connected,
          email: data?.google_email || null,
          expires_at: data?.expires_at || null
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ------------------------------------------------------------------------
    // 2. ACTION: 'disconnect' — Elimina credenciales almacenadas
    // ------------------------------------------------------------------------
    if (action === 'disconnect') {
      await supabase
        .from('google_calendar_integrations')
        .delete()
        .eq('user_id', targetUserId);

      return new Response(
        JSON.stringify({ connected: false, message: 'Google Calendar desconectado exitosamente.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Para exchange y token se requiere clientId y clientSecret de Google
    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({
          error: 'Faltan credenciales GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET en la Edge Function.'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ------------------------------------------------------------------------
    // 3. ACTION: 'exchange' — Intercambia authorization_code por refresh_token
    // ------------------------------------------------------------------------
    if (action === 'exchange') {
      if (!body.code) {
        return new Response(
          JSON.stringify({ error: 'Falta el parámetro obligatorio "code".' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const redirectUri = body.redirectUri || 'postmessage';
      const tokenParams = new URLSearchParams({
        code: body.code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      });

      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: tokenParams.toString()
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok || !tokenData.access_token) {
        return new Response(
          JSON.stringify({
            error: tokenData.error_description || tokenData.error || 'Error al intercambiar código con Google OAuth.'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const accessToken = tokenData.access_token;
      let refreshToken = tokenData.refresh_token;
      const expiresIn = Number(tokenData.expires_in) || 3600;
      const expiresAt = new Date(Date.now() + Math.max(60, expiresIn - 120) * 1000).toISOString();

      // Si Google no reenvió refresh_token (ya autorizado previamente), recuperar el existente en BD
      if (!refreshToken) {
        const { data: existing } = await supabase
          .from('google_calendar_integrations')
          .select('refresh_token')
          .eq('user_id', targetUserId)
          .maybeSingle();

        if (existing?.refresh_token) {
          refreshToken = existing.refresh_token;
        } else {
          return new Response(
            JSON.stringify({
              error: 'Google no entregó refresh_token. Es necesario revocar el acceso previo y autorizar con prompt=consent.'
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Obtener el correo principal de la cuenta de Google
      let userEmail: string | null = null;
      try {
        const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (userinfoRes.ok) {
          const userinfo = await userinfoRes.json();
          userEmail = userinfo.email || null;
        }
      } catch (uiErr) {
        console.warn('[gcal-auth] No se pudo obtener userinfo:', uiErr);
      }

      // Upsert atómico en google_calendar_integrations
      const { error: upsertErr } = await supabase
        .from('google_calendar_integrations')
        .upsert(
          {
            user_id: targetUserId,
            refresh_token: refreshToken,
            access_token: accessToken,
            expires_at: expiresAt,
            google_email: userEmail,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id' }
        );

      if (upsertErr) {
        return new Response(
          JSON.stringify({ error: `Error guardando integración en Supabase: ${upsertErr.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          connected: true,
          access_token: accessToken,
          expires_at: expiresAt,
          email: userEmail
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ------------------------------------------------------------------------
    // 4. ACTION: 'token' — Obtiene o renueva token de acceso silenciosamente
    // ------------------------------------------------------------------------
    if (action === 'token') {
      const { data: record, error: readErr } = await supabase
        .from('google_calendar_integrations')
        .select('*')
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (readErr || !record || !record.refresh_token) {
        return new Response(
          JSON.stringify({ connected: false, error: 'No existe integración activa para este usuario.' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Si el access_token almacenado aún es válido (> 2 minutos de margen), reutilizarlo
      const ahora = Date.now();
      const expTimestamp = record.expires_at ? new Date(record.expires_at).getTime() : 0;
      const margenSeguridadMs = 2 * 60 * 1000;

      if (record.access_token && expTimestamp - ahora > margenSeguridadMs) {
        return new Response(
          JSON.stringify({
            connected: true,
            access_token: record.access_token,
            expires_at: record.expires_at,
            email: record.google_email
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Token caducado o próximo a expirar: renovar con refresh_token
      const refreshParams = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: record.refresh_token,
        grant_type: 'refresh_token'
      });

      const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: refreshParams.toString()
      });

      const refreshData = await refreshRes.json();
      if (!refreshRes.ok || !refreshData.access_token) {
        console.warn('[gcal-auth] Fallo al renovar refresh_token:', refreshData);
        if (refreshData.error === 'invalid_grant') {
          // Token revocado por el usuario en Google Account Settings
          await supabase.from('google_calendar_integrations').delete().eq('user_id', targetUserId);
          return new Response(
            JSON.stringify({ connected: false, error: 'La sesión de Google Calendar fue revocada. Vuelve a conectar.' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        return new Response(
          JSON.stringify({ connected: false, error: refreshData.error_description || refreshData.error || 'Fallo de renovación.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const newAccessToken = refreshData.access_token;
      const expiresIn = Number(refreshData.expires_in) || 3600;
      const newExpiresAt = new Date(Date.now() + Math.max(60, expiresIn - 120) * 1000).toISOString();

      await supabase
        .from('google_calendar_integrations')
        .update({
          access_token: newAccessToken,
          expires_at: newExpiresAt,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', targetUserId);

      return new Response(
        JSON.stringify({
          connected: true,
          access_token: newAccessToken,
          expires_at: newExpiresAt,
          email: record.google_email
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: `Acción desconocida: ${action}` }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[gcal-auth] Excepción no controlada:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Error interno en gcal-auth.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
