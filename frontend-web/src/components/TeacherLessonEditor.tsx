// frontend-web/src/components/TeacherLessonEditor.tsx
import React, { useState } from 'react';
import { Video, Plus, Trash2, Save, X, FileQuestion } from 'lucide-react';
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
  const [downloadableUrl] = useState(initialLesson?.downloadableUrl || '');

  // Carga previa de preguntas
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
        title: title.trim(),
        videoUrl: videoUrl.trim(),
        contextText: contextText.trim(),
        downloadableUrl: downloadableUrl.trim() || undefined,
        order: initialLesson?.order || 1,
      };

      if (hasExam) {
        payload.examForm = {
          title: `Evaluación: ${title.trim()}`,
          questions: questions.map((q) => ({
            text: q.text.trim(),
            options: q.options.map((opt) => ({
              text: opt.text.trim(),
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
    <div style={styles.modalOverlay} onClick={onCancel}>
      <div className="skylearn-card" style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div>
            <h3 style={styles.title}>
              {isEditing ? 'Editar Lección Didáctica' : 'Nueva Lección con Cuestionario'}
            </h3>
            <span style={styles.subtitle}>
              {isEditing
                ? 'Modifica el video, contexto pedagógico y preguntas'
                : 'Configura el video instructivo y las preguntas formativas'}
            </span>
          </div>
          <button onClick={onCancel} style={styles.closeBtn} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        {errorMsg && <div style={styles.errorBox}>{errorMsg}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Título de la lección */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Título de la Lección *</label>
            <input
              type="text"
              required
              placeholder="Ej. Introducción a Componentes y Props"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={styles.input}
            />
          </div>

          {/* Enlace de YouTube */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Enlace de YouTube (URL de la clase) *</label>
            <div style={styles.inputRow}>
              <Video size={16} color="#DC2626" />
              <input
                type="url"
                required
                placeholder="https://www.youtube.com/watch?v=..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                style={styles.inputBare}
              />
            </div>
          </div>

          {/* Variable de Contexto del Video */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>
              Contexto Didáctico del Video (Alimenta al Docente Virtual y Preguntas) *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Describe los conceptos clave y definiciones abordadas en este video..."
              value={contextText}
              onChange={(e) => setContextText(e.target.value)}
              style={styles.textarea}
            />
          </div>

          {/* Switch de Cuestionario Formativo */}
          <div style={styles.examToggleCard}>
            <div style={styles.examToggleHeader}>
              <input
                type="checkbox"
                id="hasExamCheckbox"
                checked={hasExam}
                onChange={(e) => setHasExam(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label htmlFor="hasExamCheckbox" style={{ fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileQuestion size={15} color="var(--color-sky-deep)" />
                <span>Habilitar Cuestionario Formativo (Opciones Múltiples)</span>
              </label>
            </div>
            <span style={styles.examToggleDesc}>
              El estudiante responderá haciendo clic en las opciones y el docente virtual usará estas preguntas para evaluar.
            </span>
          </div>

          {/* Constructor Dinámico de Preguntas */}
          {hasExam && (
            <div style={styles.questionsBuilder}>
              <div style={styles.builderHeader}>
                <h4 style={{ fontSize: '14px', fontWeight: 800, margin: 0 }}>
                  Preguntas Configuradas ({questions.length})
                </h4>
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '12px' }}
                >
                  <Plus size={14} />
                  <span>Añadir Pregunta</span>
                </button>
              </div>

              {questions.map((q, qIndex) => (
                <div key={qIndex} style={styles.questionCard}>
                  <div style={styles.questionTop}>
                    <span style={styles.qNumber}>Pregunta #{qIndex + 1}</span>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(qIndex)}
                        style={styles.iconBtn}
                        title="Eliminar pregunta"
                      >
                        <Trash2 size={14} color="var(--color-coral)" />
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    required
                    placeholder="Enunciado de la pregunta (Ej. ¿Qué es un estado en React?)"
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
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-ink-muted)' }}>
                      Marca el círculo de la opción correcta:
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
                            flex: 1,
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
              <Save size={16} />
              <span>{loading ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Guardar Lección'}</span>
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
    backdropFilter: 'blur(3px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '16px',
  },
  modalCard: {
    width: '100%',
    maxWidth: '620px',
    maxHeight: '90vh',
    overflowY: 'auto',
    backgroundColor: 'var(--color-surface-elevated)',
    padding: '24px',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-modal)',
    border: '1px solid var(--color-outline)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
  },
  title: {
    fontSize: '18px',
    color: 'var(--color-ink)',
    margin: 0,
  },
  subtitle: {
    fontSize: '12px',
    color: 'var(--color-ink-muted)',
  },
  closeBtn: {
    background: 'transparent',
    color: 'var(--color-ink-muted)',
    padding: '4px',
    borderRadius: '50%',
    cursor: 'pointer',
  },
  errorBox: {
    padding: '10px',
    backgroundColor: 'var(--color-coral-soft)',
    color: 'var(--color-coral)',
    borderRadius: 'var(--radius-sm)',
    marginBottom: '14px',
    fontSize: '13px',
    fontWeight: 700,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    fontSize: '12px',
    fontWeight: 700,
    color: 'var(--color-ink)',
  },
  input: {
    padding: '8px 12px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-outline)',
    backgroundColor: 'var(--color-surface)',
    fontSize: '14px',
    color: 'var(--color-ink)',
    outline: 'none',
  },
  inputRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-outline)',
    backgroundColor: 'var(--color-surface)',
  },
  inputBare: {
    flex: 1,
    border: 'none',
    backgroundColor: 'transparent',
    outline: 'none',
    fontSize: '14px',
    color: 'var(--color-ink)',
  },
  textarea: {
    padding: '8px 12px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-outline)',
    backgroundColor: 'var(--color-surface)',
    fontSize: '13px',
    color: 'var(--color-ink)',
    outline: 'none',
    fontFamily: 'var(--font-body)',
  },
  examToggleCard: {
    padding: '12px 14px',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--color-sky-soft)',
    border: '1px solid var(--color-sky)',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  examToggleHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  examToggleDesc: {
    fontSize: '11px',
    color: 'var(--color-ink-muted)',
    marginLeft: '24px',
  },
  questionsBuilder: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '6px',
  },
  builderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questionCard: {
    padding: '14px',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-outline)',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  questionTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qNumber: {
    fontWeight: 800,
    fontSize: '12px',
    color: 'var(--color-sky-deep)',
  },
  iconBtn: {
    background: 'transparent',
    cursor: 'pointer',
    padding: '2px',
  },
  optionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  optionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  addOptBtn: {
    alignSelf: 'flex-start',
    background: 'transparent',
    color: 'var(--color-sky-deep)',
    fontSize: '12px',
    fontWeight: 700,
    padding: '2px 0',
    cursor: 'pointer',
  },
  actionsRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid var(--color-outline)',
  },
};
