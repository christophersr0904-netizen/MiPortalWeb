import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SpeechRecognitionController } from '../useSpeechRecognition';

describe('REQ-IDEAS-VOICE-RECOGNITION-19: useSpeechRecognition & SpeechRecognitionController', () => {
  let mockRecognitionInstance: any;

  class MockSpeechRecognition {
    continuous = false;
    interimResults = false;
    lang = '';
    onstart: (() => void) | null = null;
    onresult: ((event: any) => void) | null = null;
    onerror: ((event: any) => void) | null = null;
    onend: (() => void) | null = null;

    start = vi.fn(() => {
      if (this.onstart) this.onstart();
    });
    stop = vi.fn(() => {
      if (this.onend) this.onend();
    });
    abort = vi.fn(() => {
      if (this.onend) this.onend();
    });

    constructor() {
      mockRecognitionInstance = this;
    }
  }

  beforeEach(() => {
    mockRecognitionInstance = null;
    vi.stubGlobal('window', globalThis);
    vi.stubGlobal('SpeechRecognition', MockSpeechRecognition);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('Detecta isSupported: false cuando la API no está presente', () => {
    vi.stubGlobal('SpeechRecognition', undefined);
    vi.stubGlobal('webkitSpeechRecognition', undefined);

    const controller = new SpeechRecognitionController({
      onTranscript: vi.fn(),
      onError: vi.fn()
    });

    expect(controller.isSupported()).toBe(false);
  });

  it('Detecta isSupported: true con SpeechRecognition o webkitSpeechRecognition', () => {
    const controller = new SpeechRecognitionController({
      onTranscript: vi.fn(),
      onError: vi.fn()
    });

    expect(controller.isSupported()).toBe(true);
  });

  it('Inicia el reconocimiento con continuous=true, interimResults=true y lang es-PE', () => {
    const onTranscript = vi.fn();
    const controller = new SpeechRecognitionController({
      onTranscript
    });

    controller.start();

    expect(mockRecognitionInstance).toBeTruthy();
    expect(mockRecognitionInstance.continuous).toBe(true);
    expect(mockRecognitionInstance.interimResults).toBe(true);
    expect(mockRecognitionInstance.lang).toBe('es-PE');
    expect(mockRecognitionInstance.start).toHaveBeenCalledTimes(1);
    expect(controller.isListening).toBe(true);
  });

  it('Procesa onresult concatenando transcripciones finales e interinas y llama a onTranscript', () => {
    const onTranscript = vi.fn();
    const controller = new SpeechRecognitionController({
      onTranscript
    });

    controller.start();

    // Simular evento con 1 resultado final y 1 interino
    const mockEvent = {
      results: [
        {
          isFinal: true,
          0: { transcript: 'Idea de negocio innovadora' }
        },
        {
          isFinal: false,
          0: { transcript: 'en el sector SaaS' }
        }
      ]
    };

    mockRecognitionInstance.onresult(mockEvent);

    expect(onTranscript).toHaveBeenCalledWith('Idea de negocio innovadora en el sector SaaS', false);
  });

  it('Marca esFinal=true cuando todos los resultados son finales', () => {
    const onTranscript = vi.fn();
    const controller = new SpeechRecognitionController({
      onTranscript
    });

    controller.start();

    const mockEvent = {
      results: [
        {
          isFinal: true,
          0: { transcript: 'Comprar insumos para el proyecto' }
        }
      ]
    };

    mockRecognitionInstance.onresult(mockEvent);

    expect(onTranscript).toHaveBeenCalledWith('Comprar insumos para el proyecto', true);
  });

  it('Captura error not-allowed y emite mensaje de permiso denegado', () => {
    const onError = vi.fn();
    const controller = new SpeechRecognitionController({
      onTranscript: vi.fn(),
      onError
    });

    controller.start();
    expect(controller.isListening).toBe(true);

    mockRecognitionInstance.onerror({ error: 'not-allowed' });

    expect(onError).toHaveBeenCalledWith(
      expect.stringContaining('Permiso de micrófono denegado')
    );
    expect(controller.isListening).toBe(false);
  });

  it('Captura error no-speech y emite mensaje amigable', () => {
    const onError = vi.fn();
    const controller = new SpeechRecognitionController({
      onTranscript: vi.fn(),
      onError
    });

    controller.start();
    mockRecognitionInstance.onerror({ error: 'no-speech' });

    expect(onError).toHaveBeenCalledWith(
      expect.stringContaining('No se detectó voz')
    );
    expect(controller.isListening).toBe(false);
  });

  it('stop() invoca recognition.stop() y restablece isListening a false', () => {
    const controller = new SpeechRecognitionController({
      onTranscript: vi.fn()
    });

    controller.start();
    expect(controller.isListening).toBe(true);

    controller.stop();
    expect(mockRecognitionInstance.stop).toHaveBeenCalledTimes(1);
    expect(controller.isListening).toBe(false);
  });

  it('toggle() alterna entre start y stop según el estado actual', () => {
    const controller = new SpeechRecognitionController({
      onTranscript: vi.fn()
    });

    // 1er toggle -> start
    controller.toggle();
    expect(controller.isListening).toBe(true);
    expect(mockRecognitionInstance.start).toHaveBeenCalledTimes(1);

    // 2do toggle -> stop
    controller.toggle();
    expect(controller.isListening).toBe(false);
    expect(mockRecognitionInstance.stop).toHaveBeenCalledTimes(1);
  });

  it('onend restablece isListening a false y limpia la instancia interna', () => {
    const controller = new SpeechRecognitionController({
      onTranscript: vi.fn()
    });

    controller.start();
    expect(controller.isListening).toBe(true);

    mockRecognitionInstance.onend();
    expect(controller.isListening).toBe(false);
  });
});
