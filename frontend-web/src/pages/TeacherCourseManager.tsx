// frontend-web/src/pages/TeacherCourseManager.tsx
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { TeacherLessonEditor } from '../components/TeacherLessonEditor';
import {
  BookOpen,
  PlusCircle,
  Video,
  ArrowLeft,
  FolderPlus,
  CheckCircle,
  FileQuestion,
  ExternalLink,
  Pencil,
  Trash2,
  AlertTriangle,
  X,
  Layers,
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

  // Formulario nuevo módulo/curso
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('Desarrollo Web');
  const [isSubmittingCourse, setIsSubmittingCourse] = useState(false);

  // Formulario edición
  const [editingCourse, setEditingCourse] = useState<CourseItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('Desarrollo Web');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Confirmación eliminación
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
      console.error('Error cargando módulos del docente:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCourseDetail = async (courseId: string) => {
    setIsLoading(true);
    try {
      const res = await api.get(`/courses/${courseId}`);
      setCurrentCourseDetail(res.data);
      if (res.data.modules && res.data.modules.length > 0) {
        setActiveModuleId(res.data.modules[0].id);
      }
    } catch (err) {
      console.error('Error cargando detalle del módulo:', err);
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
        description: newDescription.trim() || 'Módulo didáctico con lecciones formativas y evaluaciones interactivas.',
        categoryName: newCategory.trim() || 'General',
      });

      confetti({ particleCount: 60 });
      setShowCreateCourseModal(false);
      setNewTitle('');
      setNewDescription('');

      await loadCourses();
      onNavigateToCourse(res.data.id);
      triggerToast(`¡Módulo "${res.data.title}" creado con éxito! Ahora agrega sus lecciones.`);
    } catch (err: any) {
      console.error('Error al crear módulo:', err);
      triggerToast(err.response?.data?.message || err.response?.data?.detail || 'Error al crear el módulo', 'error');
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

      triggerToast(`¡Módulo "${res.data.title}" actualizado con éxito!`);
      setEditingCourse(null);

      await loadCourses();
      if (selectedCourseId === editingCourse.id) {
        await loadCourseDetail(editingCourse.id);
      }
    } catch (err: any) {
      console.error('Error al editar módulo:', err);
      triggerToast(err.response?.data?.message || err.response?.data?.detail || 'Error al actualizar el módulo', 'error');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleConfirmDeleteCourse = async () => {
    if (!deletingCourse) return;

    setIsDeletingCourse(true);
    try {
      const res = await api.delete(`/courses/${deletingCourse.id}`);
      const deletedTitle = deletingCourse.title;
      triggerToast(res.data?.message || `Módulo "${deletedTitle}" procesado exitosamente.`);
      setDeletingCourse(null);

      if (selectedCourseId === deletingCourse.id) {
        onBackToCourseList();
      }
      await loadCourses();
    } catch (err: any) {
      console.error('Error al eliminar módulo:', err);
      triggerToast(err.response?.data?.message || err.response?.data?.detail || 'Error al eliminar el módulo', 'error');
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

  const handleConfirmDeleteLesson = async () => {
    if (!deletingLesson) return;

    setIsDeletingLesson(true);
    try {
      const res = await api.delete(`/lessons/${deletingLesson.id}`);
      triggerToast(res.data?.message || `Lección "${deletingLesson.title}" eliminada exitosamente.`);
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
    confetti({ particleCount: 60, spread: 50 });
    triggerToast(
      wasEditing
        ? `¡Lección "${savedLesson.title}" actualizada con éxito!`
        : `¡Lección "${savedLesson.title}" agregada al módulo!`,
    );
    if (selectedCourseId) {
      loadCourseDetail(selectedCourseId);
    }
    loadCourses();
  };

  return (
    <div style={styles.container}>
      {/* Toast de Notificaciones */}
      {toast && (
        <div
          style={{
            ...styles.toastBanner,
            backgroundColor: toast.type === 'error' ? 'var(--color-coral-soft)' : 'var(--color-leaf-soft)',
            color: toast.type === 'error' ? 'var(--color-coral)' : 'var(--color-leaf-deep)',
            borderColor: toast.type === 'error' ? 'var(--color-coral)' : 'var(--color-leaf)',
          }}
        >
          {toast.type === 'error' ? (
            <AlertTriangle size={18} />
          ) : (
            <CheckCircle size={18} />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* VISTA 1: DETALLE Y LECCIONES DE UN MÓDULO SELECCIONADO */}
      {selectedCourseId && currentCourseDetail ? (
        <div>
          <button className="btn-secondary" onClick={onBackToCourseList} style={styles.backBtn}>
            <ArrowLeft size={16} />
            <span>Volver a Mis Módulos</span>
          </button>

          <div className="skylearn-card" style={styles.courseHeaderCard}>
            <div style={styles.badgeRow}>
              <span style={styles.categoryBadge}>{currentCourseDetail.category}</span>
              <span style={styles.idBadge}>
                ID: {currentCourseDetail.id.slice(0, 8)}...
              </span>
            </div>

            <div style={styles.headerTitleRow}>
              <div style={{ flex: 1, minWidth: '240px' }}>
                <h1 style={styles.pageTitle}>{currentCourseDetail.title}</h1>
                <p style={styles.pageSubtitle}>{currentCourseDetail.description}</p>
              </div>

              <div style={styles.headerActionBtns}>
                <button
                  className="btn-secondary"
                  onClick={() => handleStartEditCourse(currentCourseDetail)}
                  title="Editar curso" aria-label="Editar curso"
                >
                  <Pencil size={14} />
                  
                </button>

                <button
                  className="btn-secondary"
                  onClick={() => setDeletingCourse(currentCourseDetail)}
                  title="Eliminar curso" aria-label="Eliminar curso"
                  style={{ color: 'var(--color-coral)', borderColor: 'var(--color-coral-soft)' }}
                >
                  <Trash2 size={14} />
                  
                </button>

                {activeModuleId && (
                  <button
                    className="btn-big-friendly"
                    onClick={() => handleOpenLessonEditor(activeModuleId)}
                  >
                    <PlusCircle size={16} />
                    <span>Crear Lección</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Listado de Lecciones */}
          <div style={{ marginTop: '24px' }}>
            <div style={styles.sectionHeadBar}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-ink)', margin: 0 }}>
                Lecciones de este Módulo ({currentCourseDetail.modules?.[0]?.lessons?.length || 0})
              </h2>

              {activeModuleId && (
                <button
                  className="btn-secondary"
                  onClick={() => handleOpenLessonEditor(activeModuleId)}
                  style={{ padding: '6px 14px', fontSize: '13px' }}
                >
                  <PlusCircle size={15} />
                  <span>+ Agregar Lección</span>
                </button>
              )}
            </div>

            {(!currentCourseDetail.modules ||
              currentCourseDetail.modules.length === 0 ||
              !currentCourseDetail.modules[0].lessons ||
              currentCourseDetail.modules[0].lessons.length === 0) ? (
              <div className="skylearn-card" style={styles.emptyCard}>
                <BookOpen size={40} color="var(--color-sky)" style={{ opacity: 0.8 }} />
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '8px 0 4px 0' }}>
                  Aún no has agregado lecciones a este módulo
                </h3>
                <p style={{ color: 'var(--color-ink-muted)', fontSize: '13px', margin: '0 0 16px 0', maxWidth: '420px' }}>
                  Crea lecciones con videos de YouTube, instrucciones pedagógicas y cuestionarios con opciones para tus alumnos.
                </p>
                {activeModuleId && (
                  <button
                    className="btn-big-friendly"
                    onClick={() => handleOpenLessonEditor(activeModuleId)}
                  >
                    <PlusCircle size={16} />
                    <span>Crear Primera Lección</span>
                  </button>
                )}
              </div>
            ) : (
              <div style={styles.lessonGrid}>
                {currentCourseDetail.modules[0].lessons.map((lesson: any, lIdx: number) => (
                  <div key={lesson.id} className="skylearn-card" style={styles.lessonCard}>
                    <div style={styles.lessonCardHeader}>
                      <span style={styles.lessonBadge}>Lección #{lIdx + 1}</span>
                      <div style={styles.videoIndicator}>
                        <Video size={14} color="#DC2626" />
                        <span>YouTube</span>
                      </div>
                    </div>

                    <h4 style={styles.lessonCardTitle}>{lesson.title}</h4>
                    <p style={styles.lessonCardContext} title={lesson.contextText}>
                      {lesson.contextText ? (
                        lesson.contextText.length > 80 ? `${lesson.contextText.substring(0, 80)}...` : lesson.contextText
                      ) : (
                        'Sin contexto didáctico registrado'
                      )}
                    </p>

                    <div style={styles.lessonCardFooter}>
                      <div>
                        {lesson.exams && lesson.exams.length > 0 ? (
                          <div style={styles.examTag}>
                            <FileQuestion size={13} color="var(--color-leaf-deep)" />
                            <span>Cuestionario ({lesson.exams.length})</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--color-ink-muted)' }}>
                            Sin formulario
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {onSelectLessonForPreview && (
                          <button
                            className="btn-secondary"
                            onClick={() => onSelectLessonForPreview(lesson)}
                            title="Previsualizar lección" aria-label="Previsualizar lección"
                            style={{ padding: '5px 8px', fontSize: '12px' }}
                          >
                            
                            <ExternalLink size={12} />
                          </button>
                        )}

                        <button
                          className="btn-secondary"
                          onClick={() => handleStartEditLesson(lesson, activeModuleId!)}
                          title="Editar lección" aria-label="Editar lección"
                          style={{ padding: '5px 8px' }}
                        >
                          <Pencil size={13} />
                        </button>

                        <button
                          className="btn-secondary"
                          onClick={() => setDeletingLesson(lesson)}
                          title="Eliminar lección" aria-label="Eliminar lección"
                          style={{ padding: '5px 8px', color: 'var(--color-coral)', borderColor: 'var(--color-coral-soft)' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* VISTA 2: LISTADO DE MÓDULOS DEL DOCENTE */
        <div>
          <div style={styles.topBar}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Layers size={20} color="var(--color-sky)" />
                <h1 style={styles.pageTitle}>Gestión docente de cursos</h1>
              </div>
              <p style={styles.pageSubtitle}>
                Aquí se muestran los cursos del sistema. Crea cursos y gestiona las lecciones de los que hayas creado.
              </p>
            </div>

            <button
              className="btn-big-friendly"
              onClick={() => setShowCreateCourseModal(true)}
            >
              <FolderPlus size={16} />
              <span>Crear curso</span>
            </button>
          </div>

          {isLoading ? (
            <div style={styles.loadingBox}>
              <p style={{ color: 'var(--color-ink-muted)', fontSize: '14px' }}>Cargando módulos formativos...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="skylearn-card" style={styles.emptyCard}>
              <FolderPlus size={44} color="var(--color-sky)" style={{ opacity: 0.8 }} />
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '8px 0 6px 0' }}>
                Aún no hay cursos
              </h3>
              <p style={{ color: 'var(--color-ink-muted)', maxWidth: '420px', margin: '0 0 16px 0', fontSize: '13px' }}>
                Crea un curso para añadir lecciones con videos y evaluaciones.
              </p>
              <button
                className="btn-big-friendly"
                onClick={() => setShowCreateCourseModal(true)}
              >
                <PlusCircle size={16} />
                <span>Crear curso</span>
              </button>
            </div>
          ) : (
            <div style={styles.courseCardsGrid}>
              {courses.map((course) => (
                <div key={course.id} className="skylearn-card" style={styles.courseItemCard}>
                  <div style={styles.badgeRow}>
                    <span style={styles.categoryBadge}>{course.category || 'General'}</span>
                    <span style={{ fontSize: '11px', color: 'var(--color-ink-muted)', fontWeight: 600 }}>
                      Curso
                    </span>
                  </div>

                  <h3 style={styles.courseItemTitle}>{course.title}</h3>
                  <p style={styles.courseItemDesc}>{course.description}</p>

                  <div style={styles.courseItemFooter}>
                    <button
                      className="btn-primary"
                      onClick={() => onNavigateToCourse(course.id)}
                      style={{ padding: '7px 14px', fontSize: '13px', flex: 1 }}
                    >
                      <BookOpen size={14} />
                      <span>Gestionar Lecciones</span>
                    </button>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL CREAR MÓDULO */}
      {showCreateCourseModal && (
        <div style={styles.modalOverlay} onClick={() => setShowCreateCourseModal(false)}>
          <div className="skylearn-card" style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--color-ink)' }}>
                Crear Nuevo Módulo Didáctico
              </h2>
              <button onClick={() => setShowCreateCourseModal(false)} style={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-ink-muted)', margin: '4px 0 16px 0' }}>
              Define el título y categoría. Luego podrás crear y organizar sus lecciones.
            </p>

            <form onSubmit={handleCreateCourse} style={styles.formCol}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Título del Módulo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Introducción a Algoritmos y Lógica de Programación"
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
                <label style={styles.label}>Descripción Pedagógica</label>
                <textarea
                  rows={3}
                  placeholder="Explica qué competencias adquirirán los estudiantes en este módulo..."
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
                >
                  <span>{isSubmittingCourse ? 'Guardando...' : 'Crear Módulo'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR MÓDULO */}
      {editingCourse && (
        <div style={styles.modalOverlay} onClick={() => setEditingCourse(null)}>
          <div className="skylearn-card" style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--color-ink)' }}>
                Editar Módulo Didáctico
              </h2>
              <button onClick={() => setEditingCourse(null)} style={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditCourse} style={{ ...styles.formCol, marginTop: '16px' }}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Título del Módulo *</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Categoría</label>
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
                <label style={styles.label}>Descripción</label>
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
                >
                  <span>{isSubmittingEdit ? 'Guardando...' : 'Guardar Cambios'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR ELIMINACIÓN MÓDULO */}
      {deletingCourse && (
        <div style={styles.modalOverlay} onClick={() => setDeletingCourse(null)}>
          <div className="skylearn-card" style={{ ...styles.modalCard, maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <AlertTriangle size={24} color="var(--color-coral)" />
              <h2 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: 'var(--color-coral)' }}>
                ¿Eliminar este módulo?
              </h2>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-ink)', lineHeight: 1.5, marginBottom: '16px' }}>
              Estás a punto de procesar el módulo <strong>"{deletingCourse.title}"</strong>.
            </p>
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
                  backgroundColor: 'var(--color-coral)',
                  color: '#FFFFFF',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 700,
                  fontSize: '13px',
                }}
              >
                {isDeletingCourse ? 'Eliminando...' : 'Confirmar Eliminación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR ELIMINACIÓN LECCIÓN */}
      {deletingLesson && (
        <div style={styles.modalOverlay} onClick={() => setDeletingLesson(null)}>
          <div className="skylearn-card" style={{ ...styles.modalCard, maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <AlertTriangle size={22} color="var(--color-coral)" />
              <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--color-coral)' }}>
                ¿Eliminar esta lección?
              </h2>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-ink)', marginBottom: '16px' }}>
              Se eliminará la lección <strong>"{deletingLesson.title}"</strong> y su cuestionario formativo.
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
                  backgroundColor: 'var(--color-coral)',
                  color: '#FFFFFF',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 700,
                  fontSize: '13px',
                }}
              >
                {isDeletingLesson ? 'Eliminando...' : 'Eliminar Lección'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITOR DE LECCIÓN */}
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
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px 16px',
    width: '100%',
    flex: 1,
  },
  toastBanner: {
    padding: '10px 16px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '13px',
    fontWeight: 600,
    marginBottom: '16px',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap',
    marginBottom: '20px',
  },
  pageTitle: {
    fontSize: '22px',
    fontWeight: 800,
    color: 'var(--color-ink)',
    margin: 0,
  },
  pageSubtitle: {
    fontSize: '13px',
    color: 'var(--color-ink-muted)',
    marginTop: '2px',
  },
  loadingBox: {
    padding: '30px',
    textAlign: 'center',
  },
  emptyCard: {
    padding: '36px 20px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: 'var(--color-surface-elevated)',
  },
  courseCardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
    gap: '18px',
  },
  courseItemCard: {
    padding: '18px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    backgroundColor: 'var(--color-surface-elevated)',
  },
  badgeRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    marginBottom: '10px',
  },
  categoryBadge: {
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--color-sky-deep)',
    backgroundColor: 'var(--color-sky-soft)',
    padding: '3px 8px',
    borderRadius: '6px',
  },
  idBadge: {
    fontSize: '11px',
    color: 'var(--color-ink-muted)',
    fontFamily: 'var(--font-mono)',
  },
  courseItemTitle: {
    fontSize: '16px',
    fontWeight: 800,
    color: 'var(--color-ink)',
    margin: '0 0 6px 0',
  },
  courseItemDesc: {
    fontSize: '13px',
    color: 'var(--color-ink-muted)',
    lineHeight: 1.45,
    margin: '0 0 16px 0',
    flex: 1,
  },
  courseItemFooter: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    paddingTop: '12px',
    borderTop: '1px solid var(--color-outline)',
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '14px',
  },
  courseHeaderCard: {
    padding: '20px',
    backgroundColor: 'var(--color-surface-elevated)',
  },
  headerTitleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    flexWrap: 'wrap',
  },
  headerActionBtns: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  sectionHeadBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '14px',
    flexWrap: 'wrap',
    gap: '10px',
  },
  lessonGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
  },
  lessonCard: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    backgroundColor: 'var(--color-surface-elevated)',
  },
  lessonCardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  lessonBadge: {
    fontSize: '11px',
    fontWeight: 800,
    color: 'var(--color-sky-deep)',
  },
  videoIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    color: '#DC2626',
    fontWeight: 600,
  },
  lessonCardTitle: {
    fontSize: '15px',
    fontWeight: 700,
    color: 'var(--color-ink)',
    margin: '0 0 4px 0',
  },
  lessonCardContext: {
    fontSize: '12px',
    color: 'var(--color-ink-muted)',
    lineHeight: 1.4,
    margin: '0 0 12px 0',
    flex: 1,
  },
  lessonCardFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '10px',
    borderTop: '1px solid var(--color-outline)',
  },
  examTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--color-leaf-deep)',
  },
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
    maxWidth: '520px',
    backgroundColor: 'var(--color-surface-elevated)',
    padding: '24px',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-modal)',
    border: '1px solid var(--color-outline)',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalCloseBtn: {
    background: 'transparent',
    color: 'var(--color-ink-muted)',
    padding: '4px',
    borderRadius: '50%',
    cursor: 'pointer',
  },
  formCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
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
  modalActions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '8px',
    marginTop: '16px',
  },
};
