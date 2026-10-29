// frontend-web/src/components/TeacherLessonEditor.tsx
import React, { useState } from 'react';
import { Video, Plus, Trash2, Save, X } from 'lucide-react';
import { api } from '../services/api';

interface OptionItem {
  text: string;
  isCorrect: boolean;
}

interface QuestionItem {
  text: string;
  options: OptionItem[];
}

interface TeacherLessonEditorProps {
  moduleId: string;
  initialLesson?: any | null;
  onLessonCreated: (lesson: any) => void;
  onCancel: () => void;
}

export const TeacherLessonEditor: React.FC<TeacherLessonEditorProps> = ({
  moduleId,
  initialLesson,
  onLessonCreated,
  onCancel,
}) => {
  const isEditing = Boolean(initialLesson);

  const [title, setTitle] = useState(initialLesson?.title || '');
  const [videoUrl, setVideoUrl] = useState(initialLesson?.videoUrl || '');
  const [contextText, setContextText] = useState(initialLesson?.contextText || '');
  const [downloadableUrl, setDownloadableUrl] = useState(initialLesson?.downloadableUrl || '');

  // Carga previa de preguntas si la lección ya contaba con formulario de examen
  const existingQuestions: QuestionItem[] =
    initialLesson?.exams?.[0]?.questions && initialLesson.exams[0].questions.length > 0
      ? initialLesson.exams[0].questions.map((q: any) => ({
          text: q.text,
          options: q.options?.map((opt: any) => ({
            text: opt.text,
            isCorrect: Boolean(opt.isCorrect),
          })) || [
            { text: '', isCorrect: true },
            { text: '', isCorrect: false },
          ],
        }))
      : [
          {
            text: '',
            options: [
              { text: '', isCorrect: true },
              { text: '', isCorrect: false },
            ],
          },
        ];

  const [hasExam, setHasExam] = useState(
    Boolean(initialLesson?.exams && initialLesson.exams.length > 0),
  );
  const [questions, setQuestions] = useState<QuestionItem[]>(existingQuestions);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        text: '',
        options: [
          { text: '', isCorrect: true },
          { text: '', isCorrect: false },
        ],
      },
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleAddOption = (qIndex: number) => {
    const updated = [...questions];
    updated[qIndex].options.push({ text: '', isCorrect: false });
    setQuestions(updated);
  };

  const handleSetCorrectOption = (qIndex: number, optIndex: number) => {
    const updated = [...questions];
    updated[qIndex].options = updated[qIndex].options.map((opt, i) => ({
      ...opt,
      isCorrect: i === optIndex,
    }));
    setQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const payload: any = {
        title,
        videoUrl,
        contextText,
        downloadableUrl: downloadableUrl.trim() || undefined,
        order: initialLesson?.order || 1,
      };

      if (hasExam) {
        payload.examForm = {
          title: `Evaluación: ${title}`,
          questions: questions.map((q) => ({
            text: q.text,
            options: q.options.map((opt) => ({
              text: opt.text,
              isCorrect: opt.isCorrect,
            })),
          })),
        };
      } else {
        payload.examForm = null;
      }

      const res = isEditing
        ? await api.put(`/lessons/${initialLesson.id}`, payload)
        : await api.post(`/modules/${moduleId}/lessons`, payload);

      onLessonCreated(res.data);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Error al guardar la lección';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.modalOverlay}>
      <div className="skylearn-card" style={styles.modalCard}>
        <div style={styles.header}>
          <div>
            <h3 style={styles.title}>
              {isEditing ? 'Editar Lección Didáctica' : 'Nueva Lección con Formulario Evaluativo'}
            </h3>
            <span style={styles.subtitle}>
              {isEditing
                ? 'Modifica el video, contexto pedagógico o las preguntas de evaluación de la lección'
                : 'Configura el video, contexto pedagógico y preguntas evaluativas'}
            </span>
          </div>
          <button onClick={onCancel} style={styles.closeBtn}><X size={20} /></button>
        </div>

        {errorMsg && <div style={styles.errorBox}>{errorMsg}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Título de la lección */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Título de la Lección</label>
            <input
              type="text"
              required
              placeholder="Ej. Introducción a Componentes y Props"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={styles.input}
            />
          </div>

          {/* Video URL YouTube */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Enlace de YouTube (URL Canónica)</label>
            <div style={styles.inputRow}>
              <Video size={20} color="#EF4444" />
              <input
                type="url"
                required
                placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                style={styles.inputBare}
              />
            </div>
          </div>

          {/* Variable de Contexto del Video */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>
              Variable de Contexto Pedagógico del Video (Alimenta al Tutor 3D y Evaluaciones)
            </label>
            <textarea
              required
              rows={3}
              placeholder="Describe detalladamente los conceptos, ejemplos y definiciones abordados en este video para que la IA y las evaluaciones tengan contexto didáctico..."
              value={contextText}
              onChange={(e) => setContextText(e.target.value)}
              style={styles.textarea}
            />
          </div>

          {/* Enlace de Material Opcional */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Material Descargable (Opcional - Placeholder Automático)</label>
            <input
              type="url"
              placeholder="https://ejemplo.com/diapositivas.pdf (deja en blanco para recurso por defecto)"
              value={downloadableUrl}
              onChange={(e) => setDownloadableUrl(e.target.value)}
              style={styles.input}
            />
          </div>

          {/* Switch de Formulario Evaluativo */}
          <div style={styles.examToggleCard}>
            <div style={styles.examToggleHeader}>
              <input
                type="checkbox"
                id="hasExamCheckbox"
                checked={hasExam}
                onChange={(e) => setHasExam(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="hasExamCheckbox" style={{ fontWeight: 800, fontSize: '15px', cursor: 'pointer' }}>
                Habilitar Formulario Evaluativo de la Lección (Opciones Múltiples)
              </label>
            </div>
            <span style={styles.examToggleDesc}>
              El estudiante responderá haciendo clic en las opciones predefinidas y el tutor 3D utilizará estas preguntas como banco evaluativo.
            </span>
          </div>

          {/* Constructor Dinámico de Preguntas y Respuestas */}
          {hasExam && (
            <div style={styles.questionsBuilder}>
              <div style={styles.builderHeader}>
                <h4 style={{ fontSize: '16px', fontWeight: 800 }}>Preguntas Configuradas ({questions.length})</h4>
                <button type="button" onClick={handleAddQuestion} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '13px' }}>
                  <Plus size={16} />
                  <span>Añadir Pregunta</span>
                </button>
              </div>

              {questions.map((q, qIndex) => (
                <div key={qIndex} style={styles.questionCard}>
                  <div style={styles.questionTop}>
                    <span style={styles.qNumber}>Pregunta #{qIndex + 1}</span>
                    {questions.length > 1 && (
                      <button type="button" onClick={() => handleRemoveQuestion(qIndex)} style={styles.iconBtn}>
                        <Trash2 size={16} color="var(--color-coral)" />
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    required
                    placeholder="Enunciado de la pregunta (Ej. ¿Qué es JSX?)"
                    value={q.text}
                    onChange={(e) => {
                      const updated = [...questions];
                      updated[qIndex].text = e.target.value;
                      setQuestions(updated);
                    }}
                    style={styles.input}
                  />

                  {/* Opciones */}
                  <div style={styles.optionsList}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-ink-muted)' }}>
                      Opciones (marca la opción correcta):
                    </span>
                    {q.options.map((opt, optIndex) => (
                      <div key={optIndex} style={styles.optionRow}>
                        <input
                          type="radio"
                          name={`correct-opt-${qIndex}`}
                          checked={opt.isCorrect}
                          onChange={() => handleSetCorrectOption(qIndex, optIndex)}
                          style={{ cursor: 'pointer' }}
                        />
                        <input
                          type="text"
                          required
                          placeholder={`Opción ${optIndex + 1}`}
                          value={opt.text}
                          onChange={(e) => {
                            const updated = [...questions];
                            updated[qIndex].options[optIndex].text = e.target.value;
                            setQuestions(updated);
                          }}
                          style={{
                            ...styles.input,
                            backgroundColor: opt.isCorrect ? 'var(--color-leaf-soft)' : 'var(--color-surface)',
                            borderColor: opt.isCorrect ? 'var(--color-leaf)' : 'var(--color-outline)',
                          }}
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleAddOption(qIndex)}
                      style={styles.addOptBtn}
                    >
                      + Añadir otra opción
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Botones de acción */}
          <div style={styles.actionsRow}>
            <button type="button" onClick={onCancel} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn-big-friendly">
              <Save size={18} />
              <span>
                {loading
                  ? 'Guardando...'
                  : isEditing
                  ? 'Guardar Cambios de Lección'
                  : 'Guardar Lección'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  modalOverlay: {
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
  modalCard: {
    width: '100%',
    maxWidth: '720px',
    maxHeight: '90vh',
    overflowY: 'auto',
    backgroundColor: '#FFFFFF',
    padding: '32px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
  },
  title: {
    fontSize: '22px',
    color: 'var(--color-ink)',
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--color-ink-muted)',
  },
  closeBtn: {
    background: 'transparent',
    color: 'var(--color-ink-muted)',
    padding: '6px',
    borderRadius: '50%',
  },
  errorBox: {
    padding: '12px',
    backgroundColor: 'var(--color-coral-soft)',
    color: 'var(--color-coral-deep)',
    borderRadius: 'var(--radius-md)',
    marginBottom: '16px',
    fontSize: '14px',
    fontWeight: 700,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 700,
    color: 'var(--color-ink)',
  },
  input: {
    padding: '10px 14px',
    borderRadius: 'var(--radius-sm)',
    border: '1.5px solid var(--color-outline)',
    backgroundColor: 'var(--color-surface)',
    fontSize: '15px',
    color: 'var(--color-ink)',
    outline: 'none',
  },
  inputRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    borderRadius: 'var(--radius-sm)',
    border: '1.5px solid var(--color-outline)',
    backgroundColor: 'var(--color-surface)',
  },
  inputBare: {
    flex: 1,
    border: 'none',
    backgroundColor: 'transparent',
    outline: 'none',
    fontSize: '15px',
    color: 'var(--color-ink)',
  },
  textarea: {
    padding: '10px 14px',
    borderRadius: 'var(--radius-sm)',
    border: '1.5px solid var(--color-outline)',
    backgroundColor: 'var(--color-surface)',
    fontSize: '14px',
    color: 'var(--color-ink)',
    outline: 'none',
    fontFamily: 'var(--font-body)',
  },
  examToggleCard: {
    padding: '16px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--color-sky-soft)',
    border: '1px solid var(--color-sky-bright)',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  examToggleHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  examToggleDesc: {
    fontSize: '13px',
    color: 'var(--color-ink-muted)',
    marginLeft: '28px',
  },
  questionsBuilder: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginTop: '8px',
  },
  builderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questionCard: {
    padding: '16px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-outline)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  questionTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qNumber: {
    fontWeight: 800,
    fontSize: '13px',
    color: 'var(--color-sky-deep)',
  },
  iconBtn: {
    background: 'transparent',
    cursor: 'pointer',
  },
  optionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  optionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  addOptBtn: {
    alignSelf: 'flex-start',
    background: 'transparent',
    color: 'var(--color-sky-deep)',
    fontSize: '13px',
    fontWeight: 700,
    padding: '4px 0',
  },
  actionsRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid var(--color-outline)',
  },
};
