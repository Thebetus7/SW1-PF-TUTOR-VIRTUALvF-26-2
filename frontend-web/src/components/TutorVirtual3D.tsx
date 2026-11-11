// frontend-web/src/components/TutorVirtual3D.tsx
//
// Tutor conversacional "Sky". El docente se renderiza con TutorAvatar3D (WebGL):
// la postura y los visemas provienen de la pista que genera el backend con IA.
import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { Bot, Send, Volume2, VolumeX, Sparkles, ArrowRight, MessageSquare } from 'lucide-react';
import { api } from '../services/api';
import type { AvatarPoseType, VisemeFrame, VisemeShape } from '../types/tutor.types';

const TutorAvatar3D = lazy(() => import('./TutorAvatar3D'));

interface TutorVirtual3DProps {
  lessonId: string;
  lessonTitle: string;
  onNavigate?: (url: string) => void;
}

interface ChatMessage {
  sender: 'user' | 'tutor';
  text: string;
}

const AvatarPlaceholder: React.FC = () => (
  <div style={styles.avatarPlaceholder} aria-hidden="true">
    <span>Cargando docente 3D…</span>
  </div>
);

export const TutorVirtual3D: React.FC<TutorVirtual3DProps> = ({
  lessonId,
  lessonTitle,
  onNavigate,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'tutor',
      text: `¡Hola! Soy Sky, tu docente virtual. Estoy listo para ayudarte con "${lessonTitle}". ¿Tienes alguna duda sobre el video o los conceptos de la lección?`,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentViseme, setCurrentViseme] = useState<VisemeShape>('sil');
  const [pose, setPose] = useState<AvatarPoseType>('idle');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [redirectAction, setRedirectAction] = useState<{ label: string; url: string } | null>(null);

  const timersRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      clearTimers();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [clearTimers]);

  const speak = useCallback(
    (text: string, visemes: VisemeFrame[]) => {
      clearTimers();
      setIsSpeaking(true);
      setPose('explaining');

      if (soundEnabled && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        utterance.rate = 1.02;
        utterance.pitch = 1.05;
        utterance.onend = () => {
          setIsSpeaking(false);
          setPose('idle');
          setCurrentViseme('sil');
        };
        window.speechSynthesis.speak(utterance);
      }

      visemes.forEach((frame) => {
        const timer = window.setTimeout(() => setCurrentViseme(frame.shape), frame.timeMs);
        timersRef.current.push(timer);
      });

      const lastTime = visemes[visemes.length - 1]?.timeMs ?? 2200;
      const idleTimer = window.setTimeout(() => {
        setCurrentViseme('sil');
        if (!('speechSynthesis' in window) || !soundEnabled) {
          setIsSpeaking(false);
          setPose('idle');
        }
      }, lastTime + 320);
      timersRef.current.push(idleTimer);
    },
    [clearTimers, soundEnabled],
  );

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText ?? inputText;
    if (!textToSend.trim() || loading) return;

    const userMsg = textToSend.trim();
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setInputText('');
    setLoading(true);

    try {
      const res = await api.post('/tutor/chat', { lessonId, message: userMsg });
      const tutorReply: string = res.data.replyText;
      const visemes: VisemeFrame[] = res.data.visemes ?? [];

      setMessages((prev) => [...prev, { sender: 'tutor', text: tutorReply }]);
      if (res.data.redirectRecommendation) {
        setRedirectAction(res.data.redirectRecommendation);
      }
      speak(tutorReply, visemes);
    } catch {
      const fallbackReply =
        'No pude conectar con la tutoría en este momento. Mientras tanto, revisa el video y prueba el formulario evaluativo de la lección.';
      setMessages((prev) => [...prev, { sender: 'tutor', text: fallbackReply }]);
      setCurrentViseme('aa');
      const timer = window.setTimeout(() => setCurrentViseme('sil'), 800);
      timersRef.current.push(timer);
    } finally {
      setLoading(false);
    }
  };

  const statusLabel = isSpeaking
    ? 'Sky está explicando'
    : loading
      ? 'Sky está pensando'
      : 'Sky está disponible';

  return (
    <div className="skylearn-card" style={styles.container}>
      <div style={styles.header}>
        <div style={styles.tutorBadge}>
          <Bot size={20} color="var(--color-sky-deep)" aria-hidden="true" />
          <span style={styles.tutorName}>Sky · Docente virtual 3D</span>
        </div>
        <div style={styles.headerActions}>
          <span style={styles.statusPill}>
            <span
              style={{ ...styles.statusDot, backgroundColor: isSpeaking ? 'var(--color-sky)' : 'var(--color-leaf)' }}
            />
            <span style={styles.statusText}>{statusLabel}</span>
          </span>
          <button
            type="button"
            style={styles.iconButton}
            onClick={() => setSoundEnabled((prev) => !prev)}
            aria-label={soundEnabled ? 'Silenciar la voz del docente' : 'Activar la voz del docente'}
          >
            {soundEnabled ? (
              <Volume2 size={20} color="var(--color-ink)" aria-hidden="true" />
            ) : (
              <VolumeX size={20} color="var(--color-ink-muted)" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <div style={styles.avatarStage}>
        <Suspense fallback={<AvatarPlaceholder />}>
          <TutorAvatar3D
            pose={pose}
            viseme={currentViseme}
            isSpeaking={isSpeaking}
            width={320}
            height={300}
          />
        </Suspense>
      </div>

      <div style={styles.messagesBox} aria-live="polite">
        {messages.map((message, index) => (
          <div
            key={`${message.sender}-${index}`}
            style={{
              ...styles.messageBubble,
              ...(message.sender === 'user' ? styles.userBubble : styles.tutorBubble),
            }}
          >
            {message.sender === 'tutor' && (
              <Bot size={18} color="var(--color-sky-deep)" style={styles.bubbleIcon} aria-hidden="true" />
            )}
            <span style={styles.messageText}>{message.text}</span>
          </div>
        ))}

        {loading && (
          <div style={{ ...styles.messageBubble, ...styles.tutorBubble }}>
            <Bot size={18} color="var(--color-sky-deep)" style={styles.bubbleIcon} aria-hidden="true" />
            <span style={styles.messageText}>Sky está preparando su respuesta…</span>
          </div>
        )}
      </div>

      {redirectAction && (
        <div style={styles.recommendationAlert}>
          <span style={styles.recText}>
            Ruta recomendada: <strong>{redirectAction.label}</strong>
          </span>
          {onNavigate && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => onNavigate(redirectAction.url)}
              style={styles.recBtn}
            >
              <span>Continuar ruta</span>
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      <div style={styles.quickQuestions}>
        <button
          type="button"
          style={styles.chipBtn}
          onClick={() => handleSendMessage('¿Me puedes explicar esto de forma sencilla?')}
          disabled={loading}
        >
          <MessageSquare size={16} aria-hidden="true" />
          <span>Explicación sencilla</span>
        </button>
        <button
          type="button"
          style={styles.chipBtn}
          onClick={() => handleSendMessage('Dame un ejemplo cotidiano')}
          disabled={loading}
        >
          <MessageSquare size={16} aria-hidden="true" />
          <span>Ejemplo cotidiano</span>
        </button>
      </div>

      <div style={styles.inputRow}>
        <input
          type="text"
          className="skylearn-input"
          placeholder="Escribe tu duda o pregunta a Sky…"
          value={inputText}
          onChange={(event) => setInputText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') void handleSendMessage();
          }}
          disabled={loading}
          aria-label="Escribe tu pregunta al docente virtual"
          style={{ flex: 1 }}
        />
        <button
          type="button"
          className="btn-big-friendly"
          onClick={() => void handleSendMessage()}
          disabled={loading || !inputText.trim()}
          style={styles.sendButton}
          aria-label="Enviar pregunta"
        >
          <Send size={20} aria-hidden="true" />
        </button>
      </div>

      <p style={styles.hint}>
        <Sparkles size={14} color="var(--color-sun-deep)" aria-hidden="true" />
        <span>Sky responde con IA usando el contexto de esta lección.</span>
      </p>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: 'var(--color-surface-elevated)',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    height: '100%',
    border: '1px solid var(--color-outline)',
    borderRadius: '24px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap',
    paddingBottom: '14px',
    borderBottom: '1px solid var(--color-outline)',
  },
  tutorBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  tutorName: {
    fontSize: '19px',
    fontWeight: 800,
    color: 'var(--color-ink)',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  statusPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    borderRadius: '999px',
    backgroundColor: 'var(--color-sky-soft)',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  statusText: {
    fontSize: '14px',
    fontWeight: 700,
    color: 'var(--color-sky-deep)',
  },
  iconButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '44px',
    height: '44px',
    borderRadius: '14px',
    border: '1px solid var(--color-outline)',
    backgroundColor: 'var(--color-surface)',
    cursor: 'pointer',
  },
  avatarStage: {
    display: 'flex',
    justifyContent: 'center',
    padding: '12px',
    borderRadius: '20px',
    backgroundColor: 'var(--color-surface-sunken)',
    border: '1px solid var(--color-outline)',
  },
  avatarPlaceholder: {
    width: '320px',
    height: '300px',
    maxWidth: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '16px',
    background: 'linear-gradient(160deg, #EFF6FF 0%, #DBEAFE 100%)',
    color: 'var(--color-ink-muted)',
    fontSize: '16px',
    fontWeight: 600,
  },
  messagesBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxHeight: '300px',
    overflowY: 'auto',
    paddingRight: '4px',
  },
  messageBubble: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '14px 16px',
    borderRadius: '20px',
    maxWidth: '92%',
  },
  tutorBubble: {
    alignSelf: 'flex-start',
    backgroundColor: 'var(--color-sky-soft)',
    color: 'var(--color-ink)',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: 'var(--color-surface-sunken)',
    color: 'var(--color-ink)',
    border: '1px solid var(--color-outline)',
  },
  bubbleIcon: {
    flexShrink: 0,
    marginTop: '2px',
  },
  messageText: {
    fontSize: '17px',
    lineHeight: 1.55,
  },
  recommendationAlert: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap',
    padding: '14px 16px',
    borderRadius: '16px',
    backgroundColor: 'var(--color-leaf-soft)',
    border: '1px solid var(--color-leaf)',
  },
  recText: {
    fontSize: '16px',
    color: 'var(--color-ink)',
  },
  recBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    minHeight: '44px',
  },
  quickQuestions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
  },
  chipBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    minHeight: '44px',
    padding: '10px 16px',
    borderRadius: '999px',
    border: '1px solid var(--color-outline)',
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-ink-muted)',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  inputRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  sendButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '56px',
    height: '56px',
    padding: 0,
    flexShrink: 0,
  },
  hint: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    margin: 0,
    fontSize: '14px',
    color: 'var(--color-ink-subtle)',
  },
};

export default TutorVirtual3D;
