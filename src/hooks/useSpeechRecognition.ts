import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseSpeechRecognitionOptions {
  onTranscript: (texto: string, esFinal: boolean) => void;
  onError?: (error: string) => void;
}

export interface UseSpeechRecognitionReturn {
  isListening: boolean;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
}

/**
 * Controlador de orquestación de la Web Speech API
 */
export class SpeechRecognitionController {
  private recognition: any = null;
  private onTranscript: (texto: string, esFinal: boolean) => void;
  private onError?: (error: string) => void;
  private onStateChange?: (isListening: boolean) => void;
  public isListening = false;

  constructor(options: {
    onTranscript: (texto: string, esFinal: boolean) => void;
    onError?: (error: string) => void;
    onStateChange?: (isListening: boolean) => void;
  }) {
    this.onTranscript = options.onTranscript;
    this.onError = options.onError;
    this.onStateChange = options.onStateChange;
  }

  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    );
  }

  public start(): void {
    if (!this.isSupported()) {
      if (this.onError) {
        this.onError('Reconocimiento de voz no soportado en este navegador.');
      }
      return;
    }

    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {
        // Tolerado
      }
      this.recognition = null;
    }

    try {
      const SpeechRecognitionClass =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SpeechRecognitionClass();

      rec.continuous = true;
      rec.interimResults = true;

      const langNav = typeof navigator !== 'undefined' ? navigator.language : 'es-PE';
      rec.lang = langNav.startsWith('es') ? langNav : 'es-PE';

      rec.onstart = () => {
        this.isListening = true;
        if (this.onStateChange) this.onStateChange(true);
      };

      rec.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            finalTranscript += (finalTranscript ? ' ' : '') + res[0].transcript.trim();
          } else {
            interimTranscript += (interimTranscript ? ' ' : '') + res[0].transcript.trim();
          }
        }

        const textoCompleto = (finalTranscript + (interimTranscript ? ' ' + interimTranscript : '')).trim();
        const esFinal = !interimTranscript && Boolean(finalTranscript);

        if (textoCompleto && this.onTranscript) {
          this.onTranscript(textoCompleto, esFinal);
        }
      };

      rec.onerror = (event: any) => {
        let mensaje = 'Error en el reconocimiento de voz.';
        if (event.error === 'not-allowed') {
          mensaje = 'Permiso de micrófono denegado. Habilita el acceso en tu navegador.';
        } else if (event.error === 'no-speech') {
          mensaje = 'No se detectó voz. Intenta hablar más cerca del micrófono.';
        } else if (event.error === 'audio-capture') {
          mensaje = 'No se detectó hardware de micrófono disponible.';
        } else if (event.error === 'network') {
          mensaje = 'Error de red en el servicio de transcripción.';
        }

        if (this.onError) {
          this.onError(mensaje);
        }
        this.isListening = false;
        if (this.onStateChange) this.onStateChange(false);
      };

      rec.onend = () => {
        this.isListening = false;
        this.recognition = null;
        if (this.onStateChange) this.onStateChange(false);
      };

      this.recognition = rec;
      rec.start();
    } catch (err: any) {
      this.isListening = false;
      if (this.onStateChange) this.onStateChange(false);
      if (this.onError) {
        this.onError(err.message || 'No se pudo activar el micrófono.');
      }
    }
  }

  public stop(): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Tolerado
      }
      this.recognition = null;
    }
    this.isListening = false;
    if (this.onStateChange) this.onStateChange(false);
  }

  public abort(): void {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {
        // Tolerado
      }
      this.recognition = null;
    }
    this.isListening = false;
    if (this.onStateChange) this.onStateChange(false);
  }

  public toggle(): void {
    if (this.isListening) {
      this.stop();
    } else {
      this.start();
    }
  }

  public updateCallbacks(onTranscript: (t: string, f: boolean) => void, onError?: (e: string) => void): void {
    this.onTranscript = onTranscript;
    this.onError = onError;
  }
}

/**
 * REQ-IDEAS-VOICE-RECOGNITION-19: Hook de Reconocimiento de Voz Nativo (Web Speech API)
 * Provee transcripción en tiempo real con soporte multi-navegador (SpeechRecognition / webkitSpeechRecognition).
 */
export function useSpeechRecognition({
  onTranscript,
  onError
}: UseSpeechRecognitionOptions): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState<boolean>(false);
  const controllerRef = useRef<SpeechRecognitionController | null>(null);

  if (!controllerRef.current) {
    controllerRef.current = new SpeechRecognitionController({
      onTranscript,
      onError,
      onStateChange: (listening) => setIsListening(listening)
    });
  } else {
    controllerRef.current.updateCallbacks(onTranscript, onError);
  }

  const isSupported = controllerRef.current.isSupported();

  const startListening = useCallback(() => {
    controllerRef.current?.start();
  }, []);

  const stopListening = useCallback(() => {
    controllerRef.current?.stop();
  }, []);

  const toggleListening = useCallback(() => {
    controllerRef.current?.toggle();
  }, []);

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
    toggleListening
  };
}
