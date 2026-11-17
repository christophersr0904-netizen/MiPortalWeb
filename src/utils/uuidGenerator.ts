/**
 * ============================================================================
 * ARCHIVO: src/utils/uuidGenerator.ts
 * SISTEMA: PMO Personal Modular & Life OS
 * REQUISITO: REQ-SYNC-IDS-02-FIX
 * DESCRIPCIÓN: Generador canónico de identificadores universales seguros (UUID v4)
 *              conforme a RFC4122 para interoperabilidad Dexie - Supabase (PostgreSQL).
 * ============================================================================
 */

/**
 * Genera un UUID v4 seguro y válido.
 * Utiliza crypto.randomUUID() cuando está disponible en el runtime (navegador / Node.js 19+).
 * Como salvaguarda para entornos restringidos, utiliza un generador pseudoaleatorio
 * que garantiza el cumplimiento de la máscara RFC4122 v4 sin recurrir a timestamps legados.
 */
export function generateSafeUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Generador determinístico RFC4122 v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
