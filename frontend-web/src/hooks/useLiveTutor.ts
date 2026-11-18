// frontend-web/src/hooks/useLiveTutor.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/api';

type LiveState = 'disconnected' | 'connecting' | 'listening' | 'speaking' | 'error';

interface LiveTokenResponse {
  provider: string;
  model: string;
  chatEndpoint: string;
  speechEndpoint: string;
  message: string;
}

export function useLiveTutor(lessonId: string, gender: 'male' | 'female') {
  const [state, setState] = useState<LiveState>('disconnected');
  const [error, setError] = useState('');
  const [transcript, setTranscript] = useState<Array<{ sender: 'user' | 'tutor'; text: string }>>([]);
  const recognitionRef = useRef<any>(null);
  const epoch = useRef(0);

  const disconnect = useCallback(() => {
    epoch.current++;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        /* already closed */
      }
      recognitionRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setState('disconnected');
  }, []);

  useEffect(() => {
    return disconnect;
  }, [lessonId, disconnect]);

  const connect = async () => {
    disconnect();
    const id = epoch.current;
    setState('connecting');
    setError('');

    try {
      // Verificar conexión y estado con el backend potenciado por Groq Cloud
      await api.post<LiveTokenResponse>('/tutor/live-token', { lessonId, gender });
      if (id !== epoch.current) return;

      const SpeechRec =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRec) {
        setError('Tu navegador no soporta entrada de voz directa. Puedes interactuar mediante el chat de texto.');
        setState('error');
        return;
      }

      const recognition = new SpeechRec();
      recognition.lang = 'es-ES';
      recognition.continuous = true;
      recognition.interimResults = false;

      recognition.onstart = () => {
        if (id === epoch.current) {
          setState('listening');
        }
      };

      recognition.onresult = async (event: any) => {
        if (id !== epoch.current) return;
        const lastResult = event.results[event.results.length - 1];
        if (lastResult.isFinal) {
          const userText = lastResult[0].transcript.trim();
          if (!userText) return;

          setTranscript((prev) => [...prev, { sender: 'user', text: userText }]);
          setState('speaking');

          try {
            const chatRes = await api.post('/tutor/chat', { lessonId, message: userText });
            if (id !== epoch.current) return;

            const replyText = chatRes.data.replyText || 'Te escucho. Continuemos con la lección.';
            setTranscript((prev) => [...prev, { sender: 'tutor', text: replyText }]);

            // Síntesis de voz para respuesta pedagógica
            if ('speechSynthesis' in window) {
              const utterance = new SpeechSynthesisUtterance(replyText);
              utterance.lang = 'es-ES';
              utterance.onend = () => {
                if (id === epoch.current) {
                  setState('listening');
                }
              };
              utterance.onerror = () => {
                if (id === epoch.current) {
                  setState('listening');
                }
              };
              window.speechSynthesis.speak(utterance);
            } else {
              setState('listening');
            }
          } catch {
            if (id === epoch.current) {
              setState('listening');
            }
          }
        }
      };

      recognition.onerror = () => {
        if (id === epoch.current) {
          setError('No se pudo capturar audio del micrófono. Verifica los permisos del navegador.');
          setState('error');
        }
      };

      recognition.onend = () => {
        if (id === epoch.current && state === 'listening') {
          try {
            recognition.start();
          } catch {
            // Ya activo
          }
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      if (id !== epoch.current) return;
      disconnect();
      setError('No se pudo iniciar la conversación con Groq Cloud. El chat continúa disponible.');
      setState('error');
    }
  };

  return {
    state,
    error,
    transcript,
    connect,
    disconnect,
    active: state === 'listening' || state === 'speaking' || state === 'connecting',
  };
}
