// frontend-web/src/pages/TeacherCourseManager.tsx
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { TeacherLessonEditor } from '../components/TeacherLessonEditor';
import {
  BookOpen,
  PlusCircle,
  Video,
  ListOrdered,
  ArrowLeft,
  FolderPlus,
  CheckCircle,
  FileQuestion,
  ExternalLink,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CourseItem {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  modulesCount: number;
}

interface TeacherCourseManagerProps {
  user?: any;
  selectedCourseId?: string | null;
  onNavigateToCourse: (courseId: string) => void;
  onBackToCourseList: () => void;
  onSelectLessonForPreview?: (lesson: any) => void;
}

export function TeacherCourseManager({
  user: _user,
  selectedCourseId,
  onNavigateToCourse,
  onBackToCourseList,
  onSelectLessonForPreview,
}: TeacherCourseManagerProps) {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [currentCourseDetail, setCurrentCourseDetail] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateCourseModal, setShowCreateCourseModal] = useState(false);
  const [showLessonEditor, setShowLessonEditor] = useState(false);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Formulario nuevo curso
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('Desarrollo Web');
  const [isSubmittingCourse, setIsSubmittingCourse] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      loadCourseDetail(selectedCourseId);
    } else {
      setCurrentCourseDetail(null);
    }
  }, [selectedCourseId]);

  const loadCourses = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/courses');
      setCourses(res.data);
    } catch (err) {
      console.error('Error cargando cursos del docente:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCourseDetail = async (courseId: string) => {
    setIsLoading(true);
    try {
      const res = await api.get(`/courses/${courseId}`);
      setCurrentCourseDetail(res.data);
      // Tomamos el primer módulo disponible
      if (res.data.modules && res.data.modules.length > 0) {
        setActiveModuleId(res.data.modules[0].id);
      }
    } catch (err) {
      console.error('Error cargando detalle del curso:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmittingCourse(true);
    try {
      const res = await api.post('/courses', {
        title: newTitle.trim(),
        description: newDescription.trim() || 'Curso práctico guiado con evaluaciones interactivas.',
        categoryName: newCategory.trim() || 'General',
      });

      confetti({ particleCount: 70 });
      setShowCreateCourseModal(false);
      setNewTitle('');
      setNewDescription('');

      // Recargar lista y seleccionar el nuevo curso de inmediato
      await loadCourses();
      onNavigateToCourse(res.data.id);
      triggerToast(`¡Curso "${res.data.title}" creado exitosamente! Ahora puedes agregarle lecciones.`);
    } catch (err: any) {
      console.error('Error al crear curso:', err);
      alert(err.response?.data?.detail || 'Error al crear el curso');
    } finally {
      setIsSubmittingCourse(false);
    }
  };

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast(null);
    }, 4500);
  };

  const handleOpenLessonEditor = (moduleId: string) => {
    setActiveModuleId(moduleId);
    setShowLessonEditor(true);
  };

  const handleLessonSaved = (newLesson: any) => {
    setShowLessonEditor(false);
    confetti({ particleCount: 80, spread: 60 });
    triggerToast(`¡Lección "${newLesson.title}" guardada exitosamente en el curso!`);
    if (selectedCourseId) {
      loadCourseDetail(selectedCourseId);
    }
    loadCourses();
  };

  return (
    <div style={styles.container}>
      {/* Toast flotante de éxito */}
      {successToast && (
        <div style={styles.toastBanner}>
          <CheckCircle size={20} color="#046C4E" />
          <span>{successToast}</span>
        </div>
      )}

      {/* VISTA 1: DETALLE Y LECCIONES DE UN CURSO SELECCIONADO */}
      {selectedCourseId && currentCourseDetail ? (
        <div>
          <button className="btn-secondary" onClick={onBackToCourseList} style={styles.backBtn}>
            <ArrowLeft size={18} />
            <span>Volver a Mis Cursos</span>
          </button>

          <div className="skylearn-card" style={styles.courseHeaderCard}>
            <div style={styles.badgeRow}>
              <span style={styles.categoryBadge}>{currentCourseDetail.category}</span>
              <span className="star-badge" style={{ backgroundColor: '#DEF7EC', color: '#03543F' }}>
                ID: {currentCourseDetail.id.slice(0, 8)}...
              </span>
            </div>

            <div style={styles.headerTitleRow}>
              <div>
                <h1 style={styles.pageTitle}>{currentCourseDetail.title}</h1>
                <p style={styles.pageSubtitle}>{currentCourseDetail.description}</p>
              </div>

              {activeModuleId && (
                <button
                  className="btn-big-friendly"
                  onClick={() => handleOpenLessonEditor(activeModuleId)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <PlusCircle size={20} />
                  <span>Añadir Lección a este Curso</span>
                </button>
              )}
            </div>
          </div>

          {/* Listado de Módulos y Lecciones Existentes */}
          <div style={{ marginTop: '28px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-ink)', marginBottom: '18px' }}>
              Lecciones Publicadas en este Curso
            </h2>

            {(!currentCourseDetail.modules || currentCourseDetail.modules.length === 0) ? (
              <div className="skylearn-card" style={styles.emptyCard}>
                <BookOpen size={48} color="var(--color-sky-deep)" style={{ marginBottom: '14px', opacity: 0.7 }} />
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0' }}>
                  Aún no has agregado lecciones a este curso
                </h3>
                <p style={{ color: 'var(--color-ink-muted)', fontSize: '14px', margin: '0 0 20px 0' }}>
                  Crea lecciones con videos de YouTube, instrucciones pedagógicas y preguntas con opciones correctas.
                </p>
                {activeModuleId && (
                  <button
                    className="btn-big-friendly"
                    onClick={() => handleOpenLessonEditor(activeModuleId)}
                  >
                    <PlusCircle size={20} />
                    <span>Crear Primera Lección</span>
                  </button>
                )}
              </div>
            ) : (
              currentCourseDetail.modules.map((mod: any, mIdx: number) => (
                <div key={mod.id} className="skylearn-card" style={styles.moduleSection}>
                  <div style={styles.moduleHeaderBar}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <ListOrdered size={20} color="var(--color-sky-deep)" />
                      <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
                        {mod.title || `Módulo ${mIdx + 1}`}
                      </h3>
                      <span style={{ fontSize: '13px', color: 'var(--color-ink-muted)' }}>
                        ({mod.lessons?.length || 0} lecciones)
                      </span>
                    </div>

                    <button
                      className="btn-secondary"
                      onClick={() => handleOpenLessonEditor(mod.id)}
                      style={{ padding: '6px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <PlusCircle size={16} />
                      <span>+ Lección en este Módulo</span>
                    </button>
                  </div>

                  {(!mod.lessons || mod.lessons.length === 0) ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-ink-muted)' }}>
                      No hay lecciones en este módulo. Pulsa el botón superior para agregar una.
                    </div>
                  ) : (
                    <div style={styles.lessonGrid}>
                      {mod.lessons.map((lesson: any, lIdx: number) => (
                        <div key={lesson.id} style={styles.lessonCard}>
                          <div style={styles.lessonCardHeader}>
                            <span style={styles.lessonBadge}>Lección #{lIdx + 1}</span>
                            <div style={styles.videoIndicator}>
                              <Video size={16} color="#DC2626" />
                              <span style={{ fontSize: '12px', fontWeight: 600 }}>YouTube</span>
                            </div>
                          </div>

                          <h4 style={styles.lessonCardTitle}>{lesson.title}</h4>
                          <p style={styles.lessonCardContext} title={lesson.contextText}>
                            {lesson.contextText ? (
                              lesson.contextText.length > 90 ? `${lesson.contextText.substring(0, 90)}...` : lesson.contextText
                            ) : (
                              'Sin contexto didáctico registrado'
                            )}
                          </p>

                          <div style={styles.lessonCardFooter}>
                            {lesson.exams && lesson.exams.length > 0 ? (
                              <div style={styles.examTag}>
                                <FileQuestion size={14} color="#046C4E" />
                                <span>Tiene Formulario ({lesson.exams.length})</span>
                              </div>
                            ) : (
                              <span style={{ fontSize: '12px', color: 'var(--color-ink-muted)' }}>
                                Sin formulario evaluativo
                              </span>
                            )}

                            {onSelectLessonForPreview && (
                              <button
                                className="btn-secondary"
                                onClick={() => onSelectLessonForPreview(lesson)}
                                style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                              >
                                <span>Ver Preview</span>
                                <ExternalLink size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* VISTA 2: LISTADO DE CURSOS DEL DOCENTE */
        <div>
          <div style={styles.topBar}>
            <div>
              <h1 style={styles.pageTitle}>Panel de Gestión Curricular</h1>
              <p style={styles.pageSubtitle}>
                Crea tus cursos, organiza tus lecciones didácticas y configura los formularios evaluativos interactivos.
              </p>
            </div>

            <button
              className="btn-big-friendly"
              onClick={() => setShowCreateCourseModal(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <FolderPlus size={20} />
              <span>Crear Nuevo Curso</span>
            </button>
          </div>

          {isLoading ? (
            <div style={styles.loadingBox}>
              <div className="spinner" style={{ marginBottom: '14px' }} />
              <p style={{ color: 'var(--color-ink-muted)', fontWeight: 600 }}>Cargando cursos del docente...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="skylearn-card" style={styles.emptyCard}>
              <FolderPlus size={52} color="var(--color-sky-deep)" style={{ marginBottom: '16px', opacity: 0.8 }} />
              <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 10px 0' }}>
                Aún no has creado ningún curso
              </h3>
              <p style={{ color: 'var(--color-ink-muted)', maxWidth: '480px', margin: '0 0 24px 0', lineHeight: 1.5 }}>
                Cada lección y formulario debe pertenecer a un curso estructurado. Crea tu primer curso para comenzar a publicar contenidos.
              </p>
              <button
                className="btn-big-friendly"
                onClick={() => setShowCreateCourseModal(true)}
              >
                <PlusCircle size={20} />
                <span>Crear Mi Primer Curso</span>
              </button>
            </div>
          ) : (
            <div style={styles.courseCardsGrid}>
              {courses.map((course) => (
                <div key={course.id} className="skylearn-card" style={styles.courseItemCard}>
                  <div style={styles.badgeRow}>
                    <span style={styles.categoryBadge}>{course.category || 'General'}</span>
                    <span style={{ fontSize: '12px', color: 'var(--color-ink-muted)' }}>
                      {course.modulesCount || 1} Módulo(s)
                    </span>
                  </div>

                  <h3 style={styles.courseItemTitle}>{course.title}</h3>
                  <p style={styles.courseItemDesc}>{course.description}</p>

                  <div style={styles.courseItemFooter}>
                    <button
                      className="btn-primary"
                      onClick={() => onNavigateToCourse(course.id)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', width: '100%', justifyContent: 'center' }}
                    >
                      <BookOpen size={18} />
                      <span>Gestionar Lecciones del Curso</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL PARA CREAR UN NUEVO CURSO */}
      {showCreateCourseModal && (
        <div style={styles.modalOverlay}>
          <div className="skylearn-card" style={styles.modalCard}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--color-ink)' }}>
              Crear Nuevo Curso
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--color-ink-muted)', margin: '0 0 20px 0' }}>
              Define el título, la categoría y el alcance didáctico. El curso creará automáticamente su módulo de lecciones.
            </p>

            <form onSubmit={handleCreateCourse}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Título del Curso *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Programación en Python para Niños y Principiantes"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Categoría Didáctica</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  style={styles.input}
                >
                  <option value="Desarrollo Web">Desarrollo Web</option>
                  <option value="Matemáticas">Matemáticas</option>
                  <option value="Ciencias Naturales">Ciencias Naturales</option>
                  <option value="Arte y Música">Arte y Música</option>
                  <option value="Idiomas">Idiomas</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Descripción del Curso</label>
                <textarea
                  rows={3}
                  placeholder="Describe los objetivos formativos y qué aprenderán los estudiantes..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  style={{ ...styles.input, resize: 'vertical' }}
                />
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowCreateCourseModal(false)}
                  disabled={isSubmittingCourse}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-big-friendly"
                  disabled={isSubmittingCourse}
                  style={{ minWidth: '160px', justifyContent: 'center' }}
                >
                  <FolderPlus size={18} />
                  <span>{isSubmittingCourse ? 'Guardando...' : 'Crear Curso'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITOR DE LECCIÓN DENTRO DEL MÓDULO DEL CURSO */}
      {showLessonEditor && activeModuleId && (
        <TeacherLessonEditor
          moduleId={activeModuleId}
          onLessonCreated={handleLessonSaved}
          onCancel={() => setShowLessonEditor(false)}
        />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '36px 20px',
    width: '100%',
  },
  toastBanner: {
    position: 'fixed',
    top: '24px',
    right: '24px',
    zIndex: 9999,
    backgroundColor: '#DEF7EC',
    color: '#03543F',
    border: '2px solid #31C48D',
    borderRadius: '12px',
    padding: '14px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontWeight: 700,
    fontSize: '15px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '16px',
    marginBottom: '32px',
  },
  pageTitle: {
    fontSize: '28px',
    fontWeight: 800,
    color: 'var(--color-ink, #1F2937)',
    margin: '0 0 8px 0',
  },
  pageSubtitle: {
    fontSize: '15px',
    color: 'var(--color-ink-muted, #4B5563)',
    margin: 0,
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '20px',
    padding: '8px 16px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  courseHeaderCard: {
    padding: '32px',
    backgroundColor: '#FFFFFF',
    border: '2px solid var(--color-sky-light, #E2F0FE)',
  },
  badgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '14px',
  },
  categoryBadge: {
    fontSize: '12px',
    fontWeight: 700,
    textTransform: 'uppercase',
    color: 'var(--color-sky-deep, #0A58CA)',
    backgroundColor: 'var(--color-sky-soft, #D0E4FE)',
    padding: '4px 10px',
    borderRadius: '12px',
  },
  headerTitleRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '20px',
  },
  moduleSection: {
    padding: '24px',
    marginBottom: '24px',
    backgroundColor: '#FFFFFF',
  },
  moduleHeaderBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '12px',
    marginBottom: '18px',
    paddingBottom: '14px',
    borderBottom: '1px solid #F3F4F6',
  },
  lessonGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '18px',
  },
  lessonCard: {
    border: '1px solid #E5E7EB',
    borderRadius: '14px',
    padding: '18px',
    backgroundColor: '#F9FAFB',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  lessonCardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '10px',
  },
  lessonBadge: {
    fontSize: '12px',
    fontWeight: 700,
    color: 'var(--color-sky-deep, #0A58CA)',
    backgroundColor: '#EBF5FF',
    padding: '3px 8px',
    borderRadius: '6px',
  },
  videoIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    color: '#DC2626',
  },
  lessonCardTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: 'var(--color-ink, #1F2937)',
    margin: '0 0 8px 0',
  },
  lessonCardContext: {
    fontSize: '13px',
    color: 'var(--color-ink-muted, #4B5563)',
    margin: '0 0 16px 0',
    lineHeight: 1.4,
  },
  lessonCardFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '12px',
    borderTop: '1px solid #E5E7EB',
  },
  examTag: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '12px',
    fontWeight: 700,
    color: '#046C4E',
    backgroundColor: '#EDFDF5',
    padding: '3px 8px',
    borderRadius: '6px',
  },
  courseCardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '24px',
  },
  courseItemCard: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  courseItemTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: 'var(--color-ink, #1F2937)',
    margin: '0 0 8px 0',
  },
  courseItemDesc: {
    fontSize: '14px',
    color: 'var(--color-ink-muted, #4B5563)',
    lineHeight: 1.5,
    margin: '0 0 20px 0',
    flex: 1,
  },
  courseItemFooter: {
    marginTop: 'auto',
  },
  emptyCard: {
    padding: '48px 24px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    padding: '20px',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    maxWidth: '540px',
    width: '100%',
    padding: '32px',
    borderRadius: '16px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  fieldGroup: {
    marginBottom: '18px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 700,
    marginBottom: '6px',
    color: 'var(--color-ink, #1F2937)',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '10px',
    border: '2px solid #E5E7EB',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  modalActions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '24px',
  },
};
