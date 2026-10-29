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
  Pencil,
  Trash2,
  AlertTriangle,
  X,
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
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Formulario nuevo curso
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('Desarrollo Web');
  const [isSubmittingCourse, setIsSubmittingCourse] = useState(false);

  // Formulario edición de curso
  const [editingCourse, setEditingCourse] = useState<CourseItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('Desarrollo Web');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Confirmación eliminación de curso
  const [deletingCourse, setDeletingCourse] = useState<CourseItem | null>(null);
  const [isDeletingCourse, setIsDeletingCourse] = useState(false);

  // Edición y eliminación de lección
  const [editingLesson, setEditingLesson] = useState<any | null>(null);
  const [deletingLesson, setDeletingLesson] = useState<any | null>(null);
  const [isDeletingLesson, setIsDeletingLesson] = useState(false);

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

  const triggerToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
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
      triggerToast(err.response?.data?.message || err.response?.data?.detail || 'Error al crear el curso', 'error');
    } finally {
      setIsSubmittingCourse(false);
    }
  };

  const handleStartEditCourse = (course: CourseItem) => {
    setEditingCourse(course);
    setEditTitle(course.title);
    setEditDescription(course.description || '');
    setEditCategory(course.category || 'Desarrollo Web');
  };

  const handleSaveEditCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse || !editTitle.trim()) return;

    setIsSubmittingEdit(true);
    try {
      const res = await api.put(`/courses/${editingCourse.id}`, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        categoryName: editCategory.trim() || 'General',
      });

      confetti({ particleCount: 60 });
      triggerToast(`¡Curso "${res.data.title}" actualizado con éxito!`);
      setEditingCourse(null);

      // Recargar lista y si estábamos viendo su detalle, actualizarlo
      await loadCourses();
      if (selectedCourseId === editingCourse.id) {
        await loadCourseDetail(editingCourse.id);
      }
    } catch (err: any) {
      console.error('Error al editar curso:', err);
      triggerToast(err.response?.data?.message || err.response?.data?.detail || 'Error al actualizar el curso', 'error');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleStartDeleteCourse = (course: CourseItem) => {
    setDeletingCourse(course);
  };

  const handleConfirmDeleteCourse = async () => {
    if (!deletingCourse) return;

    setIsDeletingCourse(true);
    try {
      const res = await api.delete(`/courses/${deletingCourse.id}`);
      const deletedTitle = deletingCourse.title;
      const msg = res.data?.message || `El curso "${deletedTitle}" ha sido procesado exitosamente.`;
      triggerToast(msg);
      setDeletingCourse(null);

      // Si el curso eliminado era el que estaba seleccionado en detalle, volver a la lista
      if (selectedCourseId === deletingCourse.id) {
        onBackToCourseList();
      }
      await loadCourses();
    } catch (err: any) {
      console.error('Error al eliminar curso:', err);
      triggerToast(err.response?.data?.message || err.response?.data?.detail || 'Error al eliminar el curso', 'error');
    } finally {
      setIsDeletingCourse(false);
    }
  };

  const handleOpenLessonEditor = (moduleId: string) => {
    setActiveModuleId(moduleId);
    setEditingLesson(null);
    setShowLessonEditor(true);
  };

  const handleStartEditLesson = (lesson: any, moduleId: string) => {
    setActiveModuleId(moduleId);
    setEditingLesson(lesson);
    setShowLessonEditor(true);
  };

  const handleStartDeleteLesson = (lesson: any) => {
    setDeletingLesson(lesson);
  };

  const handleConfirmDeleteLesson = async () => {
    if (!deletingLesson) return;

    setIsDeletingLesson(true);
    try {
      const res = await api.delete(`/lessons/${deletingLesson.id}`);
      const deletedTitle = deletingLesson.title;
      triggerToast(res.data?.message || `Lección "${deletedTitle}" eliminada exitosamente.`);
      setDeletingLesson(null);

      if (selectedCourseId) {
        await loadCourseDetail(selectedCourseId);
      }
      await loadCourses();
    } catch (err: any) {
      console.error('Error al eliminar lección:', err);
      triggerToast(
        err.response?.data?.message || err.response?.data?.detail || 'Error al eliminar la lección',
        'error',
      );
    } finally {
      setIsDeletingLesson(false);
    }
  };

  const handleLessonSaved = (savedLesson: any) => {
    const wasEditing = Boolean(editingLesson);
    setShowLessonEditor(false);
    setEditingLesson(null);
    confetti({ particleCount: 80, spread: 60 });
    triggerToast(
      wasEditing
        ? `¡Lección "${savedLesson.title}" actualizada exitosamente!`
        : `¡Lección "${savedLesson.title}" guardada exitosamente en el curso!`,
    );
    if (selectedCourseId) {
      loadCourseDetail(selectedCourseId);
    }
    loadCourses();
  };

  return (
    <div style={styles.container}>
      {/* Toast flotante accesible */}
      {toast && (
        <div
          style={{
            ...styles.toastBanner,
            backgroundColor: toast.type === 'error' ? '#FDE8E8' : '#DEF7EC',
            color: toast.type === 'error' ? '#9B1C1C' : '#03543F',
            borderColor: toast.type === 'error' ? '#F98080' : '#31C48D',
          }}
        >
          {toast.type === 'error' ? (
            <AlertTriangle size={20} color="#9B1C1C" />
          ) : (
            <CheckCircle size={20} color="#046C4E" />
          )}
          <span>{toast.message}</span>
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
              <div style={{ flex: 1, minWidth: '260px' }}>
                <h1 style={styles.pageTitle}>{currentCourseDetail.title}</h1>
                <p style={styles.pageSubtitle}>{currentCourseDetail.description}</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  className="btn-secondary"
                  onClick={() => handleStartEditCourse(currentCourseDetail)}
                  title="Editar datos del curso"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Pencil size={16} />
                  <span>Editar Curso</span>
                </button>

                <button
                  className="btn-secondary"
                  onClick={() => handleStartDeleteCourse(currentCourseDetail)}
                  title="Eliminar curso"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#DC2626', borderColor: '#FCA5A5' }}
                >
                  <Trash2 size={16} />
                  <span>Eliminar Curso</span>
                </button>

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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {onSelectLessonForPreview && (
                                <button
                                  className="btn-secondary"
                                  onClick={() => onSelectLessonForPreview(lesson)}
                                  title="Previsualizar cómo verá la lección el alumno"
                                  style={{ padding: '6px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <span>Preview</span>
                                  <ExternalLink size={13} />
                                </button>
                              )}

                              <button
                                className="btn-secondary"
                                onClick={() => handleStartEditLesson(lesson, mod.id)}
                                title="Editar video, contexto y preguntas de la lección"
                                aria-label={`Editar lección ${lesson.title}`}
                                style={{ padding: '6px 8px', display: 'inline-flex', alignItems: 'center' }}
                              >
                                <Pencil size={14} />
                              </button>

                              <button
                                className="btn-secondary"
                                onClick={() => handleStartDeleteLesson(lesson)}
                                title="Eliminar lección"
                                aria-label={`Eliminar lección ${lesson.title}`}
                                style={{ padding: '6px 8px', display: 'inline-flex', alignItems: 'center', color: '#DC2626', borderColor: '#FCA5A5' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
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
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 14px', flex: 1, justifyContent: 'center' }}
                    >
                      <BookOpen size={17} />
                      <span>Gestionar</span>
                    </button>

                    <button
                      className="btn-secondary"
                      onClick={() => handleStartEditCourse(course)}
                      title="Editar datos del curso"
                      aria-label={`Editar curso ${course.title}`}
                      style={{ padding: '10px 12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      className="btn-secondary"
                      onClick={() => handleStartDeleteCourse(course)}
                      title="Eliminar curso"
                      aria-label={`Eliminar curso ${course.title}`}
                      style={{ padding: '10px 12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626', borderColor: '#FCA5A5' }}
                    >
                      <Trash2 size={16} />
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

      {/* MODAL PARA EDITAR UN CURSO */}
      {editingCourse && (
        <div style={styles.modalOverlay}>
          <div className="skylearn-card" style={styles.modalCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: 'var(--color-ink)' }}>
                Editar Curso
              </h2>
              <button
                type="button"
                onClick={() => setEditingCourse(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-ink-muted)' }}
              >
                <X size={20} />
              </button>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--color-ink-muted)', margin: '0 0 20px 0' }}>
              Modifica el título, categoría didáctica o resumen pedagógico del curso.
            </p>

            <form onSubmit={handleSaveEditCourse}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Título del Curso *</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Categoría Didáctica</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
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
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  style={{ ...styles.input, resize: 'vertical' }}
                />
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setEditingCourse(null)}
                  disabled={isSubmittingEdit}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-big-friendly"
                  disabled={isSubmittingEdit}
                  style={{ minWidth: '160px', justifyContent: 'center' }}
                >
                  <Pencil size={18} />
                  <span>{isSubmittingEdit ? 'Guardando...' : 'Guardar Cambios'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {deletingCourse && (
        <div style={styles.modalOverlay}>
          <div className="skylearn-card" style={{ ...styles.modalCard, maxWidth: '480px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div
                style={{
                  backgroundColor: '#FDE8E8',
                  borderRadius: '50%',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AlertTriangle size={28} color="#E02424" />
              </div>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#9B1C1C' }}>
                  ¿Eliminar este curso?
                </h2>
                <span style={{ fontSize: '13px', color: 'var(--color-ink-muted)' }}>
                  Acción irreversible o archivo preventivo
                </span>
              </div>
            </div>

            <p style={{ fontSize: '14px', color: 'var(--color-ink)', lineHeight: 1.6, margin: '0 0 16px 0' }}>
              Estás a punto de eliminar el curso <strong>"{deletingCourse.title}"</strong>.
            </p>

            <div
              style={{
                backgroundColor: '#F3F4F6',
                borderRadius: '8px',
                padding: '12px 14px',
                fontSize: '13px',
                color: 'var(--color-ink-muted)',
                marginBottom: '24px',
                borderLeft: '4px solid #3B82F6',
              }}
            >
              <strong>Política del Sistema:</strong> Si el curso no tiene estudiantes matriculados, se eliminará por completo junto con sus módulos. Si ya cuenta con estudiantes activos, se archivará automáticamente para preservar su progreso formativo.
            </div>

            <div style={styles.modalActions}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDeletingCourse(null)}
                disabled={isDeletingCourse}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCourse}
                disabled={isDeletingCourse}
                style={{
                  backgroundColor: '#E02424',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px 20px',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: isDeletingCourse ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(224, 36, 36, 0.3)',
                }}
              >
                <Trash2 size={16} />
                <span>{isDeletingCourse ? 'Eliminando...' : 'Sí, eliminar curso'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITOR DE LECCIÓN DENTRO DEL MÓDULO DEL CURSO */}
      {showLessonEditor && activeModuleId && (
        <TeacherLessonEditor
          moduleId={activeModuleId}
          initialLesson={editingLesson}
          onLessonCreated={handleLessonSaved}
          onCancel={() => {
            setShowLessonEditor(false);
            setEditingLesson(null);
          }}
        />
      )}

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN DE LECCIÓN */}
      {deletingLesson && (
        <div style={styles.modalOverlay}>
          <div className="skylearn-card" style={{ ...styles.modalCard, maxWidth: '480px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div
                style={{
                  backgroundColor: '#FDE8E8',
                  borderRadius: '50%',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AlertTriangle size={28} color="#E02424" />
              </div>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#9B1C1C' }}>
                  ¿Eliminar esta lección?
                </h2>
                <span style={{ fontSize: '13px', color: 'var(--color-ink-muted)' }}>
                  Acción permanente
                </span>
              </div>
            </div>

            <p style={{ fontSize: '14px', color: 'var(--color-ink)', lineHeight: 1.6, margin: '0 0 16px 0' }}>
              Estás a punto de eliminar la lección <strong>"{deletingLesson.title}"</strong> y su formulario evaluativo asociado si lo tuviera.
            </p>

            <div style={styles.modalActions}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDeletingLesson(null)}
                disabled={isDeletingLesson}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteLesson}
                disabled={isDeletingLesson}
                style={{
                  backgroundColor: '#E02424',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px 20px',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: isDeletingLesson ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(224, 36, 36, 0.3)',
                }}
              >
                <Trash2 size={16} />
                <span>{isDeletingLesson ? 'Eliminando...' : 'Sí, eliminar lección'}</span>
              </button>
            </div>
          </div>
        </div>
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
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
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
