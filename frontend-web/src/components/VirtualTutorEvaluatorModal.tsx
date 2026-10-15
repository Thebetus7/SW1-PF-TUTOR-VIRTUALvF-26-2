// frontend-web/src/components/VirtualTutorEvaluatorModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Sparkles,
  CheckCircle2,
  Award,
  Bot,
  Activity,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { HumanAvatarCanvas } from './HumanAvatarCanvas';
import type {
  AvatarPoseType,
  VisemeShape,
  VisemeFrame,
  FinalEvaluationSummary,
  TestConnectionResponse,
  StartModuleEvaluationResponse,
  AnswerModuleEvaluationResponse,
} from '../types/tutor.types';

interface VirtualTutorEvaluatorModalProps {
  moduleId: string;
  moduleTitle: string;
  onClose: () => void;
  onFinish?: (summary: FinalEvaluationSummary) => void;
}

export const VirtualTutorEvaluatorModal: React.FC<VirtualTutorEvaluatorModalProps> = ({
  moduleId,
  moduleTitle,
  onClose,
  onFinish,
}) => {
  // Estados de la sesión evaluativa
  const [loading, setLoading] = useState<boolean>(true);
  const [totalLessons, setTotalLessons] = useState<number>(0);
  const [currentLessonIndex, setCurrentLessonIndex] = useState<number>(0);
  const [currentLessonTitle, setCurrentLessonTitle] = useState<string>('');
  const [dialogueHistory, setDialogueHistory] = useState<
    Array<{ sender: 'tutor' | 'student'; text: string; isCorrect?: boolean }>
  >([]);

  // Estados del avatar y audio
  const [pose, setPose] = useState<AvatarPoseType>('idle');
  const [currentViseme, setCurrentViseme] = useState<VisemeShape>('sil');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Estados de entrada del estudiante
  const [inputText, setInputText] = useState<string>('');
  const [interimVoiceText, setInterimVoiceText] = useState<string>('');
  const [processingAnswer, setProcessingAnswer] = useState<boolean>(false);

  // Estados de diagnóstico de la API de Google
  const [testingConnection, setTestingConnection] = useState<boolean>(false);
  const [apiConnectionStatus, setApiConnectionStatus] = useState<string | null>(null);

  // Estado de finalización
  const [finalSummary, setFinalSummary] = useState<FinalEvaluationSummary | null>(null);

  // Referencias para reconocimiento de voz y temporizadores
  const recognitionRef = useRef<any>(null);
  const visemeTimersRef = useRef<number[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll del historial de diálogo
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [dialogueHistory, interimVoiceText]);

  const clearVisemeTimers = () => {
    visemeTimersRef.current.forEach((t) => clearTimeout(t));
    visemeTimersRef.current = [];
  };

  // Limpieza de síntesis de voz y visemas al desmontar
  useEffect(() => {
    return () => {
      clearVisemeTimers();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Reproducir visemas temporizados y voz con Web Speech API
  const speakAndAnimate = (text: string, visemes: VisemeFrame[], targetPose: AvatarPoseType = 'explaining') => {
    clearVisemeTimers();
    setIsSpeaking(true);
    setPose(targetPose);

    if (soundEnabled && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 1.02;
      utterance.pitch = 1.05; // Voz docente profesional y cálida

      utterance.onend = () => {
        setIsSpeaking(false);
        setCurrentViseme('sil');
        setPose('idle');
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        setCurrentViseme('sil');
        setPose('idle');
      };

      window.speechSynthesis.speak(utterance);
    } else {
      // Si el audio está silenciado, simular fin según longitud
      const durationMs = Math.min(6000, Math.max(1800, text.length * 55));
      setTimeout(() => {
        setIsSpeaking(false);
        setCurrentViseme('sil');
        setPose('idle');
      }, durationMs);
    }

    // Programar visemas de labios
    visemes.forEach((frame) => {
      const timer = window.setTimeout(() => {
        setCurrentViseme(frame.shape);
      }, frame.timeMs);
      visemeTimersRef.current.push(timer);
    });

    const lastTime = visemes[visemes.length - 1]?.timeMs || 2500;
    const finalTimer = window.setTimeout(() => {
      setCurrentViseme('sil');
    }, lastTime + 250);
    visemeTimersRef.current.push(finalTimer);
  };

  // Cargar inicio de evaluación modular
  useEffect(() => {
    const initEvaluation = async () => {
      setLoading(true);
      try {
        const res = await api.post<StartModuleEvaluationResponse>('/tutor/module-evaluation/start', {
          moduleId,
        });

        const data = res.data;
        setTotalLessons(data.totalLessons);
        setCurrentLessonIndex(data.currentLessonIndex);
        setCurrentLessonTitle(data.currentLessonTitle);

        setDialogueHistory([
          {
            sender: 'tutor',
            text: `¡Bienvenido a la evaluación del módulo "${data.moduleTitle}"! Evaluaremos 1 pregunta clave por cada lección. Comenzamos con la lección: "${data.currentLessonTitle}".\n\n${data.questionText}`,
          },
        ]);

        speakAndAnimate(
          `¡Bienvenido a la evaluación! Evaluaremos una pregunta clave por cada lección. Comenzamos con ${data.currentLessonTitle}. ${data.questionText}`,
          data.visemes,
          'explaining'
        );
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || 'Error al iniciar la evaluación con el Docente Virtual.';
        setDialogueHistory([
          {
            sender: 'tutor',
            text: `Hubo un inconveniente: ${errorMsg}. Por favor verifica que el módulo tenga lecciones publicadas.`,
          },
        ]);
        setPose('encouraging');
      } finally {
        setLoading(false);
      }
    };

    initEvaluation();
  }, [moduleId]);

  // Botón discreto: Probar Conexión en Vivo con Google Gemini
  const handleTestConnection = async () => {
    if (testingConnection) return;
    setTestingConnection(true);
    setApiConnectionStatus('Consultando Google Gemini en vivo...');

    try {
      const res = await api.post<TestConnectionResponse>('/tutor/test-connection', {
        demoMode: true,
      });

      const { phrase, timestamp, visemes } = res.data;
      const formattedTime = new Date(timestamp).toLocaleTimeString();

      setApiConnectionStatus(`Google Gemini Conectado (En Vivo ${formattedTime})`);

      setDialogueHistory((prev) => [
        ...prev,
        {
          sender: 'tutor',
          text: `[Prueba de Conexión Google API]: "${phrase}"`,
        },
      ]);

      speakAndAnimate(phrase, visemes, 'explaining');
    } catch {
      setApiConnectionStatus('Error al conectar con la API de Google');
    } finally {
      setTestingConnection(false);
    }
  };

  // Manejo del Reconocimiento de Voz con Web Speech API (1 toque)
  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Tu navegador no soporta Web Speech API nativa. Puedes escribir tu respuesta en el cuadro de texto.');
      return;
    }

    if (isListening) {
      // Detener captura manual
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      setPose('idle');
      return;
    }

    // Iniciar reconocimiento
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-ES';
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsListening(true);
        setPose('listening'); // Brazo en mentón al escuchar
        setInterimVoiceText('');
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setInterimVoiceText(transcript);
        setInputText(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
        setPose('idle');
      };

      recognition.onend = () => {
        setIsListening(false);
        setPose('idle');
        // Si se capturó texto por voz, enviarlo automáticamente
        if (inputText.trim() || interimVoiceText.trim()) {
          const finalTxt = (interimVoiceText || inputText).trim();
          handleSendAnswer(finalTxt);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
      setPose('idle');
    }
  };

  // Enviar respuesta a la lección actual
  const handleSendAnswer = async (customAnswer?: string) => {
    const answerToSend = (customAnswer !== undefined ? customAnswer : inputText).trim();
    if (!answerToSend || processingAnswer || finalSummary) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    setDialogueHistory((prev) => [
      ...prev,
      {
        sender: 'student',
        text: answerToSend,
      },
    ]);

    setInputText('');
    setInterimVoiceText('');
    setProcessingAnswer(true);
    setPose('idle');

    try {
      const res = await api.post<AnswerModuleEvaluationResponse>('/tutor/module-evaluation/answer', {
        moduleId,
        lessonIndex: currentLessonIndex,
        userResponse: answerToSend,
      });

      const { isCorrect, feedbackText, visemes, avatarEmotion, hasNextLesson, nextQuestion, finalSummary: summary } =
        res.data;

      // Actualizar diálogo con retroalimentación del docente
      setDialogueHistory((prev) => [
        ...prev,
        {
          sender: 'tutor',
          text: feedbackText,
          isCorrect,
        },
      ]);

      speakAndAnimate(feedbackText, visemes, avatarEmotion);

      if (isCorrect) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      }

      if (hasNextLesson && nextQuestion) {
        // Avanzar a la siguiente lección
        setCurrentLessonIndex(nextQuestion.lessonIndex);
        setCurrentLessonTitle(nextQuestion.lessonTitle);

        setTimeout(() => {
          setDialogueHistory((prev) => [
            ...prev,
            {
              sender: 'tutor',
              text: `Pregunta de la lección "${nextQuestion.lessonTitle}":\n${nextQuestion.questionText}`,
            },
          ]);
          // Pronunciar la siguiente pregunta
          const nextVisemes = visemes.slice(0, 20);
          speakAndAnimate(nextQuestion.questionText, nextVisemes, 'explaining');
        }, 3200);
      } else if (summary) {
        // Conclusión del módulo
        setFinalSummary(summary);
        setPose(summary.approved ? 'celebrating' : 'encouraging');
        if (summary.approved) {
          confetti({
            particleCount: 120,
            spread: 90,
            origin: { y: 0.5 },
          });
        }
        if (onFinish) {
          onFinish(summary);
        }
      }
    } catch (_err: any) {
      const errReply = 'No pudimos validar la respuesta en este momento. Intenta nuevamente.';
      setDialogueHistory((prev) => [
        ...prev,
        {
          sender: 'tutor',
          text: errReply,
        },
      ]);
      setPose('encouraging');
    } finally {
      setProcessingAnswer(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal} role="dialog" aria-modal="true">
        {/* Barra Superior con Diagnóstico y Controles */}
        <div style={styles.topBar}>
          <div style={styles.topBarLeft}>
            <div style={styles.tutorBadge}>
              <Bot size={18} color="#2563EB" />
              <span style={styles.tutorTitle}>Docente Virtual Humano • Skylearn</span>
            </div>

            {/* Botón Discreto de Prueba de Conexión con Google API */}
            <button
              onClick={handleTestConnection}
              disabled={testingConnection}
              style={{
                ...styles.testConnectionBtn,
                opacity: testingConnection ? 0.7 : 1,
              }}
              title="Presiona para generar una frase en tiempo real con Google Gemini y probar audio"
            >
              <Activity size={13} color="#2563EB" />
              <span>{testingConnection ? 'Probando...' : 'Probar Conexión IA'}</span>
            </button>

            {apiConnectionStatus && (
              <span style={styles.statusPill}>
                <span style={styles.onlineDot} />
                {apiConnectionStatus}
              </span>
            )}
          </div>

          <div style={styles.topBarRight}>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              style={styles.soundBtn}
              title={soundEnabled ? 'Silenciar voz del tutor' : 'Activar voz del tutor'}
            >
              {soundEnabled ? <Volume2 size={18} color="#1E293B" /> : <VolumeX size={18} color="#94A3B8" />}
            </button>
            <button onClick={onClose} style={styles.closeBtn} aria-label="Cerrar evaluación">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Contenido Principal: Dos Columnas (Avatar y Diálogo) */}
        <div style={styles.mainGrid}>
          {/* Columna Izquierda: Avatar Humanoide Articulado 2.5D */}
          <div style={styles.avatarColumn}>
            <div style={styles.avatarCard}>
              <HumanAvatarCanvas
                pose={pose}
                viseme={currentViseme}
                isSpeaking={isSpeaking}
                isListening={isListening}
                width={360}
                height={330}
              />

              {/* Indicador de Estado del Avatar */}
              <div style={styles.avatarStateBar}>
                {isSpeaking && (
                  <span style={styles.stateSpeaking}>
                    <Sparkles size={13} />
                    <span>El docente está hablando...</span>
                  </span>
                )}
                {isListening && (
                  <span style={styles.stateListening}>
                    <Mic size={13} />
                    <span>Escuchando tu respuesta (brazo en mentón)...</span>
                  </span>
                )}
                {!isSpeaking && !isListening && (
                  <span style={styles.stateIdle}>
                    <span>Postura del docente: <strong>{pose}</strong></span>
                  </span>
                )}
              </div>
            </div>

            {/* Progreso del Módulo */}
            <div style={styles.progressCard}>
              <div style={styles.progressHeader}>
                <span style={styles.progressLabel}>Progreso del Módulo:</span>
                <span style={styles.progressCounter}>
                  Lección {Math.min(currentLessonIndex + 1, totalLessons)} de {totalLessons}
                </span>
              </div>
              <div style={styles.progressBarBg}>
                <div
                  style={{
                    ...styles.progressBarFill,
                    width: `${totalLessons > 0 ? ((currentLessonIndex + (finalSummary ? 1 : 0)) / totalLessons) * 100 : 0}%`,
                  }}
                />
              </div>
              <span style={styles.moduleNameText}>
                Módulo: {moduleTitle} {currentLessonTitle ? `• ${currentLessonTitle}` : ''}
              </span>
            </div>
          </div>

          {/* Columna Derecha: Diálogo Evaluativo e Interacción */}
          <div style={styles.dialogueColumn}>
            {/* Pantalla Final de Dictamen Pedagógico */}
            {finalSummary ? (
              <div style={styles.finalSummaryCard}>
                <div style={styles.summaryBadge}>
                  <Award size={36} color={finalSummary.approved ? '#059669' : '#D97706'} />
                  <h3 style={styles.summaryTitle}>
                    {finalSummary.approved ? '¡Evaluación Aprobada con Éxito!' : 'Evaluación Completada'}
                  </h3>
                  <span style={styles.summaryScore}>
                    Calificación formativa: <strong>{finalSummary.scorePercentage}%</strong>
                  </span>
                </div>
                <p style={styles.summaryRemarks}>{finalSummary.closingRemarks}</p>
                <div style={styles.summaryActions}>
                  <button onClick={onClose} className="btn-primary" style={{ padding: '10px 24px' }}>
                    <CheckCircle2 size={18} />
                    <span>Finalizar y Volver al Temario</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Historial de Preguntas y Respuestas */}
                <div style={styles.messagesBox}>
                  {loading && (
                    <div style={styles.loadingBubble}>
                      <Bot size={18} color="#2563EB" />
                      <span>El Docente Virtual está organizando las preguntas del módulo...</span>
                    </div>
                  )}

                  {dialogueHistory.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        ...styles.bubble,
                        ...(item.sender === 'tutor' ? styles.tutorBubble : styles.studentBubble),
                      }}
                    >
                      <div style={styles.bubbleHeader}>
                        <span style={styles.senderName}>
                          {item.sender === 'tutor' ? 'Docente Virtual' : 'Tú (Estudiante)'}
                        </span>
                        {item.isCorrect !== undefined && (
                          <span
                            style={{
                              ...styles.correctTag,
                              backgroundColor: item.isCorrect ? '#DEF7EC' : '#FEF3C7',
                              color: item.isCorrect ? '#046C4E' : '#92400E',
                            }}
                          >
                            {item.isCorrect ? 'Acierto' : 'Refuerzo'}
                          </span>
                        )}
                      </div>
                      <p style={styles.bubbleText}>{item.text}</p>
                    </div>
                  ))}

                  {/* Transcripción en tiempo real de voz */}
                  {isListening && interimVoiceText && (
                    <div style={{ ...styles.bubble, ...styles.studentBubble, opacity: 0.85 }}>
                      <span style={styles.senderName}>Escuchando por voz:</span>
                      <p style={styles.bubbleText}>{interimVoiceText}</p>
                    </div>
                  )}

                  {processingAnswer && (
                    <div style={styles.loadingBubble}>
                      <Bot size={18} color="#2563EB" />
                      <span>El docente está analizando tu respuesta con IA...</span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Área de Entrada: Botón Micrófono Intuitivo + Input de Texto */}
                <div style={styles.inputArea}>
                  <div style={styles.inputControls}>
                    {/* Botón de Micrófono (1 Clic) */}
                    <button
                      onClick={toggleSpeechRecognition}
                      disabled={processingAnswer}
                      style={{
                        ...styles.micBtn,
                        backgroundColor: isListening ? '#EF4444' : '#EFF6FF',
                        color: isListening ? '#FFFFFF' : '#2563EB',
                        borderColor: isListening ? '#DC2626' : '#BFDBFE',
                      }}
                      title={isListening ? 'Detener reconocimiento' : 'Hablar con el Docente Virtual'}
                    >
                      {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                      <span>{isListening ? 'Escuchando...' : 'Hablar'}</span>
                    </button>

                    {/* Input de Texto Alternativo */}
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSendAnswer();
                      }}
                      placeholder={isListening ? 'Escuchando tu voz...' : 'Escribe tu respuesta aquí si no usas voz...'}
                      disabled={processingAnswer}
                      style={styles.textInput}
                    />

                    {/* Botón de Enviar */}
                    <button
                      onClick={() => handleSendAnswer()}
                      disabled={!inputText.trim() || processingAnswer}
                      className="btn-primary"
                      style={styles.sendBtn}
                      title="Enviar respuesta"
                    >
                      <Send size={18} />
                    </button>
                  </div>

                  <span style={styles.helperTip}>
                    Tip: Puedes hablar libremente presionando "Hablar" o tipear en la caja de texto. Ambas opciones tienen el mismo valor pedagógico.
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    padding: '16px',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    maxWidth: '1060px',
    width: '100%',
    height: '92vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
    overflow: 'hidden',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 24px',
    borderBottom: '1px solid #E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  topBarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  tutorBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: 700,
    color: '#0F172A',
    fontSize: '15px',
  },
  tutorTitle: {
    fontSize: '15px',
  },
  testConnectionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#2563EB',
    backgroundColor: '#EFF6FF',
    border: '1px solid #BFDBFE',
    borderRadius: '6px',
    padding: '5px 10px',
    cursor: 'pointer',
  },
  statusPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    fontWeight: 600,
    color: '#059669',
    backgroundColor: '#ECFDF5',
    padding: '4px 8px',
    borderRadius: '6px',
    border: '1px solid #A7F3D0',
  },
  onlineDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#10B981',
  },
  topBarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  soundBtn: {
    background: 'none',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    padding: '6px',
    cursor: 'pointer',
    color: '#334155',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#64748B',
    padding: '6px',
    borderRadius: '8px',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '400px 1fr',
    flex: 1,
    overflow: 'hidden',
  },
  avatarColumn: {
    borderRight: '1px solid #E2E8F0',
    backgroundColor: '#F8FAFC',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '18px 16px',
    gap: '14px',
    overflowY: 'auto',
  },
  avatarCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  avatarStateBar: {
    minHeight: '26px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateSpeaking: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#2563EB',
  },
  stateListening: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#DC2626',
  },
  stateIdle: {
    fontSize: '12px',
    color: '#64748B',
  },
  progressCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '12px 14px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    marginBottom: '6px',
  },
  progressLabel: {
    fontWeight: 600,
    color: '#334155',
  },
  progressCounter: {
    fontWeight: 700,
    color: '#2563EB',
  },
  progressBarBg: {
    width: '100%',
    height: '8px',
    borderRadius: '999px',
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: '999px',
    transition: 'width 0.4s ease',
  },
  moduleNameText: {
    fontSize: '11px',
    color: '#64748B',
    marginTop: '6px',
    display: 'block',
  },
  dialogueColumn: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  messagesBox: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  bubble: {
    maxWidth: '82%',
    padding: '12px 16px',
    borderRadius: '14px',
    lineHeight: '1.45',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  },
  tutorBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    border: '1px solid #DBEAFE',
    borderBottomLeftRadius: '3px',
  },
  studentBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderBottomRightRadius: '3px',
  },
  bubbleHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    marginBottom: '4px',
  },
  senderName: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#475569',
    textTransform: 'uppercase',
  },
  correctTag: {
    fontSize: '11px',
    fontWeight: 700,
    padding: '2px 6px',
    borderRadius: '4px',
  },
  bubbleText: {
    margin: 0,
    fontSize: '14px',
    color: '#0F172A',
    whiteSpace: 'pre-wrap',
  },
  loadingBubble: {
    alignSelf: 'flex-start',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#64748B',
    fontStyle: 'italic',
    padding: '8px 12px',
  },
  inputArea: {
    borderTop: '1px solid #E2E8F0',
    padding: '16px 20px',
    backgroundColor: '#F8FAFC',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  inputControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  micBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: '14px',
    flexShrink: 0,
    transition: 'all 0.2s ease',
  },
  textInput: {
    flex: 1,
    padding: '10px 16px',
    borderRadius: '10px',
    border: '1px solid #CBD5E1',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#FFFFFF',
  },
  sendBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 16px',
    borderRadius: '10px',
    flexShrink: 0,
  },
  helperTip: {
    fontSize: '11px',
    color: '#64748B',
    paddingLeft: '4px',
  },
  finalSummaryCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: '32px 40px',
    textAlign: 'center',
  },
  summaryBadge: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '16px',
  },
  summaryTitle: {
    fontSize: '22px',
    fontWeight: 800,
    color: '#0F172A',
    margin: 0,
  },
  summaryScore: {
    fontSize: '16px',
    color: '#334155',
  },
  summaryRemarks: {
    fontSize: '15px',
    color: '#475569',
    maxWidth: '520px',
    lineHeight: '1.5',
    marginBottom: '24px',
  },
  summaryActions: {
    display: 'flex',
    gap: '12px',
  },
};
