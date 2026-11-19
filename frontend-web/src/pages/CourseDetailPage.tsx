// frontend-web/src/pages/CourseDetailPage.tsx
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  User as UserIcon,
  CheckCircle2,
  Lock,
  ArrowLeft,
  PlayCircle,
  Star,
  Sparkles,
  Info,
  Settings,
  Eye,
  AlertTriangle,
  X,
  PlusCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface Lesson {
  id: string;
  title: string;
  order: number;
  videoUrl?: string;
  contextText?: string;
}

interface Module {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

interface CourseDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  teacherName: string;
  teacherId?: string;
  isEnrolled: boolean;
  modules: Module[];
}

interface CourseDetailPageProps {
  courseId: string;
  user?: any;
  onSelectLesson: (lesson: any) => void;
  onBack: () => void;
}

export function CourseDetailPage({ courseId, user, onSelectLesson, onBack }: CourseDetailPageProps) {
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const isTeacher = user?.role === 'TEACHER';
  const isAuthor = isTeacher && Boolean(course?.teacherId && course.teacherId === user?.id);
  const totalCourseLessons = course?.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0;

  useEffect(() => {
    loadCourseDetail();
  }, [courseId]);

  const loadCourseDetail = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.get(`/courses/${courseId}`);
      setCourse(res.data);
    } catch (err: any) {
      console.error('Error cargando detalle del curso:', err);
      setErrorMsg('No se pudo cargar el detalle del curso. Por favor intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (totalCourseLessons === 0) {
      setNotification({
        type: 'info',
        message: 'Este curso se encuentra en preparación pedagógica y aún no tiene clases disponibles para cursar.',
      });
      return;
    }

    setIsEnrolling(true);
    setNotification(null);
    try {
      await api.post(`/courses/${courseId}/enroll`);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
      setNotification({
        type: 'success',
        message: '¡Te has inscrito exitosamente en el curso! Todas las clases del temario han quedado desbloqueadas.',
      });
      await loadCourseDetail();
    } catch (err: any) {
      console.error('Error al inscribirse en el curso:', err);
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Hubo un error al inscribirte en el curso. Por favor intenta nuevamente.',
      });
    } finally {
      setIsEnrolling(false);
    }
  };

  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div className="spinner" />
        <p style={{ marginTop: '16px', color: 'var(--color-ink-muted)' }}>Cargando temario del curso...</p>
      </div>
    );
  }

  if (errorMsg || !course) {
    return (
      <div style={styles.container}>
        <button onClick={onBack} style={styles.backBtn}>
          <ArrowLeft size={18} />
          <span>Volver al Catálogo</span>
        </button>
        <div className="skylearn-card" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-coral-deep)', fontWeight: 600 }}>{errorMsg || 'Curso no encontrado'}</p>
          <button onClick={loadCourseDetail} className="btn-secondary" style={{ marginTop: '16px' }}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Notificación Accesible Flotante (Reemplazo de window.alert) */}
      {notification && (
        <div
          style={{
            ...styles.notificationBanner,
            backgroundColor:
              notification.type === 'success'
                ? '#DEF7EC'
                : notification.type === 'error'
                ? '#FDE8E8'
                : '#E1EFFE',
            borderColor:
              notification.type === 'success'
                ? '#31C48D'
                : notification.type === 'error'
                ? '#F98080'
                : '#76A9FA',
            color:
              notification.type === 'success'
                ? '#046C4E'
                : notification.type === 'error'
                ? '#9B1C1C'
                : '#1E429F',
          }}
          role="alert"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {notification.type === 'success' && <CheckCircle2 size={18} color="#046C4E" />}
            {notification.type === 'error' && <AlertTriangle size={18} color="#9B1C1C" />}
            {notification.type === 'info' && <Info size={18} color="#1E429F" />}
            <span style={{ fontSize: '14px', fontWeight: 600 }}>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            style={styles.closeNotificationBtn}
            aria-label="Cerrar notificación"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Botón Volver */}
      <button onClick={onBack} style={styles.backBtn}>
        <ArrowLeft size={18} />
        <span>Volver al Catálogo de Cursos</span>
      </button>

      {/* Cabecera del Curso */}
      <div className="skylearn-card" style={styles.headerCard}>
        <div style={styles.headerMeta}>
          <span style={styles.categoryBadge}>{course.category || 'General'}</span>
          <div style={styles.ratingBadge}>
            <Star size={14} fill="#FFC83B" color="#FFC83B" />
            <span style={{ fontSize: '13px', fontWeight: 700 }}>4.9 (Demostración)</span>
          </div>
        </div>

        <h1 style={styles.courseTitle}>{course.title}</h1>
        <p style={styles.courseDescription}>{course.description}</p>

        <div style={styles.teacherInfo}>
          <div style={styles.teacherAvatar}>
            <UserIcon size={18} color="var(--color-sky-deep)" />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--color-ink-muted)', display: 'block' }}>Docente:</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-ink)' }}>
              {course.teacherName || 'Profesor de la Plataforma'}
            </span>
          </div>
        </div>

        {/* Adaptación de Cabecera por Rol (HU-01) */}
        {isTeacher ? (
          /* MODO DOCENTE: Banner de Creador / Supervisión con Enlace al Panel */
          <div style={styles.teacherBannerBox}>
            <div style={styles.teacherBannerContent}>
              <div style={styles.teacherBadge}>
                <Sparkles size={16} color="var(--course-accent)" />
                <span>{isAuthor ? 'Modo Docente Creador • Autor del Curso' : 'Modo Docente • Vista de Supervisión'}</span>
              </div>
              <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: 'var(--color-ink-muted)' }}>
                {isAuthor
                  ? 'Tienes acceso irrestricto a todas las lecciones sin candados ni necesidad de inscripción.'
                  : 'Como docente puedes previsualizar los contenidos y simular las interacciones del Tutor Virtual.'}
              </p>
            </div>
            {isAuthor && (
              <button
                onClick={() => {
                  window.location.hash = `#/teacher/courses/${course.id}`;
                }}
                className="btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  whiteSpace: 'nowrap',
                }}
              >
                <Settings size={16} />
                <span>Gestionar en Panel Curricular</span>
              </button>
            )}
          </div>
        ) : !course.isEnrolled ? (
          /* MODO ESTUDIANTE NO INSCRITO: CTA de Inscripción con Validación de Cero-State */
          <div style={styles.enrollCtaBox}>
            <div style={styles.enrollCtaText}>
              <Sparkles size={20} color="var(--color-sun)" />
              <span style={{ fontSize: '14px', color: 'var(--color-ink)' }}>
                {totalCourseLessons > 0
                  ? 'Inscríbete gratis para acceder a las clases interactivas y registrar tu progreso.'
                  : 'Este curso está en preparación pedagógica. Pronto estarán disponibles las lecciones.'}
              </span>
            </div>
            <button
              onClick={handleEnroll}
              disabled={isEnrolling || totalCourseLessons === 0}
              className="btn-primary"
              style={{
                padding: '10px 24px',
                opacity: totalCourseLessons === 0 ? 0.6 : 1,
                cursor: totalCourseLessons === 0 ? 'not-allowed' : 'pointer',
              }}
              title={totalCourseLessons === 0 ? 'Curso en preparación pedagógica' : 'Inscribirme al curso'}
            >
              {isEnrolling
                ? 'Inscribiendo...'
                : totalCourseLessons === 0
                ? 'En Preparación'
                : 'Inscribirme al Curso'}
            </button>
          </div>
        ) : (
          /* MODO ESTUDIANTE INSCRITO: Notificación de Membresía Activa */
          <div style={styles.enrolledNotice}>
            <CheckCircle2 size={20} color="#046C4E" />
            <span style={{ fontWeight: 600, color: '#046C4E' }}>
              Estás inscrito en este curso. Puedes comenzar o continuar cualquiera de las lecciones del temario.
            </span>
          </div>
        )}
      </div>

      {/* Temario de Módulos y Lecciones */}
      <div style={styles.curriculumSection}>
        <h2 style={styles.curriculumTitle}>Temario del Curso</h2>

        {course.modules?.length === 0 ? (
          /* Zero-State: Curso sin Módulos (RB-04) */
          <div className="skylearn-card" style={styles.emptyStateCard}>
            <div style={styles.emptyStateIconBox}>
              <PlusCircle size={32} color="#2563EB" />
            </div>
            {isTeacher ? (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0', color: '#1F2937' }}>
                  Tu curso aún no tiene módulos ni lecciones
                </h3>
                <p style={{ color: '#4B5563', fontSize: '14px', maxWidth: '500px', margin: '0 auto 16px auto' }}>
                  Comienza a estructurar el temario pedagógico, añade lecciones con enlaces de YouTube y configura preguntas interactivas.
                </p>
                <button
                  onClick={() => {
                    window.location.hash = `#/teacher/courses/${course.id}`;
                  }}
                  className="btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 22px' }}
                >
                  <PlusCircle size={16} />
                  <span>Crear Primer Módulo</span>
                </button>
              </div>
            ) : (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0', color: '#1F2937' }}>
                  Curso en preparación pedagógica
                </h3>
                <p style={{ color: '#4B5563', fontSize: '14px', maxWidth: '500px', margin: '0 auto' }}>
                  El profesor está preparando los módulos y contenidos interactivos de este curso. Vuelve pronto para comenzar tu aprendizaje.
                </p>
              </div>
            )}
          </div>
        ) : (
          course.modules.map((mod, idx) => (
            <div key={mod.id} className="skylearn-card" style={styles.moduleCard}>
              <div style={styles.moduleHeader}>
                <span style={styles.moduleNumber}>Módulo {idx + 1}</span>
                <h3 style={styles.moduleTitleText}>{mod.title}</h3>
              </div>

              <div style={styles.lessonList}>
                {mod.lessons.map((lesson, lIdx) => (
                  <div key={lesson.id} style={styles.lessonRow}>
                    <div style={styles.lessonInfo}>
                      <span style={styles.lessonOrderBadge}>{lIdx + 1}</span>
                      <div>
                        <h4 style={styles.lessonName}>{lesson.title}</h4>
                        <span style={styles.lessonSubText}>Video clase con evaluación interactiva</span>
                      </div>
                    </div>

                    <div>
                      {isTeacher ? (
                        /* DOCENTE: Previsualización universal sin candados (RB-02 & Escenario 1) */
                        <button
                          className="btn-secondary"
                          onClick={() => onSelectLesson(lesson)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 16px',
                            fontSize: '14px',
                            borderColor: 'var(--course-accent)',
                            color: 'var(--course-accent)',
                          }}
                          title="Previsualizar esta clase como docente"
                        >
                          <Eye size={17} />
                          <span>Previsualizar Lección</span>
                        </button>
                      ) : course.isEnrolled ? (
                        /* ALUMNO INSCRITO: Comenzar lección */
                        <button
                          className="btn-primary"
                          onClick={() => onSelectLesson(lesson)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 16px',
                            fontSize: '14px',
                          }}
                        >
                          <PlayCircle size={18} />
                          <span>Comenzar Lección</span>
                        </button>
                      ) : (
                        /* ALUMNO NO INSCRITO: Candado visual explicativo */
                        <button
                          className="btn-secondary"
                          onClick={handleEnroll}
                          title="Inscríbete en el curso para abrir esta lección"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 14px',
                            fontSize: '13px',
                            opacity: 0.85,
                          }}
                        >
                          <Lock size={15} />
                          <span>Inscríbete para ver</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '32px 20px',
    width: '100%',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 20px',
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '24px',
    background: 'none',
    border: 'none',
    color: 'var(--color-sky-deep, #0A58CA)',
    fontWeight: 700,
    fontSize: '15px',
    cursor: 'pointer',
    padding: 0,
  },
  headerCard: {
    padding: '32px',
    marginBottom: '36px',
    backgroundColor: 'var(--color-surface-elevated)',
    borderRadius: '16px',
    border: '1px solid var(--color-outline)',
  },
  headerMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  categoryBadge: {
    backgroundColor: '#EFF6FF',
    color: '#2563EB',
    padding: '4px 12px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 700,
  },
  ratingBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: 'var(--color-surface)',
    padding: '4px 10px',
    borderRadius: '999px',
    border: '1px solid #FDE68A',
  },
  courseTitle: {
    fontSize: '28px',
    fontWeight: 800,
    color: 'var(--color-ink, #1F2937)',
    margin: '0 0 12px 0',
    lineHeight: '1.25',
  },
  courseDescription: {
    fontSize: '15px',
    color: 'var(--color-ink-muted, #6B7280)',
    lineHeight: '1.6',
    margin: '0 0 24px 0',
    maxWidth: '800px',
  },
  teacherInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px',
    paddingTop: '16px',
    borderTop: '1px solid var(--color-outline)',
  },
  teacherAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#EFF6FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  enrollCtaBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF3C7',
    padding: '16px 20px',
    borderRadius: '12px',
    marginTop: '16px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  enrollCtaText: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  enrolledNotice: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#DEF7EC',
    padding: '14px 18px',
    borderRadius: '12px',
    marginTop: '16px',
  },
  curriculumSection: {
    marginTop: '24px',
  },
  curriculumTitle: {
    fontSize: '22px',
    fontWeight: 800,
    color: 'var(--color-ink, #1F2937)',
    marginBottom: '20px',
  },
  moduleCard: {
    padding: '24px',
    marginBottom: '24px',
    backgroundColor: 'var(--color-surface-elevated)',
    borderRadius: '16px',
    border: '1px solid var(--color-outline)',
  },
  moduleHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid var(--color-outline)',
  },
  moduleNumber: {
    fontSize: '12px',
    fontWeight: 700,
    backgroundColor: 'var(--color-surface-sunken)',
    color: 'var(--color-ink-muted)',
    padding: '4px 8px',
    borderRadius: '8px',
  },
  moduleTitleText: {
    fontSize: '18px',
    fontWeight: 700,
    margin: 0,
    color: 'var(--color-ink, #1F2937)',
  },
  lessonList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  lessonRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 18px',
    borderRadius: '12px',
    backgroundColor: 'var(--color-surface-sunken)',
    border: '1px solid var(--color-outline)',
    gap: '16px',
    flexWrap: 'wrap',
  },
  lessonInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  lessonOrderBadge: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-sky-soft)',
    color: 'var(--course-accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: 700,
    flexShrink: 0,
  },
  lessonName: {
    fontSize: '15px',
    fontWeight: 700,
    margin: '0 0 2px 0',
    color: 'var(--color-ink)',
  },
  lessonSubText: {
    fontSize: '12px',
    color: 'var(--color-ink-muted)',
  },

  // Estilos de la Fila del Docente Virtual
  tutorEvalRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderRadius: '14px',
    backgroundColor: 'var(--color-sky-soft)',
    border: '1.5px solid var(--color-outline)',
    marginTop: '6px',
    gap: '16px',
    flexWrap: 'wrap',
  },
  tutorEvalInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    flex: 1,
    minWidth: '280px',
  },
  tutorAvatarBadge: {
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)',
  },
  tutorEvalTitle: {
    fontSize: '15px',
    fontWeight: 800,
    color: 'var(--course-accent)',
    margin: 0,
  },
  demoBadge: {
    fontSize: '11px',
    fontWeight: 700,
    backgroundColor: '#DCFCE7',
    color: '#15803D',
    padding: '2px 8px',
    borderRadius: '6px',
    border: '1px solid #86EFAC',
  },
  tutorEvalSubText: {
    fontSize: '12px',
    color: 'var(--color-ink-muted)',
    display: 'block',
    marginTop: '2px',
  },
  tutorEvalActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  detailsBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    fontSize: '13px',
    backgroundColor: 'var(--color-surface-elevated)',
    borderColor: 'var(--color-outline)',
    color: 'var(--color-ink)',
  },
  startEvalBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 18px',
    fontSize: '13px',
    background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
  },
  notificationBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 18px',
    borderRadius: '12px',
    border: '1px solid',
    marginBottom: '20px',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
  },
  closeNotificationBtn: {
    background: 'none',
    border: 'none',
    color: 'inherit',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.8,
  },
  teacherBannerBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '18px 22px',
    backgroundColor: 'var(--color-sky-soft)',
    borderRadius: '14px',
    border: '1px solid var(--color-outline)',
    marginTop: '20px',
    gap: '16px',
    flexWrap: 'wrap',
  },
  teacherBannerContent: {
    flex: 1,
    minWidth: '240px',
  },
  teacherBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    fontWeight: 700,
    color: 'var(--course-accent)',
  },
  emptyStateCard: {
    padding: '48px 24px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateIconBox: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: '#EFF6FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
  },
};
