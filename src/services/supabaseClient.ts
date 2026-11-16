/**
 * ============================================================================
 * ARCHIVO: src/services/supabaseClient.ts
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-BUGFIX-72-EXEC (Optimización SyncManager y Supabase Network)
 * DESCRIPCIÓN: Cliente unificado de Supabase con blindaje de sesión, opciones
 *              resilientes de red y helpers puros de autenticación.
 * ============================================================================
 */

import { createClient, type SupabaseClient, type Session } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

/**
 * Inicializa y retorna la instancia singleton del cliente Supabase
 */
export function initSupabase(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mock.supabase.co';
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'mock-anon-key';

  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  } catch (err) {
    console.warn('[supabaseClient] Error al inicializar cliente Supabase:', err);
    supabaseInstance = createClient('https://mock.supabase.co', 'mock-anon-key');
  }

  return supabaseInstance;
}

/**
 * Retorna la instancia singleton existente o la inicializa si es requerida
 */
export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    return initSupabase();
  }
  return supabaseInstance;
}

/**
 * Consulta de forma segura la sesión activa de Supabase Auth
 * Retorna null si no hay sesión, si la URL es mock o si ocurre un fallo de red.
 */
export async function obtenerSesionActiva(client?: SupabaseClient | null): Promise<Session | null> {
  const c = client || supabaseInstance;
  if (!c || import.meta.env.VITE_SUPABASE_URL?.includes('mock')) {
    return null;
  }
  try {
    if (typeof c.auth?.getSession === 'function') {
      const { data, error } = await c.auth.getSession();
      if (error || !data?.session) return null;
      return data.session;
    }
  } catch (err) {
    console.warn('[supabaseClient] Error al consultar sesión activa:', err);
  }
  return null;
}

/**
 * Evalúa si existe una sesión de autenticación activa válida
 */
export async function tieneSesionActiva(client?: SupabaseClient | null): Promise<boolean> {
  const sesion = await obtenerSesionActiva(client);
  return Boolean(sesion && sesion.user?.id);
}
