// frontend-web/src/components/LessonViewer.tsx
import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, HelpCircle, Award, Bot } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LessonViewerProps {
  lesson: {
    id: string;
    title: string;
    videoUrl: string;
    contextText: string;
    downloadableUrl?: string;
    exams?: Array<{
      id: string;
      title: string;
      questions: Array<{
        id: string;
        text: string;
        options: Array<{
          id: string;
          text: string;
          isCorrect?: boolean;
        }>;
      }>;
    }>;
  };
  onBack: () => void;
  onCompleteLesson: (lessonId: string) => void;
}

export const LessonViewer: React.FC<LessonViewerProps> = ({
  lesson,
  onBack,
  onCompleteLesson,
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [examScore, setExamScore] = useState<number | null>(null);

  // Helper para convertir URL estándar de YouTube a embed URL
  const getEmbedUrl = (url: string) => {
    try {
      if (url.includes('embed/')) return url;
      const urlObj = new URL(url);
      if (urlObj.hostname === 'youtu.be') {
        return `https://www.youtube.com/embed/${urlObj.pathname.slice(1)}`;
      }
      const v = urlObj.searchParams.get('v');
      return v ? `https://www.youtube.com/embed/${v}` : url;
    } catch {
      return url;
    }
  };

  const handleSelectOption = (questionId: string, optionId: string) => {
    if (examSubmitted) return;
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: optionId,
    });
  };

  const handleCheckExam = () => {
    const exam = lesson.exams?.[0];
    if (!exam || !exam.questions.length) return;

    let correctCount = 0;
    exam.questions.forEach((q) => {
      const selectedId = selectedAnswers[q.id];
      const correctOpt = q.options.find((o) => o.isCorrect);
      if (correctOpt && selectedId === correctOpt.id) {
        correctCount++;
      }
    });

    const percentage = Math.round((correctCount / exam.questions.length) * 100);
    setExamScore(percentage);
    setExamSubmitted(true);

    if (percentage >= 70) {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
      onCompleteLesson(lesson.id);
    }
  };

  const exam = lesson.exams?.[0];

  return (
    <div style={styles.container}>
      <div style={styles.headerBar}>
        <button onClick={onBack} style={styles.backBtn}>
          <ArrowLeft size={16} />
          <span>Volver al Temario</span>
        </button>

        {/* Acceso directo opcional al Docente Virtual dedicado */}
        <a href="#/tutor" style={styles.tutorLinkBtn} title="Ir a la sección de tutoría virtual 3D">
          <Bot size={16} color="var(--color-sky)" />
          <span>Preguntar al Docente Virtual</span>
        </a>
      </div>

      <div style={styles.grid}>
        {/* Columna Principal: Video y Contexto Didáctico */}
        <div style={styles.videoColumn}>
          <div className="skylearn-card" style={styles.videoCard}>
            <div style={styles.iframeWrapper}>
              <iframe
                src={getEmbedUrl(lesson.videoUrl)}
                title={lesson.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={styles.iframe}
              />
            </div>
            <div style={styles.videoInfo}>
              <h2 style={styles.lessonTitle}>{lesson.title}</h2>

              {/* Contexto Pedagógico del Video */}
              <div style={styles.contextBox}>
                <span style={styles.contextLabel}>Contexto Pedagógico de la Lección:</span>
                <p style={styles.contextText}>{lesson.contextText}</p>
              </div>

            </div>
          </div>
        </div>

        {/* Columna Lateral: Formulario Evaluativo con Answer Tiles */}
        <div style={styles.examColumn}>
          {exam && exam.questions && exam.questions.length > 0 ? (
            <div className="skylearn-card" style={styles.examCard}>
              <div style={styles.examHeader}>
                <HelpCircle size={20} color="var(--color-sky)" />
                <div>
                  <h3 style={styles.examTitle}>{exam.title}</h3>
                  <span style={styles.examSubtitle}>Haz clic en una opción para responder</span>
                </div>
              </div>

              {examScore !== null && (
                <div
                  style={{
                    ...styles.scoreBadge,
                    backgroundColor: examScore >= 70 ? 'var(--color-leaf-soft)' : 'var(--color-coral-soft)',
                    color: examScore >= 70 ? 'var(--color-leaf-deep)' : 'var(--color-coral)',
                    borderColor: examScore >= 70 ? 'var(--color-leaf)' : 'var(--color-coral)',
                  }}
                >
                  <Award size={18} />
                  <span>Resultado: {examScore}% ({examScore >= 70 ? '¡Aprobado!' : 'Requiere Repaso'})</span>
                </div>
              )}

              <div style={styles.questionsList}>
                {exam.questions.map((q, qIndex) => (
                  <div key={q.id || qIndex} style={styles.questionBlock}>
                    <p style={styles.questionText}>
                      <strong>{qIndex + 1}.</strong> {q.text}
                    </p>

                    <div style={styles.optionsContainer}>
                      {q.options.map((opt) => {
                        const isSelected = selectedAnswers[q.id] === opt.id;
                        let optionBg = 'var(--color-surface)';
                        let optionBorder = 'var(--color-outline)';

                        if (examSubmitted) {
                          if (opt.isCorrect) {
                            optionBg = 'var(--color-leaf-soft)';
                            optionBorder = 'var(--color-leaf)';
                          } else if (isSelected && !opt.isCorrect) {
                            optionBg = 'var(--color-coral-soft)';
                            optionBorder = 'var(--color-coral)';
                          }
                        } else if (isSelected) {
                          optionBg = 'var(--color-sky-soft)';
                          optionBorder = 'var(--color-sky)';
                        }

                        return (
                          <div
                            key={opt.id}
                            onClick={() => handleSelectOption(q.id, opt.id)}
                            style={{
                              ...styles.answerTile,
                              backgroundColor: optionBg,
                              borderColor: optionBorder,
                            }}
                          >
                            <span style={styles.optRadio}>
                              {isSelected ? '●' : '○'}
                            </span>
                            <span style={styles.optText}>{opt.text}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleCheckExam}
                disabled={examSubmitted && examScore! >= 70}
                className="btn-big-friendly"
                style={{ width: '100%', marginTop: '16px', padding: '10px 16px' }}
              >
                <span>{examSubmitted ? 'Volver a Intentar' : 'Comprobar Respuestas'}</span>
              </button>
            </div>
          ) : (
            <div className="skylearn-card" style={styles.noExamCard}>
              <CheckCircle2 size={32} color="var(--color-leaf)" />
              <h4 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>¡Lección en Curso!</h4>
              <p style={{ fontSize: '13px', color: 'var(--color-ink-muted)', textAlign: 'center', margin: '4px 0 12px 0' }}>
                Mira el video con atención y repasa las notas formativas del docente.
              </p>
              <button
                onClick={() => {
                  confetti({ particleCount: 50 });
                  onCompleteLesson(lesson.id);
                }}
                className="btn-big-friendly"
                style={{ padding: '8px 18px', fontSize: '13px' }}
              >
                Marcar como Completada
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px 16px',
    width: '100%',
  },
  headerBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'transparent',
    color: 'var(--color-sky-deep)',
    fontWeight: 700,
    fontSize: '14px',
    cursor: 'pointer',
  },
  tutorLinkBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: 'var(--radius-full)',
    backgroundColor: 'var(--color-sky-soft)',
    color: 'var(--color-sky-deep)',
    fontSize: '12px',
    fontWeight: 700,
    textDecoration: 'none',
    border: '1px solid var(--color-sky)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '20px',
    alignItems: 'start',
  },
  videoColumn: {
    display: 'flex',
    flexDirection: 'column',
  },
  videoCard: {
    overflow: 'hidden',
    backgroundColor: 'var(--color-surface-elevated)',
  },
  iframeWrapper: {
    position: 'relative',
    paddingBottom: '56.25%',
    height: 0,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  iframe: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    border: 'none',
  },
  videoInfo: {
    padding: '20px',
  },
  lessonTitle: {
    fontSize: '20px',
    color: 'var(--color-ink)',
    marginBottom: '12px',
  },
  contextBox: {
    backgroundColor: 'var(--color-surface)',
    padding: '14px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-outline)',
    marginBottom: '14px',
  },
  contextLabel: {
    fontSize: '12px',
    fontWeight: 800,
    color: 'var(--color-sky-deep)',
    display: 'block',
    marginBottom: '4px',
  },
  contextText: {
    fontSize: '14px',
    color: 'var(--color-ink)',
    lineHeight: 1.5,
    margin: 0,
  },
  downloadRow: {
    paddingTop: '6px',
  },
  downloadBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: 'var(--radius-full)',
    backgroundColor: 'var(--color-sky-soft)',
    color: 'var(--color-sky-deep)',
    fontWeight: 700,
    fontSize: '13px',
    textDecoration: 'none',
  },
  examColumn: {
    display: 'flex',
    flexDirection: 'column',
  },
  examCard: {
    padding: '20px',
    backgroundColor: 'var(--color-surface-elevated)',
  },
  examHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '14px',
  },
  examTitle: {
    fontSize: '16px',
    color: 'var(--color-ink)',
    margin: 0,
  },
  examSubtitle: {
    fontSize: '12px',
    color: 'var(--color-ink-muted)',
  },
  scoreBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    borderRadius: 'var(--radius-sm)',
    fontWeight: 800,
    fontSize: '13px',
    border: '1px solid',
    marginBottom: '14px',
  },
  questionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  questionBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  questionText: {
    fontSize: '14px',
    fontWeight: 700,
    color: 'var(--color-ink)',
    margin: 0,
  },
  optionsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  answerTile: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: 'var(--radius-sm)',
    border: '1.5px solid',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  optRadio: {
    fontSize: '14px',
    color: 'var(--color-sky-deep)',
  },
  optText: {
    fontSize: '13px',
    color: 'var(--color-ink)',
    fontWeight: 600,
  },
  noExamCard: {
    padding: '28px 16px',
    backgroundColor: 'var(--color-surface-elevated)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
};
