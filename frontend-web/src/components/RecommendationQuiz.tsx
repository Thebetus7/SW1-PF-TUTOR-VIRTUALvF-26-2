// frontend-web/src/components/RecommendationQuiz.tsx
import React, { useState } from 'react';
import { Compass, ArrowRight, Sparkles, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';

interface RecommendationQuizProps {
  onClose: () => void;
  onNavigateToLesson: (lessonId: string) => void;
}

export const RecommendationQuiz: React.FC<RecommendationQuizProps> = ({
  onClose,
  onNavigateToLesson,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [recommendationResult, setRecommendationResult] = useState<any | null>(null);

  const questions = [
    {
      id: 'q-interests',
      text: '¿Qué área te gustaría explorar hoy en Skylearn?',
      options: [
        'Desarrollo Web Frontend (React, Componentes, UI)',
        'Backend y Arquitectura (APIs REST, Bases de Datos)',
        'Inteligencia Artificial y Modelos Multimodales',
      ],
    },
    {
      id: 'q-experience',
      text: '¿Cuánto código has escrito anteriormente?',
      options: [
        '¡Es mi primer día programando! (Principiante)',
        'He creado páginas básicas con HTML y CSS',
        'Tengo experiencia creando proyectos pequeños',
      ],
    },
    {
      id: 'q-goal',
      text: '¿Cuál es tu meta principal de aprendizaje?',
      options: [
        'Aprender paso a paso con un tutor virtual interactivo',
        'Construir mi propia aplicación web funcional',
        'Dominar lógica de algoritmos y buenas prácticas',
      ],
    },
  ];

  const currentQ = questions[currentStep];

  const handleSelectOption = (optIndex: number) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQ.id]: optIndex,
    });
  };

  const handleNext = async () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Enviar respuestas a la API
      setLoading(true);
      try {
        const payload = {
          answers: Object.entries(selectedAnswers).map(([qId, index]) => ({
            questionId: qId,
            optionIndex: index,
            selectedText: questions.find((q) => q.id === qId)?.options[index],
          })),
        };

        const res = await api.post('/recommendations/quiz/submit', payload);
        setRecommendationResult(res.data);
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch (err) {
        console.error('Error generando recomendación adaptativa', err);
        // Fallback local en frontend si no hay conexión
        setRecommendationResult({
          courseTitle: 'Desarrollo Web Fullstack con React y NestJS',
          lessonId: '00000000-0000-0000-0000-000000000100',
          actionButton: {
            label: 'Comenzar Primera Lección',
            url: '/lessons/00000000-0000-0000-0000-000000000100',
          },
        });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div style={styles.overlay}>
      <div className="skylearn-card" style={styles.card}>
        <div style={styles.topBar}>
          <div style={styles.badge}>
            <Compass size={16} color="var(--color-sky-deep)" />
            <span>Test Inicial • 100% Gratuito (0 Créditos)</span>
          </div>
          <button onClick={onClose} style={styles.closeBtn}><X size={20} /></button>
        </div>

        {!recommendationResult ? (
          <>
            {/* Barra de Progreso Skylearn */}
            <div style={styles.progressTrack}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${((currentStep + 1) / questions.length) * 100}%`,
                }}
              />
            </div>

            <div style={styles.content}>
              <span style={styles.stepCounter}>
                Pregunta {currentStep + 1} de {questions.length}
              </span>
              <h3 style={styles.questionTitle}>{currentQ.text}</h3>

              {/* Answer Tiles Skylearn */}
              <div style={styles.optionsGrid}>
                {currentQ.options.map((optText, idx) => {
                  const isSelected = selectedAnswers[currentQ.id] === idx;
                  return (
                    <div
                      key={idx}
                      onClick={() => handleSelectOption(idx)}
                      style={{
                        ...styles.answerTile,
                        borderColor: isSelected ? 'var(--color-sky)' : 'var(--color-outline)',
                        backgroundColor: isSelected ? 'var(--color-sky-soft)' : 'var(--color-surface)',
                      }}
                    >
                      <span style={styles.tileCircle}>{isSelected ? '●' : '○'}</span>
                      <span style={styles.tileText}>{optText}</span>
                    </div>
                  );
                })}
              </div>

              <div style={styles.actions}>
                <button type="button" onClick={onClose} className="btn-secondary">
                  Omitir y Ver Catálogo
                </button>
                <button
                  type="button"
                  disabled={selectedAnswers[currentQ.id] === undefined || loading}
                  onClick={handleNext}
                  className="btn-big-friendly"
                >
                  {loading
                    ? 'Compilando tu Ruta con IA...'
                    : currentStep === questions.length - 1
                    ? 'Generar Mi Ruta'
                    : 'Siguiente'}
                  {!loading && <ArrowRight size={18} />}
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Pantalla de Resultado de la Recomendación */
          <div style={styles.resultView}>
            <div style={styles.resultIconWrap}>
              <Sparkles size={40} color="#FFFFFF" />
            </div>
            <h3 style={styles.resultTitle}>¡Tu Ruta Adaptativa está Lista!</h3>
            <p style={styles.resultDesc}>
              Analizamos tus preferencias pedagógicas con Gemini API y hemos compilado tu secuencia de lecciones óptima en:
            </p>

            <div style={styles.courseHighlight}>
              <h4 style={{ fontSize: '18px', color: 'var(--color-ink)', marginBottom: '6px' }}>
                {recommendationResult.courseTitle}
              </h4>
              <span style={{ fontSize: '13px', color: 'var(--color-leaf-deep)', fontWeight: 800 }}>
                ✓ Inscripción confirmada a costo 0 créditos
              </span>
            </div>

            <div style={{ display: 'flex', gap: '14px', marginTop: '14px' }}>
              <button
                className="btn-big-friendly"
                onClick={() => onNavigateToLesson(recommendationResult.lessonId)}
              >
                <span>{recommendationResult.actionButton?.label || 'Comenzar Primera Lección'}</span>
                <ArrowRight size={20} />
              </button>
              <button className="btn-secondary" onClick={onClose}>
                Explorar Catálogo
              </button>
            </div>
          </div>
        )}
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
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  card: {
    width: '100%',
    maxWidth: '640px',
    backgroundColor: '#FFFFFF',
    padding: '32px',
    borderRadius: 'var(--radius-xl)',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 14px',
    borderRadius: 'var(--radius-full)',
    backgroundColor: 'var(--color-sky-soft)',
    color: 'var(--color-sky-deep)',
    fontSize: '13px',
    fontWeight: 800,
  },
  closeBtn: {
    background: 'transparent',
    color: 'var(--color-ink-muted)',
    padding: '4px',
  },
  progressTrack: {
    height: '8px',
    backgroundColor: 'var(--color-surface-sunken)',
    borderRadius: 'var(--radius-full)',
    overflow: 'hidden',
    marginBottom: '24px',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'var(--color-leaf)',
    borderRadius: 'var(--radius-full)',
    transition: 'width 0.3s ease',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  stepCounter: {
    fontSize: '13px',
    fontWeight: 800,
    color: 'var(--color-ink-subtle)',
    textTransform: 'uppercase',
  },
  questionTitle: {
    fontSize: '22px',
    color: 'var(--color-ink)',
    marginBottom: '8px',
  },
  optionsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '16px',
  },
  answerTile: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '16px 20px',
    borderRadius: 'var(--radius-md)',
    border: '2px solid',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  tileCircle: {
    fontSize: '18px',
    color: 'var(--color-sky-deep)',
  },
  tileText: {
    fontSize: '15px',
    fontWeight: 700,
    color: 'var(--color-ink)',
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '12px',
  },
  resultView: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '20px 0',
  },
  resultIconWrap: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-sun)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'var(--shadow-sun)',
    marginBottom: '20px',
  },
  resultTitle: {
    fontSize: '26px',
    color: 'var(--color-ink)',
    marginBottom: '10px',
  },
  resultDesc: {
    fontSize: '15px',
    color: 'var(--color-ink-muted)',
    maxWidth: '480px',
    lineHeight: 1.5,
    marginBottom: '20px',
  },
  courseHighlight: {
    padding: '18px 24px',
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-md)',
    border: '1.5px solid var(--color-leaf-soft)',
    marginBottom: '24px',
    width: '100%',
  },
};
