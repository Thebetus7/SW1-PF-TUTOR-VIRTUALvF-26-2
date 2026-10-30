// frontend-web/src/App.tsx
import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AuthPage } from './pages/AuthPage';
import { LessonViewer } from './components/LessonViewer';
import { RecommendationQuiz } from './components/RecommendationQuiz';
import { PaywallModal } from './components/PaywallModal';
import { CourseDetailPage } from './pages/CourseDetailPage';
import { TeacherCourseManager } from './pages/TeacherCourseManager';
import { api } from './services/api';
import { Compass, BookOpen, ArrowRight, FolderPlus, CheckCircle2 } from 'lucide-react';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  credits: number;
  subscriptionStatus: string;
}

export function App() {
  const [user, setUser] = useState<UserData | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [currentHash, setCurrentHash] = useState<string>(window.location.hash || '#/courses');
  const [activeLesson, setActiveLesson] = useState<any | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [unlockedLessons, setUnlockedLessons] = useState<string[]>([]);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);

  // Sincronización con el historial del navegador (Hash Routing)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      setCurrentHash(hash || '#/courses');
    };

    if (!window.location.hash || window.location.hash === '#' || window.location.hash === '#/') {
      window.location.hash = '#/courses';
    }

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem('user_data');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Error parseando sesión', e);
      }
    }
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const res = await api.get('/courses');
      setCourses(res.data);
    } catch {
      // Fallback con datos demo si el servidor aún no tiene cursos activos
      setCourses([
        {
          id: '00000000-0000-0000-0000-000000000001',
          title: 'Desarrollo Web Fullstack con React y NestJS',
          description: 'Aprende arquitectura modular, componentes reactivos y consumo seguro de APIs REST con TypeScript.',
          category: 'Desarrollo Web',
          teacherName: 'Profesor Docente',
          modulesCount: 1,
          isEnrolled: false,
        },
      ]);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    setUser(null);
    setActiveLesson(null);
    window.location.hash = '#/courses';
  };

  // Apertura controlada de lección con deducción de créditos y paywall
  const handleOpenLesson = async (lesson: any) => {
    const lessonId = lesson.id;

    if (user && user.role === 'STUDENT') {
      const isAlreadyUnlocked = unlockedLessons.includes(lessonId);
      const isSubscribed = user.subscriptionStatus === 'ACTIVE';

      if (!isAlreadyUnlocked && !isSubscribed) {
        if (user.credits <= 0) {
          setShowPaywall(true);
          return;
        }

        // Intento de acceso en el backend
        try {
          await api.post(`/lessons/${lessonId}/access`);
        } catch (err: any) {
          if (err.response?.status === 402) {
            setShowPaywall(true);
            return;
          }
        }

        const newCredits = Math.max(0, user.credits - 1);
        const updatedUser = { ...user, credits: newCredits };
        setUser(updatedUser);
        localStorage.setItem('user_data', JSON.stringify(updatedUser));
        setUnlockedLessons([...unlockedLessons, lessonId]);
      }
    }

    // Asegurar estructura de exámenes
    const fullLesson = {
      ...lesson,
      videoUrl: lesson.videoUrl || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      contextText: lesson.contextText || 'Conceptos clave de la clase interactiva.',
      exams: lesson.exams && lesson.exams.length > 0 ? lesson.exams : [
        {
          id: 'exam-' + lesson.id,
          title: 'Evaluación Formativa de la Lección',
          questions: [
            {
              id: 'q1-' + lesson.id,
              text: `¿Cuál es el objetivo principal explicado en la lección "${lesson.title}"?`,
              options: [
                { id: 'opt1', text: 'Comprender los fundamentos prácticos presentados en el video', isCorrect: true },
                { id: 'opt2', text: 'Ignorar las instrucciones del tutor interactivo', isCorrect: false },
              ],
            },
          ],
        },
      ],
    };

    setActiveLesson(fullLesson);
    window.location.hash = `#/lessons/${lessonId}`;
  };

  const handleCompleteLesson = (lessonId: string) => {
    if (!completedLessons.includes(lessonId)) {
      setCompletedLessons([...completedLessons, lessonId]);
    }
  };

  // Parser de rutas hash
  const route = currentHash.replace(/^#\/?/, '').split('/');
  const mainSegment = route[0] || 'courses';
  const paramId = route[1] || null;
  const isTeacherRoute = mainSegment === 'teacher';
  const teacherSubSegment = route[1] || null;
  const teacherCourseId = route[2] || null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        user={user}
        onLogout={handleLogout}
        onOpenCatalog={() => {
          window.location.hash = '#/courses';
        }}
        currentPath={currentHash}
      />

      {!user ? (
        <AuthPage onAuthSuccess={(userData) => setUser(userData)} />
      ) : mainSegment === 'lessons' && activeLesson ? (
        /* VISTA: VISOR DE LECCIÓN */
        <LessonViewer
          lesson={activeLesson}
          onBack={() => {
            window.history.back();
          }}
          onCompleteLesson={handleCompleteLesson}
        />
      ) : mainSegment === 'courses' && paramId ? (
        /* VISTA: DETALLE DE CURSO Y PRE-INSCRIPCIÓN DEL ESTUDIANTE */
        <CourseDetailPage
          courseId={paramId}
          user={user}
          onSelectLesson={(lesson) => handleOpenLesson(lesson)}
          onBack={() => {
            window.location.hash = '#/courses';
          }}
        />
      ) : isTeacherRoute && user.role === 'TEACHER' ? (
        /* VISTA: GESTOR DE CURSOS Y LECCIONES DEL DOCENTE */
        <TeacherCourseManager
          user={user}
          selectedCourseId={teacherCourseId || (teacherSubSegment !== 'courses' ? teacherSubSegment : null)}
          onNavigateToCourse={(courseId) => {
            window.location.hash = `#/teacher/courses/${courseId}`;
          }}
          onBackToCourseList={() => {
            window.location.hash = '#/teacher/courses';
          }}
          onSelectLessonForPreview={(lesson) => handleOpenLesson(lesson)}
        />
      ) : (
        /* VISTA PRINCIPAL: CATÁLOGO DE CURSOS */
        <main style={styles.mainContainer}>
          {/* Banner de Bienvenida Skylearn */}
          <div className="skylearn-card" style={styles.welcomeBanner}>
            <div style={styles.bannerContent}>
              <div style={styles.badgeRow}>
                {user.role === 'STUDENT' ? (
                  <span className="star-badge">⭐ {user.credits} Créditos Disponibles</span>
                ) : (
                  <span className="star-badge" style={{ backgroundColor: 'var(--color-sky-soft)', color: 'var(--color-sky-deep)' }}>
                    Perfil Docente
                  </span>
                )}
                <span style={styles.planBadge}>Plan Freemium</span>
              </div>
              <h2 style={styles.welcomeTitle}>¡Hola, {user.name}!</h2>
              <p style={styles.welcomeDesc}>
                {user.role === 'STUDENT'
                  ? 'Explora el catálogo de cursos, inscríbete gratis para ver el temario y utiliza tus créditos para desbloquear lecciones con tutoría 3D y evaluaciones.'
                  : 'Administra tus cursos curriculares, estructura los módulos con videos de YouTube y construye formularios evaluativos interactivos.'}
              </p>

              <div style={styles.bannerActions}>
                {user.role === 'STUDENT' ? (
                  <>
                    <button className="btn-big-friendly" onClick={() => setShowQuiz(true)}>
                      <Compass size={20} />
                      <span>Descubrir qué Aprender (Test Gratuito)</span>
                    </button>
                    {courses.length > 0 && (
                      <button
                        className="btn-secondary"
                        onClick={() => {
                          window.location.hash = `#/courses/${courses[0].id}`;
                        }}
                      >
                        <BookOpen size={18} />
                        <span>Explorar Primer Curso</span>
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    className="btn-big-friendly"
                    onClick={() => {
                      window.location.hash = '#/teacher/courses';
                    }}
                  >
                    <FolderPlus size={20} />
                    <span>Gestionar Cursos</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sección del Catálogo de Cursos */}
          <div style={styles.coursesSection}>
            <div style={styles.sectionHeader}>
              <div>
                <h3 style={styles.sectionTitle}>
                  {user.role === 'STUDENT' ? 'Catálogo de Cursos Didácticos' : 'Cursos Publicados en la Plataforma'}
                </h3>
                <span style={styles.sectionSubtitle}>
                  Selecciona un curso para explorar su temario completo y comenzar tus lecciones
                </span>
              </div>
            </div>

            <div style={styles.courseGrid}>
              {courses.map((course) => (
                <div key={course.id} className="skylearn-card" style={styles.courseCard}>
                  <div style={styles.cardTopRow}>
                    <div style={styles.courseTag}>{course.category || 'General'}</div>
                    {course.isEnrolled && (
                      <span style={styles.enrolledTag}>
                        <CheckCircle2 size={13} /> Inscrito
                      </span>
                    )}
                  </div>

                  <h4 style={styles.courseTitle}>{course.title}</h4>
                  <p style={styles.courseDesc}>{course.description}</p>

                  <div style={styles.courseFooter}>
                    <div style={styles.lessonCount}>
                      <BookOpen size={16} color="var(--color-ink-muted)" />
                      <span>{course.modulesCount || 1} Módulo(s)</span>
                    </div>

                    <button
                      className="btn-primary"
                      onClick={() => {
                        window.location.hash = `#/courses/${course.id}`;
                      }}
                      style={{ padding: '8px 16px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <span>Ver Temario</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modal de Cuestionario de Recomendación */}
          {showQuiz && (
            <RecommendationQuiz
              onClose={() => setShowQuiz(false)}
              onNavigateToLesson={() => {
                setShowQuiz(false);
                if (courses.length > 0) {
                  window.location.hash = `#/courses/${courses[0].id}`;
                }
              }}
            />
          )}

          {/* Modal de Paywall Skylearn */}
          {showPaywall && (
            <PaywallModal
              onClose={() => setShowPaywall(false)}
              onSuccess={() => {
                setShowPaywall(false);
                if (user) {
                  setUser({ ...user, credits: 999, subscriptionStatus: 'ACTIVE' });
                }
              }}
            />
          )}
        </main>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  mainContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '36px 24px',
    width: '100%',
    flex: 1,
  },
  welcomeBanner: {
    padding: '36px',
    marginBottom: '40px',
    backgroundColor: '#FFFFFF',
    border: '2px solid var(--color-sky-light, #E2F0FE)',
  },
  bannerContent: {
    maxWidth: '800px',
  },
  badgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  planBadge: {
    fontSize: '12px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--color-ink-muted)',
    backgroundColor: '#F3F4F6',
    padding: '4px 10px',
    borderRadius: '12px',
  },
  welcomeTitle: {
    fontSize: '32px',
    fontWeight: 800,
    color: 'var(--color-ink)',
    margin: '0 0 12px 0',
  },
  welcomeDesc: {
    fontSize: '16px',
    color: 'var(--color-ink-muted)',
    lineHeight: 1.6,
    margin: '0 0 24px 0',
  },
  bannerActions: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '14px',
  },
  coursesSection: {
    marginTop: '16px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: 800,
    color: 'var(--color-ink)',
    margin: '0 0 4px 0',
  },
  sectionSubtitle: {
    fontSize: '14px',
    color: 'var(--color-ink-muted)',
  },
  courseGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '24px',
  },
  courseCard: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  cardTopRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '14px',
  },
  courseTag: {
    fontSize: '12px',
    fontWeight: 700,
    textTransform: 'uppercase',
    color: 'var(--color-sky-deep, #0A58CA)',
    backgroundColor: 'var(--color-sky-soft, #D0E4FE)',
    padding: '4px 10px',
    borderRadius: '12px',
  },
  enrolledTag: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    fontWeight: 700,
    color: '#03543F',
    backgroundColor: '#DEF7EC',
    padding: '3px 8px',
    borderRadius: '8px',
  },
  courseTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: 'var(--color-ink)',
    margin: '0 0 10px 0',
    lineHeight: 1.3,
  },
  courseDesc: {
    fontSize: '14px',
    color: 'var(--color-ink-muted)',
    lineHeight: 1.5,
    margin: '0 0 20px 0',
    flex: 1,
  },
  courseFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '16px',
    borderTop: '1px solid #F3F4F6',
  },
  lessonCount: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: 'var(--color-ink-muted)',
    fontWeight: 600,
  },
};

export default App;

