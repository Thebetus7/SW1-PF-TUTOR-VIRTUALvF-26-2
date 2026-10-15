// frontend-web/src/components/TutorVirtual3D.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Volume2, VolumeX, Sparkles, ArrowRight, MessageSquare } from 'lucide-react';
import { api } from '../services/api';

interface VisemeFrame {
  timeMs: number;
  shape: 'sil' | 'aa' | 'E' | 'ih' | 'oh' | 'ou';
  weight: number;
}

interface TutorVirtual3DProps {
  lessonId: string;
  lessonTitle: string;
  onNavigate?: (url: string) => void;
}

export const TutorVirtual3D: React.FC<TutorVirtual3DProps> = ({
  lessonId,
  lessonTitle,
  onNavigate,
}) => {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'tutor'; text: string }>>([
    {
      sender: 'tutor',
      text: `¡Hola! Soy Sky, tu tutor virtual 3D. Estoy listo para ayudarte con "${lessonTitle}". ¿Tienes alguna duda sobre el video o los conceptos de la lección?`,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentViseme, setCurrentViseme] = useState<'sil' | 'aa' | 'E' | 'ih' | 'oh' | 'ou'>('sil');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [redirectAction, setRedirectAction] = useState<any | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const eyeBlinkRef = useRef<number>(0);

  // Animación del rostro del Avatar 3D de Sky
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let startTime = Date.now();

    const render = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Movimiento de flotación suave 3D
      const floatY = Math.sin(elapsed * 2) * 5;

      // 1. Cabeza (Círculo amigable Sky con gradiente)
      const grad = ctx.createRadialGradient(centerX, centerY + floatY, 20, centerX, centerY + floatY, 80);
      grad.addColorStop(0, '#53B7FF');
      grad.addColorStop(1, '#027FFF');

      ctx.beginPath();
      ctx.arc(centerX, centerY + floatY, 70, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.shadowColor = 'rgba(2, 127, 255, 0.35)';
      ctx.shadowBlur = 18;
      ctx.fill();
      ctx.shadowBlur = 0;

      // 2. Orejitas / Antenas de robot amigable
      ctx.fillStyle = '#FFC83B';
      ctx.beginPath();
      ctx.arc(centerX - 60, centerY + floatY - 40, 14, 0, Math.PI * 2);
      ctx.arc(centerX + 60, centerY + floatY - 40, 14, 0, Math.PI * 2);
      ctx.fill();

      // 3. Ojos (con parpadeo periódico)
      eyeBlinkRef.current += 0.015;
      const isBlinking = Math.sin(eyeBlinkRef.current) > 0.96;

      ctx.fillStyle = '#1D2433';
      if (isBlinking) {
        // Línea de ojos cerrados
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#1D2433';
        ctx.beginPath();
        ctx.moveTo(centerX - 35, centerY + floatY - 5);
        ctx.lineTo(centerX - 15, centerY + floatY - 5);
        ctx.moveTo(centerX + 15, centerY + floatY - 5);
        ctx.lineTo(centerX + 35, centerY + floatY - 5);
        ctx.stroke();
      } else {
        // Ojos grandes abiertos estilo anime/K-8
        ctx.beginPath();
        ctx.arc(centerX - 25, centerY + floatY - 8, 12, 0, Math.PI * 2);
        ctx.arc(centerX + 25, centerY + floatY - 8, 12, 0, Math.PI * 2);
        ctx.fill();

        // Brillo en los ojos
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(centerX - 22, centerY + floatY - 12, 4, 0, Math.PI * 2);
        ctx.arc(centerX + 28, centerY + floatY - 12, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Mejillas sonrosadas (Skylearn Sun)
      ctx.fillStyle = 'rgba(255, 200, 59, 0.4)';
      ctx.beginPath();
      ctx.arc(centerX - 42, centerY + floatY + 12, 10, 0, Math.PI * 2);
      ctx.arc(centerX + 42, centerY + floatY + 12, 10, 0, Math.PI * 2);
      ctx.fill();

      // 5. Boca sincronizada con los Visemas Faciales
      ctx.fillStyle = '#1D2433';
      ctx.strokeStyle = '#1D2433';
      ctx.lineWidth = 3;

      ctx.beginPath();
      switch (currentViseme) {
        case 'aa':
          // Boca abierta grande
          ctx.ellipse(centerX, centerY + floatY + 24, 16, 20, 0, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'oh':
        case 'ou':
          // Boca redondeada
          ctx.ellipse(centerX, centerY + floatY + 24, 10, 12, 0, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'E':
        case 'ih':
          // Boca abierta ancha
          ctx.ellipse(centerX, centerY + floatY + 24, 18, 8, 0, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'sil':
        default:
          // Sonrisa suave
          ctx.arc(centerX, centerY + floatY + 18, 14, 0.2, Math.PI - 0.2);
          ctx.stroke();
          break;
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [currentViseme]);

  // Reproducir visemas en secuencia temporal
  const playVisemeSequence = (visemes: VisemeFrame[], textToSpeak: string) => {
    if (soundEnabled && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'es-ES';
      utterance.rate = 1.05;
      utterance.pitch = 1.2; // Tono amigable infantil
      window.speechSynthesis.speak(utterance);
    }

    visemes.forEach((frame) => {
      setTimeout(() => {
        setCurrentViseme(frame.shape);
      }, frame.timeMs);
    });

    // Volver a sonrisa al terminar
    const lastFrame = visemes[visemes.length - 1];
    setTimeout(() => {
      setCurrentViseme('sil');
    }, (lastFrame?.timeMs || 2000) + 200);
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim() || loading) return;

    const userMsg = textToSend.trim();
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setInputText('');
    setLoading(true);

    try {
      const res = await api.post('/tutor/chat', {
        lessonId,
        message: userMsg,
      });

      const tutorReply = res.data.replyText;
      const visemes: VisemeFrame[] = res.data.visemes || [];

      setMessages((prev) => [...prev, { sender: 'tutor', text: tutorReply }]);
      if (res.data.redirectRecommendation) {
        setRedirectAction(res.data.redirectRecommendation);
      }

      playVisemeSequence(visemes, tutorReply);
    } catch {
      const fallbackReply = '¡Gran pregunta! Explora el video y comprueba tus conocimientos en el formulario evaluativo.';
      setMessages((prev) => [...prev, { sender: 'tutor', text: fallbackReply }]);
      setCurrentViseme('aa');
      setTimeout(() => setCurrentViseme('sil'), 800);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="skylearn-card" style={styles.container}>
      {/* Header del Tutor */}
      <div style={styles.header}>
        <div style={styles.tutorBadge}>
          <Bot size={18} color="var(--color-sky-deep)" />
          <span style={styles.tutorName}>Sky • Tutor Virtual 3D</span>
          <span style={styles.statusDot} />
        </div>
        <button
          style={styles.soundBtn}
          onClick={() => setSoundEnabled(!soundEnabled)}
          aria-label={soundEnabled ? 'Silenciar voz del tutor' : 'Activar voz del tutor'}
        >
          {soundEnabled ? <Volume2 size={18} color="var(--color-ink)" /> : <VolumeX size={18} color="var(--color-ink-muted)" />}
        </button>
      </div>

      {/* Canvas del Avatar 3D */}
      <div style={styles.avatarContainer}>
        <canvas ref={canvasRef} width={240} height={200} style={styles.canvas} />
        <div style={styles.visemeBadge}>
          <Sparkles size={12} color="var(--color-sun)" />
          <span>Visema Facial: {currentViseme}</span>
        </div>
      </div>

      {/* Historial de Diálogo */}
      <div style={styles.messagesBox}>
        {messages.map((m, idx) => (
          <div
            key={idx}
            style={{
              ...styles.messageBubble,
              ...(m.sender === 'user' ? styles.userBubble : styles.tutorBubble),
            }}
          >
            {m.sender === 'tutor' && <Bot size={16} color="var(--color-sky-deep)" style={{ flexShrink: 0 }} />}
            <span style={styles.messageText}>{m.text}</span>
          </div>
        ))}

        {loading && (
          <div style={{ ...styles.messageBubble, ...styles.tutorBubble }}>
            <Bot size={16} color="var(--color-sky-deep)" />
            <span style={styles.messageText}>Sky está pensando su respuesta con IA...</span>
          </div>
        )}
      </div>

      {/* Botón de Redirección Recomendada de Ruta */}
      {redirectAction && (
        <div style={styles.recommendationAlert}>
          <span style={styles.recText}>Ruta recomendada: <strong>{redirectAction.label}</strong></span>
          {onNavigate && (
            <button
              className="btn-secondary"
              onClick={() => onNavigate(redirectAction.url)}
              style={styles.recBtn}
            >
              <span>Continuar Ruta</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      )}

      {/* Sugerencias Rápidas de Preguntas */}
      <div style={styles.quickQuestions}>
        <button
          style={styles.chipBtn}
          onClick={() => handleSendMessage('¿Me puedes explicar esto de forma sencilla?')}
          disabled={loading}
        >
          <MessageSquare size={12} />
          <span>Explicación sencilla</span>
        </button>
        <button
          style={styles.chipBtn}
          onClick={() => handleSendMessage('Dame un ejemplo cotidiano')}
          disabled={loading}
        >
          <MessageSquare size={12} />
          <span>Ejemplo cotidiano</span>
        </button>
      </div>

      {/* Input de Envío */}
      <div style={styles.inputRow}>
        <input
          type="text"
          className="skylearn-input"
          placeholder="Escribe tu duda o pregunta a Sky..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          disabled={loading}
          style={{ flex: 1 }}
        />
        <button
          className="btn-big-friendly"
          onClick={() => handleSendMessage()}
          disabled={loading || !inputText.trim()}
          style={{ padding: '12px 18px' }}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: '#FFFFFF',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    border: '2px solid var(--color-sky-soft)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '14px',
    borderBottom: '1px solid var(--color-outline)',
  },
  tutorBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  tutorName: {
    fontSize: '15px',
    fontWeight: 800,
    color: 'var(--color-ink)',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-leaf)',
  },
  soundBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: 'var(--radius-full)',
  },
  avatarContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 0',
  },
  canvas: {
    borderRadius: 'var(--radius-md)',
  },
  visemeBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    color: 'var(--color-ink-muted)',
    fontWeight: 700,
    marginTop: '4px',
    backgroundColor: 'var(--color-surface-sunken)',
    padding: '2px 8px',
    borderRadius: 'var(--radius-full)',
  },
  messagesBox: {
    flex: 1,
    minHeight: '160px',
    maxHeight: '240px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    padding: '12px',
    backgroundColor: 'var(--color-surface-sunken)',
    borderRadius: 'var(--radius-md)',
    marginBottom: '14px',
  },
  messageBubble: {
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    fontSize: '13px',
    lineHeight: 1.5,
    maxWidth: '90%',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: 'var(--color-sky)',
    color: '#FFFFFF',
    borderBottomRightRadius: '2px',
  },
  tutorBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    color: 'var(--color-ink)',
    border: '1px solid var(--color-outline)',
    borderBottomLeftRadius: '2px',
  },
  messageText: {
    flex: 1,
  },
  recommendationAlert: {
    backgroundColor: 'var(--color-sun-soft)',
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
  },
  recText: {
    fontSize: '12px',
    color: '#7A5200',
  },
  recBtn: {
    padding: '4px 10px',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  quickQuestions: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
    flexWrap: 'wrap',
  },
  chipBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: 'var(--radius-full)',
    backgroundColor: '#FFFFFF',
    border: '1px solid var(--color-outline)',
    fontSize: '12px',
    fontWeight: 700,
    color: 'var(--color-ink-muted)',
    cursor: 'pointer',
  },
  inputRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
};
