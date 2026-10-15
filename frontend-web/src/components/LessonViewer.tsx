// frontend-web/src/components/LessonViewer.tsx
import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Download, HelpCircle, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { TutorVirtual3D } from './TutorVirtual3D';

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
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
      onCompleteLesson(lesson.id);
    }
  };

  const exam = lesson.exams?.[0];

  return (
    <div style={styles.container}>
      <button onClick={onBack} style={styles.backBtn}>
        <ArrowLeft size={18} />
        <span>Volver a la Lista de Lecciones</span>
      </button>

      <div style={styles.grid}>
        {/* Columna Principal: Video y Contexto */}
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

              {/* Descargas */}
              {lesson.downloadableUrl && (
                <div style={styles.downloadRow}>
                  <a
                    href={lesson.downloadableUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.downloadBtn}
                  >
                    <Download size={18} />
                    <span>Descargar Guía y Material de Repaso</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Columna Lateral: Formulario Evaluativo con Answer Tiles */}
        <div style={styles.examColumn}>
          {exam && exam.questions && exam.questions.length > 0 ? (
            <div className="skylearn-card" style={styles.examCard}>
              <div style={styles.examHeader}>
                <HelpCircle size={22} color="var(--color-sky)" />
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
                    color: examScore >= 70 ? 'var(--color-leaf-deep)' : 'var(--color-coral-deep)',
                    borderColor: examScore >= 70 ? 'var(--color-leaf)' : 'var(--color-coral)',
                  }}
                >
                  <Award size={20} />
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
                style={{ width: '100%', marginTop: '16px' }}
              >
                <span>{examSubmitted ? 'Volver a Intentar' : 'Comprobar Respuestas'}</span>
              </button>
            </div>
          ) : (
            <div className="skylearn-card" style={styles.noExamCard}>
              <CheckCircle2 size={36} color="var(--color-leaf)" />
              <h4 style={{ fontSize: '18px', fontWeight: 800 }}>¡Lección en Curso!</h4>
              <p style={{ fontSize: '14px', color: 'var(--color-ink-muted)', textAlign: 'center' }}>
                Mira el video con atención y revisa la variable de contexto pedagógico.
              </p>
              <button
                onClick={() => {
                  confetti({ particleCount: 60 });
                  onCompleteLesson(lesson.id);
                }}
                className="btn-big-friendly"
                style={{ marginTop: '16px' }}
              >
                Marcar como Completada
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sección del Tutor Virtual 3D Multimodal con Visemas */}
      <div style={{ marginTop: '36px' }}>
        <TutorVirtual3D
          lessonId={lesson.id}
          lessonTitle={lesson.title}
          onNavigate={onBack}
        />
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '28px 24px',
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'transparent',
    color: 'var(--color-sky-deep)',
    fontWeight: 700,
    fontSize: '15px',
    marginBottom: '20px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1.4fr 1fr',
    gap: '28px',
  },
  videoColumn: {
    display: 'flex',
    flexDirection: 'column',
  },
  videoCard: {
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
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
    padding: '24px',
  },
  lessonTitle: {
    fontSize: '24px',
    color: 'var(--color-ink)',
    marginBottom: '16px',
  },
  contextBox: {
    backgroundColor: 'var(--color-surface)',
    padding: '18px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-outline)',
    marginBottom: '18px',
  },
  contextLabel: {
    fontSize: '13px',
    fontWeight: 800,
    color: 'var(--color-sky-deep)',
    display: 'block',
    marginBottom: '6px',
  },
  contextText: {
    fontSize: '15px',
    color: 'var(--color-ink)',
    lineHeight: 1.6,
  },
  downloadRow: {
    paddingTop: '8px',
  },
  downloadBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    borderRadius: 'var(--radius-full)',
    backgroundColor: 'var(--color-sky-soft)',
    color: 'var(--color-sky-deep)',
    fontWeight: 700,
    fontSize: '14px',
    textDecoration: 'none',
  },
  examColumn: {
    display: 'flex',
    flexDirection: 'column',
  },
  examCard: {
    padding: '24px',
    backgroundColor: '#FFFFFF',
  },
  examHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  examTitle: {
    fontSize: '18px',
    color: 'var(--color-ink)',
  },
  examSubtitle: {
    fontSize: '13px',
    color: 'var(--color-ink-muted)',
  },
  scoreBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    fontWeight: 800,
    fontSize: '14px',
    border: '1px solid',
    marginBottom: '16px',
  },
  questionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  questionBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  questionText: {
    fontSize: '15px',
    fontWeight: 700,
    color: 'var(--color-ink)',
  },
  optionsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  answerTile: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: 'var(--radius-md)',
    border: '2px solid',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  optRadio: {
    fontSize: '16px',
    color: 'var(--color-sky-deep)',
  },
  optText: {
    fontSize: '14px',
    color: 'var(--color-ink)',
    fontWeight: 600,
  },
  noExamCard: {
    padding: '40px 24px',
    backgroundColor: '#FFFFFF',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
};
