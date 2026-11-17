import { describe, it, expect } from 'vitest';
import { generateSafeUUID } from '../uuid';
import { generateSafeUUID as generateSafeUUIDFromGenerator } from '../uuidGenerator';

describe('REQ-SYNC-PROD-16-FIX: Generador Seguro de UUID v4 (generateSafeUUID)', () => {
  const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  it('genera un UUID v4 válido con crypto.randomUUID disponible', () => {
    const uuid = generateSafeUUID();
    expect(uuid).toBeDefined();
    expect(typeof uuid).toBe('string');
    expect(uuid).toMatch(UUID_V4_REGEX);
  });

  it('mantiene paridad entre uuid.ts y uuidGenerator.ts', () => {
    const uuid = generateSafeUUIDFromGenerator();
    expect(uuid).toMatch(UUID_V4_REGEX);
  });

  it('genera UUIDs únicos y no colisiona en invocaciones consecutivas', () => {
    const set = new Set<string>();
    for (let i = 0; i < 100; i++) {
      set.add(generateSafeUUID());
    }
    expect(set.size).toBe(100);
  });

  it('utiliza fallback pseudoaleatorio compatible con RFC4122 cuando crypto.randomUUID no existe (contexto no-HTTPS)', () => {
    const originalCrypto = globalThis.crypto;
    try {
      // Simular entorno sin crypto.randomUUID (ej. HTTP en red local)
      Object.defineProperty(globalThis, 'crypto', {
        value: undefined,
        configurable: true,
        writable: true
      });

      const fallbackUuid = generateSafeUUID();
      expect(fallbackUuid).toBeDefined();
      expect(typeof fallbackUuid).toBe('string');
      expect(fallbackUuid).toMatch(UUID_V4_REGEX);

      // Simular crypto como objeto pero sin randomUUID
      Object.defineProperty(globalThis, 'crypto', {
        value: {},
        configurable: true,
        writable: true
      });

      const fallbackUuid2 = generateSafeUUID();
      expect(fallbackUuid2).toMatch(UUID_V4_REGEX);
    } finally {
      Object.defineProperty(globalThis, 'crypto', {
        value: originalCrypto,
        configurable: true,
        writable: true
      });
    }
  });
});
