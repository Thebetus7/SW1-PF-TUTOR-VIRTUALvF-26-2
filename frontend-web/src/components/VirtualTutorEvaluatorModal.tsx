// frontend-web/src/components/VirtualTutorEvaluatorModal.tsx
import React, { Suspense, lazy, useState, useEffect, useRef } from "react";
import {
  X,
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  CheckCircle2,
  Award,
  Bot,
  Activity,
  Settings2,
  RotateCcw,
  Square,
  Keyboard,
  ChevronRight,
} from "lucide-react";
import confetti from "canvas-confetti";
import { isAxiosError } from "axios";
import { createPortal } from "react-dom";
import "./tutor-evaluation.css";
import { useTutorSpeech } from "../hooks/useTutorSpeech";
import { TutorSpeechControls } from "./TutorSpeechControls";
import {
  GESTURE_LABELS,
  type AvatarGesture,
  type GestureSelection,
} from "./avatarGestures";
import { api } from "../services/api";
import type {
  AvatarPoseType,
  VisemeFrame,
  SpeechSegment,
  FinalEvaluationSummary,
  TestConnectionResponse,
  StartModuleEvaluationResponse,
  AnswerModuleEvaluationResponse,
} from "../types/tutor.types";

interface RecognitionResultEvent {
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
}
interface RecognitionEngine {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onstart: (() => void) | null;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionWindow = Window & {
  SpeechRecognition?: new () => RecognitionEngine;
  webkitSpeechRecognition?: new () => RecognitionEngine;
};

const TutorAvatar3D = lazy(() => import("./TutorAvatar"));

const AvatarLoader: React.FC = () => (
  <div
    style={{
      width: "100%",
      maxWidth: 320,
      aspectRatio: "320 / 280",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "16px",
      background: "var(--color-surface-sunken)",
      color: "var(--color-ink-muted)",
      fontSize: "14px",
      fontWeight: 600,
    }}
  >
    Preparando al docente virtual…
  </div>
);

/** Lenguaje natural para el estado del docente */
const POSE_LABELS: Record<AvatarPoseType, string> = {
  idle: "esperando tu respuesta",
  explaining: "explicando el tema",
  listening: "escuchándote con atención",
  celebrating: "felicitándote por tu avance",
  encouraging: "animándote a seguir",
};

interface VirtualTutorEvaluatorModalProps {
  moduleId: string;
  moduleTitle: string;
  isSimulation?: boolean;
  onClose: () => void;
  onFinish?: (summary: FinalEvaluationSummary) => void;
}

export const VirtualTutorEvaluatorModal: React.FC<
  VirtualTutorEvaluatorModalProps
> = ({ moduleId, moduleTitle, isSimulation = false, onClose, onFinish }) => {
  // Estados de la sesión evaluativa
  const [settingsOpen, setSettingsOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const settingsPanelRef = useRef<HTMLElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const settingsWereOpenRef = useRef(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = () => {
      if (settingsOpen) setSettingsOpen(false);
      else onClose();
    };
  }, [onClose, settingsOpen]);
  useEffect(() => {
    if (settingsOpen)
      settingsPanelRef.current
        ?.querySelector<HTMLButtonElement>("button")
        ?.focus();
    else if (settingsWereOpenRef.current) settingsButtonRef.current?.focus();
    settingsWereOpenRef.current = settingsOpen;
  }, [settingsOpen]);
  useEffect(() => {
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const controls = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex="0"]',
        ) || [],
      ).filter(
        (el) => el.getClientRects().length > 0 && !el.closest("[inert]"),
      );
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalLessons, setTotalLessons] = useState<number>(0);
  const [currentLessonIndex, setCurrentLessonIndex] = useState<number>(0);
  const [currentLessonTitle, setCurrentLessonTitle] = useState<string>("");
  const [dialogueHistory, setDialogueHistory] = useState<
    Array<{ sender: "tutor" | "student"; text: string; isCorrect?: boolean }>
  >([]);

  // Siguiente pregunta pendiente para avance fluido
  const [pendingNextQuestion, setPendingNextQuestion] = useState<{
    lessonIndex: number;
    lessonTitle: string;
    questionText: string;
    visemes?: VisemeFrame[];
  } | null>(null);

  // Estados del avatar y audio
  const [gestureSelection, setGestureSelection] =
    useState<GestureSelection>("auto");
  const [activeGesture, setActiveGesture] = useState<AvatarGesture>("rest");
  const [pose, setPose] = useState<AvatarPoseType>("idle");
  const [isListening, setIsListening] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Referencia viva para el estado de sonido (evita stale closure en callbacks de audio)
  const soundEnabledRef = useRef<boolean>(true);
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Estados de entrada del estudiante
  const [inputText, setInputText] = useState<string>("");
  const [interimVoiceText, setInterimVoiceText] = useState<string>("");
  const [processingAnswer, setProcessingAnswer] = useState<boolean>(false);
  const processingRef = useRef(false);
  const [voiceError, setVoiceError] = useState("");

  // Estados de diagnóstico de la API de Google
  const [testingConnection, setTestingConnection] = useState<boolean>(false);
  const [apiConnectionStatus, setApiConnectionStatus] = useState<string | null>(
    null,
  );

  // Estado de finalización
  const [finalSummary, setFinalSummary] =
    useState<FinalEvaluationSummary | null>(null);

  // Referencias para reconocimiento de voz y temporizadores
  const recognitionRef = useRef<RecognitionEngine | null>(null);
  const visemeTimersRef = useRef<number[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll del historial de diálogo
  useEffect(() => {
    const messages = messagesScrollRef.current;
    messages?.scrollTo({
      top: messages.scrollHeight,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }, [dialogueHistory, interimVoiceText, pendingNextQuestion]);

  const clearVisemeTimers = () => {
    visemeTimersRef.current.forEach((t) => clearTimeout(t));
    visemeTimersRef.current = [];
  };

  // Silenciar / Activar sonido con cancelación inmediata
  const handleToggleSound = () => {
    const nextSound = !soundEnabled;
    setSoundEnabled(nextSound);
    soundEnabledRef.current = nextSound;

    if (!nextSound) {
      speech.stop();
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      clearVisemeTimers();
      setPose("idle");
    }
  };

  // Limpieza total al desmontar
  useEffect(() => {
    return () => {
      clearVisemeTimers();
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  const speech = useTutorSpeech();
  const sessionIdRef = useRef("");
  const [voiceConversation, setVoiceConversation] = useState(false);
  const voiceConversationRef = useRef(false);
  useEffect(() => {
    voiceConversationRef.current = voiceConversation;
  }, [voiceConversation]);
  const startListeningRef = useRef<() => void>(() => {});
  const submitRef = useRef<(text: string) => void>(() => {});
  const isSpeaking = speech.speaking;
  const currentViseme = speech.viseme;
  const speakAndAnimate = (
    text: string,
    _visemes: VisemeFrame[],
    targetPose: AvatarPoseType = "explaining",
    _segments?: SpeechSegment[],
    onComplete?: () => void,
  ) => {
    setPose(targetPose);
    if (!soundEnabledRef.current) {
      onComplete?.();
      return;
    }
    void speech.speak(text, () => {
      setPose("idle");
      onComplete?.();
      if (!onComplete && voiceConversationRef.current)
        startListeningRef.current();
    });
  };
  const speakAndAnimateRef = useRef(speakAndAnimate);
  useEffect(() => {
    speakAndAnimateRef.current = speakAndAnimate;
  });
  // Cargar inicio de evaluación modular
  useEffect(() => {
    let isMounted = true;
    const initEvaluation = async () => {
      setLoading(true);
      try {
        const res = await api.post<StartModuleEvaluationResponse>(
          "/tutor/module-evaluation/start",
          {
            moduleId,
          },
        );
        sessionIdRef.current = res.data.sessionId;

        if (!isMounted) return;

        const data = res.data;
        setTotalLessons(data.totalLessons);
        setCurrentLessonIndex(data.currentLessonIndex);
        setCurrentLessonTitle(data.currentLessonTitle);

        setDialogueHistory([
          {
            sender: "tutor",
            text: data.questionText,
          },
        ]);

        speakAndAnimateRef.current(
          data.questionText,
          data.visemes,
          "explaining",
          data.speechSegments,
        );
      } catch (err: unknown) {
        if (!isMounted) return;
        const responseMessage = isAxiosError<{
          detail?: string;
          message?: string | string[];
        }>(err)
          ? err.response?.data
          : undefined;
        const errorMsg =
          responseMessage?.detail ||
          responseMessage?.message ||
          "Error al iniciar la sesión con el Docente Virtual.";
        setDialogueHistory([
          {
            sender: "tutor",
            text: `Hubo un inconveniente: ${errorMsg}`,
          },
        ]);
        setPose("encouraging");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initEvaluation();

    return () => {
      isMounted = false;
    };
  }, [moduleId]);

  // Probar Conexión con IA Google Gemini
  const handleTestConnection = async () => {
    if (testingConnection) return;
    setTestingConnection(true);
    setApiConnectionStatus("Consultando IA...");

    try {
      const res = await api.post<TestConnectionResponse>(
        "/tutor/test-connection",
        {
          demoMode: true,
        },
      );

      const { phrase, timestamp, visemes } = res.data;
      const formattedTime = new Date(timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      setApiConnectionStatus(
        res.data.success
          ? `IA Conectada (${formattedTime})`
          : "IA no disponible",
      );

      setDialogueHistory((prev) => [
        ...prev,
        {
          sender: "tutor",
          text: `[Prueba de Conexión]: "${phrase}"`,
        },
      ]);

      speakAndAnimate(phrase, visemes, "explaining");
    } catch {
      setApiConnectionStatus("Error en API");
    } finally {
      setTestingConnection(false);
    }
  };

  // Reconocimiento de Voz
  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      (window as RecognitionWindow).SpeechRecognition ||
      (window as RecognitionWindow).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceError(
        "Este navegador no dispone de reconocimiento de voz. Puedes escribir tu respuesta.",
      );
      setVoiceConversation(false);
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      setPose("idle");
      return;
    }

    try {
      speech.stop();
      setVoiceError("");
      let failed = false;
      let finalTranscript = "";
      const recognition = new SpeechRecognition();
      recognition.lang = "es-ES";
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsListening(true);
        setPose("listening");
        setInterimVoiceText("");
      };

      recognition.onresult = (event: RecognitionResultEvent) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        if (event.results[event.results.length - 1].isFinal)
          finalTranscript = transcript;
        setInterimVoiceText(transcript);
        setInputText(transcript);
      };

      recognition.onerror = () => {
        failed = true;
        setVoiceError(
          "No pudimos escuchar tu respuesta. Revisa el permiso del micrófono o escribe tu respuesta.",
        );
        setVoiceConversation(false);
        setIsListening(false);
        setPose("idle");
      };

      recognition.onend = () => {
        setIsListening(false);
        setPose("idle");
        if (!failed && voiceConversationRef.current && finalTranscript.trim())
          submitRef.current(finalTranscript);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
      setPose("idle");
    }
  };

  // Avanzar a la siguiente pregunta de forma suave y controlada
  const handleAdvanceToNextQuestion = (nextQ: {
    lessonIndex: number;
    lessonTitle: string;
    questionText: string;
    visemes?: VisemeFrame[];
  }) => {
    setPendingNextQuestion(null);
    setCurrentLessonIndex(nextQ.lessonIndex);
    setCurrentLessonTitle(nextQ.lessonTitle);

    setDialogueHistory((prev) => [
      ...prev,
      {
        sender: "tutor",
        text: nextQ.questionText,
      },
    ]);

    const nextVisemes =
      nextQ.visemes && nextQ.visemes.length > 0 ? nextQ.visemes : [];
    speakAndAnimate(nextQ.questionText, nextVisemes, "explaining");
  };

  // Enviar respuesta a la lección actual
  const handleSendAnswer = async (customAnswer?: string) => {
    const answerToSend = (
      customAnswer !== undefined ? customAnswer : inputText
    ).trim();
    if (!answerToSend || processingRef.current || finalSummary) return;
    processingRef.current = true;
    speech.stop();

    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
    }

    setDialogueHistory((prev) => [
      ...prev,
      {
        sender: "student",
        text: answerToSend,
      },
    ]);

    setInputText("");
    setInterimVoiceText("");
    setProcessingAnswer(true);
    setPose("idle");

    try {
      const res = await api.post<AnswerModuleEvaluationResponse>(
        "/tutor/module-evaluation/answer",
        {
          moduleId,
          sessionId: sessionIdRef.current,
          lessonIndex: currentLessonIndex,
          userResponse: answerToSend,
          isSimulation: Boolean(isSimulation),
        },
      );

      const {
        isCorrect,
        feedbackText,
        visemes,
        avatarEmotion,
        speechSegments,
        hasNextLesson,
        nextQuestion,
        finalSummary: summary,
      } = res.data;

      // 1. Mostrar feedback del docente en el diálogo
      setDialogueHistory((prev) => [
        ...prev,
        {
          sender: "tutor",
          text: feedbackText,
          isCorrect,
        },
      ]);

      if (isCorrect) {
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.6 },
        });
      }

      // 2. Si hay siguiente lección, prepararla sin interrumpir la voz del docente
      if (hasNextLesson && nextQuestion) {
        const nextQData = {
          lessonIndex: nextQuestion.lessonIndex,
          lessonTitle: nextQuestion.lessonTitle,
          questionText: nextQuestion.questionText,
          visemes,
        };

        setPendingNextQuestion(nextQData);
        // El docente habla su retroalimentación
        speakAndAnimate(
          feedbackText,
          visemes,
          avatarEmotion,
          speechSegments,
          () => {
            // Al terminar la locución del docente, activar el botón o avance con respiro
            if (voiceConversationRef.current)
              handleAdvanceToNextQuestion(nextQData);
            else setPendingNextQuestion(nextQData);
          },
        );

        // Si no hay voz activa, dejamos el estado listo para que el estudiante avance cuando guste
        if (!soundEnabledRef.current) {
          setPendingNextQuestion(nextQData);
        }
      } else if (summary) {
        setFinalSummary(summary);
        speakAndAnimate(feedbackText, visemes, avatarEmotion, speechSegments);
        if (summary.approved)
          confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
      }
    } catch (error: unknown) {
      const status = isAxiosError(error) ? error.response?.status : undefined;
      const errReply = status === 503
        ? "El servicio de inteligencia artificial no está disponible o tardó demasiado. Tu respuesta se conserva; inténtalo de nuevo."
        : status === 409
          ? "Esta pregunta ya fue procesada o la sesión quedó desactualizada. Cierra la evaluación y vuelve a iniciarla."
          : status === 400
            ? "La sesión de evaluación ya no es válida. Cierra la evaluación y vuelve a iniciarla."
            : status === 401
              ? "Tu sesión ha expirado. Inicia sesión nuevamente para continuar."
              : isAxiosError(error) && !error.response
                ? "No hay conexión con el servidor. Comprueba que el backend esté iniciado; tu respuesta se conserva."
                : "Ocurrió un error en el servidor al evaluar tu respuesta. Tu respuesta se conserva; inténtalo de nuevo.";
      setDialogueHistory((prev) => [
        ...prev,
        {
          sender: "tutor",
          text: errReply,
        },
      ]);
      setInputText(answerToSend);
      setVoiceConversation(false);
      setPose("encouraging");
    } finally {
      processingRef.current = false;
      setProcessingAnswer(false);
    }
  };

  useEffect(() => {
    submitRef.current = (text) => {
      void handleSendAnswer(text);
    };
    startListeningRef.current = () => {
      if (
        !finalSummary &&
        !processingAnswer &&
        !isListening &&
        !pendingNextQuestion
      )
        toggleSpeechRecognition();
    };
  });
  const statusLabel = loading
    ? "Preparando la conversación"
    : processingAnswer
      ? "Revisando tu respuesta"
      : isListening
        ? "Te escucho"
        : isSpeaking
          ? "Sky está hablando"
          : `Sky está ${POSE_LABELS[pose]}`;
  const latestTutorIndex = dialogueHistory.findLastIndex(
    (item) => item.sender === "tutor",
  );
  const changeMode = (voice: boolean) => {
    setVoiceConversation(voice);
    if (
      voice &&
      !isListening &&
      !loading &&
      !processingAnswer &&
      !speech.speaking &&
      !pendingNextQuestion
    )
      toggleSpeechRecognition();
    if (!voice) recognitionRef.current?.abort();
  };
  return createPortal(
    <div className="tutor-room-backdrop">
      <div
        className="tutor-room"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutor-room-title"
      >
        <header className="tutor-room-header" inert={settingsOpen}>
          <div className="tutor-room-heading">
            <span className="tutor-room-brand">
              <Bot size={24} />
            </span>
            <div>
              <h2 id="tutor-room-title">Conversemos con Sky</h2>
              <p>
                {moduleTitle}
                {isSimulation && (
                  <span className="tutor-room-tag">Vista docente</span>
                )}
              </p>
            </div>
          </div>
          <div className="tutor-room-header-actions">
            <button
              className="tutor-icon-action"
              onClick={handleToggleSound}
              title={soundEnabled ? "Silenciar voz" : "Activar voz"}
              aria-label={soundEnabled ? "Silenciar voz" : "Activar voz"}
            >
              {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
            <button
              ref={settingsButtonRef}
              className="tutor-icon-action"
              onClick={() => setSettingsOpen((value) => !value)}
              aria-expanded={settingsOpen}
              aria-controls="tutor-room-settings"
              title="Ajustes"
              aria-label="Ajustes"
            >
              <Settings2 size={20} />
            </button>
            <button
              ref={closeButtonRef}
              className="tutor-icon-action"
              onClick={onClose}
              aria-label="Cerrar evaluación"
              title="Cerrar"
            >
              <X size={22} />
            </button>
          </div>
        </header>

        <div className="tutor-room-workspace" inert={settingsOpen}>
          <aside className="tutor-room-stage">
            <div className="tutor-room-presence">
              <span
                className={
                  isSpeaking || isListening
                    ? "tutor-presence-dot is-active"
                    : "tutor-presence-dot"
                }
              />
              <span role="status">{statusLabel}</span>
            </div>
            <div className="tutor-room-avatar">
              <Suspense fallback={<AvatarLoader />}>
                <TutorAvatar3D
                  speechText={speech.text}
                  spokenEnd={speech.range.start + speech.range.length}
                  gestureSelection={gestureSelection}
                  onGestureChange={setActiveGesture}
                  gender={speech.gender}
                  pose={pose}
                  viseme={currentViseme}
                  isSpeaking={isSpeaking}
                  isListening={isListening}
                  width={360}
                  height={380}
                />
              </Suspense>
            </div>
            <div className="tutor-room-stage-footer">
              <h3>Un paso a la vez</h3>
              <p>Escucha, pregunta y responde a tu ritmo.</p>
              <div className="tutor-room-progress">
                <div>
                  <span>Tu recorrido</span>
                  <strong>
                    {loading
                      ? "Preparando…"
                      : `${Math.min(currentLessonIndex + 1, Math.max(1, totalLessons))} de ${totalLessons} lecciones`}
                  </strong>
                </div>
                <progress
                  aria-label="Progreso de la evaluación"
                  max={Math.max(1, totalLessons)}
                  value={currentLessonIndex + (finalSummary ? 1 : 0)}
                />
                <span>{currentLessonTitle || moduleTitle}</span>
              </div>
            </div>
          </aside>

          <section
            className="tutor-room-conversation"
            aria-label="Conversación con el docente"
          >
            <div className="tutor-conversation-heading">
              <div>
                <span className="tutor-conversation-label">
                  {finalSummary ? "Tu resultado" : "Estamos aprendiendo sobre"}
                </span>
                <h3>{currentLessonTitle || moduleTitle}</h3>
              </div>
              <div className="tutor-playback-actions">
                <button
                  className="tutor-icon-action"
                  onClick={speech.repeat}
                  disabled={!speech.text || !soundEnabled}
                  title="Volver a escuchar"
                  aria-label="Volver a escuchar"
                >
                  <RotateCcw size={18} />
                </button>
                <button
                  className="tutor-icon-action"
                  onClick={speech.stop}
                  disabled={!speech.speaking}
                  title="Detener explicación"
                  aria-label="Detener explicación"
                >
                  <Square size={16} />
                </button>
              </div>
            </div>
            {finalSummary ? (
              <div className="tutor-result">
                <Award size={48} />
                <h3>
                  {finalSummary.approved
                    ? "¡Buen trabajo!"
                    : "Seguimos aprendiendo"}
                </h3>
                <strong className="tutor-result-score">
                  {finalSummary.scorePercentage}%
                </strong>
                <p>{finalSummary.closingRemarks}</p>
                <button
                  className="btn-primary"
                  onClick={() => {
                    onFinish?.(finalSummary);
                    onClose();
                  }}
                >
                  <CheckCircle2 size={18} />
                  Finalizar sesión
                </button>
              </div>
            ) : (
              <>
                <div
                  ref={messagesScrollRef}
                  className="tutor-conversation-messages"
                  role="log"
                  aria-label="Historial de la conversación"
                >
                  {loading && (
                    <div className="tutor-room-loading">
                      <span className="tutor-loading-dots" aria-hidden="true">
                        •••
                      </span>
                      <p>Sky está preparando tu primera pregunta.</p>
                    </div>
                  )}
                  {dialogueHistory.map((item, idx) => {
                    const active =
                      item.sender === "tutor" &&
                      idx === latestTutorIndex &&
                      isSpeaking;
                    const text = active ? speech.text : item.text;
                    const start = active ? speech.range.start : 0;
                    const end = active ? start + speech.range.length : 0;
                    return (
                      <article
                        key={idx}
                        className={`tutor-message ${item.sender === "student" ? "is-student" : "is-tutor"}`}
                      >
                        <div className="tutor-message-meta">
                          <span>{item.sender === "tutor" ? "Sky" : "Tú"}</span>
                          {item.isCorrect !== undefined && (
                            <span
                              className={
                                item.isCorrect
                                  ? "tutor-answer-result is-correct"
                                  : "tutor-answer-result"
                              }
                            >
                              {item.isCorrect ? "Comprendido" : "Para repasar"}
                            </span>
                          )}
                        </div>
                        <p>
                          {text.slice(0, start)}
                          {active && (
                            <strong className="tutor-current-word">
                              {text.slice(start, end)}
                            </strong>
                          )}
                          {text.slice(end)}
                        </p>
                      </article>
                    );
                  })}
                  {processingAnswer && (
                    <div className="tutor-room-loading" role="status">
                      <span className="tutor-loading-dots" aria-hidden="true">
                        •••
                      </span>
                      <p>Sky está revisando tu respuesta.</p>
                    </div>
                  )}
                  {interimVoiceText && (
                    <article className="tutor-message is-student is-interim">
                      <div className="tutor-message-meta">
                        Te estoy escuchando
                      </div>
                      <p>{interimVoiceText}</p>
                    </article>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <footer className="tutor-room-composer">
                  {voiceError && (
                    <p className="tutor-room-notice" role="alert">
                      {voiceError}
                    </p>
                  )}
                  {speech.error && (
                    <p className="tutor-room-notice" role="status">
                      {speech.error}
                    </p>
                  )}
                  {pendingNextQuestion ? (
                    <div className="tutor-next-step">
                      <div>
                        <strong>Vamos a la siguiente lección</strong>
                        <p>{pendingNextQuestion.lessonTitle}</p>
                      </div>
                      <button
                        className="btn-primary"
                        onClick={() =>
                          handleAdvanceToNextQuestion(pendingNextQuestion)
                        }
                      >
                        <span>Continuar</span>
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div
                        className="tutor-input-mode"
                        aria-label="Cómo responder"
                      >
                        <button
                          aria-pressed={!voiceConversation}
                          onClick={() => changeMode(false)}
                        >
                          <Keyboard size={17} />
                          Escribir
                        </button>
                        <button
                          aria-pressed={voiceConversation}
                          onClick={() => changeMode(true)}
                        >
                          <Mic size={17} />
                          Hablar
                        </button>
                        <span>
                          {voiceConversation
                            ? "Se envía cuando terminas de hablar"
                            : "Tómate el tiempo que necesites"}
                        </span>
                      </div>
                      <div className="tutor-answer-field">
                        <textarea
                          rows={2}
                          aria-label="Tu respuesta"
                          placeholder={
                            isListening
                              ? "Te escucho… también puedes escribir aquí."
                              : "Cuéntame con tus palabras…"
                          }
                          value={inputText}
                          onChange={(event) => setInputText(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && !event.shiftKey) {
                              event.preventDefault();
                              void handleSendAnswer();
                            }
                          }}
                          disabled={loading || processingAnswer}
                        />
                        <div className="tutor-answer-actions">
                          <button
                            type="button"
                            className={`tutor-icon-action ${isListening ? "is-recording" : ""}`}
                            onClick={toggleSpeechRecognition}
                            disabled={loading || processingAnswer}
                            title={
                              isListening
                                ? "Detener micrófono"
                                : "Usar micrófono"
                            }
                            aria-label={
                              isListening
                                ? "Detener micrófono"
                                : "Usar micrófono"
                            }
                          >
                            {isListening ? (
                              <MicOff size={20} />
                            ) : (
                              <Mic size={20} />
                            )}
                          </button>
                          <button
                            type="button"
                            className="tutor-send-action"
                            onClick={() => void handleSendAnswer()}
                            disabled={
                              loading || !inputText.trim() || processingAnswer
                            }
                            aria-label="Enviar respuesta"
                            title="Enviar respuesta"
                          >
                            <Send size={20} />
                          </button>
                        </div>
                      </div>
                      <p className="tutor-input-hint">
                        Enter para enviar · Mayús + Enter para una nueva línea
                      </p>
                    </>
                  )}
                </footer>
              </>
            )}
          </section>
        </div>

        {settingsOpen && (
          <div className="tutor-settings-layer">
            <button
              className="tutor-settings-scrim"
              aria-label="Cerrar ajustes"
              onClick={() => setSettingsOpen(false)}
            />
            <aside
              ref={settingsPanelRef}
              className="tutor-room-settings"
              id="tutor-room-settings"
              aria-label="Ajustes del docente"
            >
              <header>
                <div>
                  <h3>A tu manera</h3>
                  <p>Personaliza la voz de Sky.</p>
                </div>
                <button
                  className="tutor-icon-action"
                  aria-label="Cerrar ajustes"
                  onClick={() => setSettingsOpen(false)}
                >
                  <X size={20} />
                </button>
              </header>
              <TutorSpeechControls
                speech={speech}
                showCaption={false}
                showActions={false}
              />
              {isSimulation && (
                <section className="tutor-gesture-settings">
                  <h4>Movimientos del docente</h4>
                  <p>{GESTURE_LABELS[activeGesture]}</p>
                  <label>
                    Probar gestos
                    <select
                      className="skylearn-input"
                      value={gestureSelection}
                      onChange={(event) => {
                        const value = event.target.value;
                        if (
                          value === "auto" ||
                          value === "demo" ||
                          value in GESTURE_LABELS
                        )
                          setGestureSelection(value as GestureSelection);
                      }}
                    >
                      <option value="auto">
                        Automáticos durante la conversación
                      </option>
                      <option value="demo">
                        Demostración de todos los gestos
                      </option>
                      {Object.entries(GESTURE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                </section>
              )}
              <section className="tutor-connection-settings">
                <h4>Conexión del docente</h4>
                <button
                  className="btn-secondary"
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                >
                  <Activity size={16} />
                  {testingConnection ? "Comprobando…" : "Comprobar conexión"}
                </button>
                {apiConnectionStatus && (
                  <p role="status">{apiConnectionStatus}</p>
                )}
              </section>
            </aside>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};
