// frontend-web/src/App.tsx
import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AuthPage } from './pages/AuthPage';
import { LessonViewer } from './components/LessonViewer';
import { RecommendationQuiz } from './components/RecommendationQuiz';
import { PaywallModal } from './components/PaywallModal';
import { CourseDetailPage } from './pages/CourseDetailPage';
import { TeacherCourseManager } from './pages/TeacherCourseManager';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { VirtualTutorSectionPage } from './pages/VirtualTutorSectionPage';
import { api } from './services/api';
import { Compass, BookOpen, ArrowRight, FolderPlus, CheckCircle2, Bot } from 'lucide-react';

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
  const [accessError, setAccessError] = useState('');
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
    if (!user || user.role !== 'STUDENT') return;
    const refresh = () => {
      api.get<UserData>('/auth/me').then(({ data }) => {
        setUser(data);
        localStorage.setItem('user_data', JSON.stringify(data));
      }).catch(() => {});
    };
    refresh();
    const timer = window.setInterval(refresh, 15000);
    window.addEventListener('focus', refresh);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, [user?.id, user?.role]);

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

  const handleAuthSuccess = (userData: UserData) => {
    setUser(userData);
    if (userData.role === 'ADMIN') {
      window.location.hash = '#/admin';
    } else if (userData.role === 'TEACHER') {
      window.location.hash = '#/courses';
    } else {
      window.location.hash = '#/courses';
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
      setAccessError('');
      try {
        const { data } = await api.post<{ remainingCredits: number }>(`/lessons/${lessonId}/access`);
        const updatedUser = { ...user, credits: data.remainingCredits };
        setUser(updatedUser);
        localStorage.setItem('user_data', JSON.stringify(updatedUser));
      } catch (err: any) {
        if (err.response?.status === 402) setShowPaywall(true);
        else setAccessError('No se pudo abrir la lección. Revisa la conexión e inténtalo nuevamente.');
        return;
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
      {accessError && <div role="alert" style={{ padding: 12, color: '#991b1b' }}>{accessError}</div>}

      {!user ? (
        <AuthPage onAuthSuccess={handleAuthSuccess} />
      ) : (mainSegment === 'admin' || (user.role === 'ADMIN' && mainSegment !== 'courses' && mainSegment !== 'lessons' && mainSegment !== 'tutor')) ? (
        /* VISTA: PANEL DE ADMINISTRACIÓN Y CONTROL DE CRÉDITOS */
        <AdminDashboardPage
          onCreditsModified={() => {
            const savedUser = localStorage.getItem('user_data');
            if (savedUser) {
              try {
                const parsed = JSON.parse(savedUser);
                api.get('/admin/users').then((res) => {
                  const current = res.data.find((u: any) => u.id === parsed.id);
                  if (current) {
                    const updated = { ...parsed, credits: current.credits };
                    setUser(updated);
                    localStorage.setItem('user_data', JSON.stringify(updated));
                  }
                }).catch(() => {});
              } catch {}
            }
          }}
        />
      ) : mainSegment === 'tutor' ? (
        /* VISTA DEDICADA: DOCENTE VIRTUAL INTERACTIVO 3D */
        <VirtualTutorSectionPage
          user={user}
          onNavigateToCourse={(courseId) => {
            window.location.hash = `#/courses/${courseId}`;
          }}
        />
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
                  <span className="star-badge">⭐ {user.credits} Créditos</span>
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
                  ? 'Explora el catálogo de cursos, inscríbete para ver el temario completo o consulta a nuestro Docente Virtual 3D.'
                  : 'Consulta el catálogo general o ve al panel docente para gestionar cursos y lecciones.'}
              </p>

              <div style={styles.bannerActions}>
                {user.role === 'STUDENT' ? (
                  <>
                    <button className="btn-big-friendly" onClick={() => setShowQuiz(true)}>
                      <Compass size={17} />
                      <span>Test de Recomendación</span>
                    </button>
                    <a
                      href="#/tutor"
                      className="btn-secondary"
                      style={{ textDecoration: 'none' }}
                    >
                      <Bot size={16} color="var(--color-sky)" />
                      <span>Ir al Docente Virtual</span>
                    </a>
                  </>
                ) : (
                  <button
                    className="btn-big-friendly"
                    onClick={() => {
                      window.location.hash = '#/teacher/courses';
                    }}
                  >
                    <FolderPlus size={17} />
                    <span>Ir a gestión docente</span>
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
                  {user.role === 'STUDENT' ? 'Cursos disponibles' : 'Catálogo general de cursos'}
                </h3>
                <span style={styles.sectionSubtitle}>
                  {user.role === 'STUDENT'
                    ? 'Explora los cursos del sistema y selecciona uno para consultar su temario.'
                    : 'Consulta los cursos del sistema. Para crear o editar contenido, entra en Gestión docente.'}
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
                        <CheckCircle2 size={12} /> Inscrito
                      </span>
                    )}
                  </div>

                  <h4 style={styles.courseTitle}>{course.title}</h4>
                  <p style={styles.courseDesc}>{course.description}</p>
                  {course.teacherName && <p style={styles.sectionSubtitle}>Docente: {course.teacherName}</p>}

                  <div style={styles.courseFooter}>
                    <div style={styles.lessonCount}>
                      <BookOpen size={14} color="var(--color-ink-muted)" />
                      <span>{course.modulesCount || 1} Módulo(s)</span>
                    </div>

                    <button
                      className="btn-primary"
                      onClick={() => {
                        window.location.hash = `#/courses/${course.id}`;
                      }}
                      style={{ padding: '6px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <span>Ver Temario</span>
                      <ArrowRight size={14} />
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
    padding: '24px 16px',
    width: '100%',
    flex: 1,
  },
  welcomeBanner: {
    padding: '24px',
    marginBottom: '28px',
    backgroundColor: 'var(--color-surface-elevated)',
  },
  bannerContent: {
    maxWidth: '780px',
  },
  badgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '12px',
  },
  planBadge: {
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: 'var(--color-ink-muted)',
    backgroundColor: 'var(--color-surface)',
    padding: '3px 8px',
    borderRadius: '8px',
    border: '1px solid var(--color-outline)',
  },
  welcomeTitle: {
    fontSize: '24px',
    fontWeight: 800,
    color: 'var(--color-ink)',
    margin: '0 0 8px 0',
  },
  welcomeDesc: {
    fontSize: '14px',
    color: 'var(--color-ink-muted)',
    lineHeight: 1.5,
    margin: '0 0 18px 0',
  },
  bannerActions: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px',
  },
  coursesSection: {
    marginTop: '12px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '18px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: 800,
    color: 'var(--color-ink)',
    margin: '0 0 2px 0',
  },
  sectionSubtitle: {
    fontSize: '13px',
    color: 'var(--color-ink-muted)',
  },
  courseGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '18px',
  },
  courseCard: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    backgroundColor: 'var(--color-surface-elevated)',
    borderRadius: 'var(--radius-md)',
  },
  cardTopRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '10px',
  },
  courseTag: {
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    color: 'var(--color-sky-deep)',
    backgroundColor: 'var(--color-sky-soft)',
    padding: '3px 8px',
    borderRadius: '6px',
  },
  enrolledTag: {
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    fontSize: '11px',
    fontWeight: 700,
    color: '#03543F',
    backgroundColor: '#DEF7EC',
    padding: '2px 6px',
    borderRadius: '6px',
  },
  courseTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: 'var(--color-ink)',
    margin: '0 0 8px 0',
    lineHeight: 1.3,
  },
  courseDesc: {
    fontSize: '13px',
    color: 'var(--color-ink-muted)',
    lineHeight: 1.45,
    margin: '0 0 16px 0',
    flex: 1,
  },
  courseFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '12px',
    borderTop: '1px solid var(--color-outline)',
  },
  lessonCount: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '12px',
    color: 'var(--color-ink-muted)',
    fontWeight: 600,
  },
};

export default App;
