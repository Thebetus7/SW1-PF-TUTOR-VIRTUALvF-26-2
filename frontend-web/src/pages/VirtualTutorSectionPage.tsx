// frontend-web/src/pages/VirtualTutorSectionPage.tsx
import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, BookOpen, MessageSquare, Award, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { TutorVirtual3D } from '../components/TutorVirtual3D';
import { VirtualTutorEvaluatorModal } from '../components/VirtualTutorEvaluatorModal';

interface VirtualTutorSectionPageProps {
  user: any;
  onNavigateToCourse?: (courseId: string) => void;
}

export const VirtualTutorSectionPage: React.FC<VirtualTutorSectionPageProps> = ({
  user,
  onNavigateToCourse: _onNavigateToCourse,
}) => {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [selectedModuleTitle, setSelectedModuleTitle] = useState<string>('');
  const [showEvaluatorModal, setShowEvaluatorModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'evaluation'>('chat');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/courses');
      setCourses(res.data);
      if (res.data.length > 0) {
        setSelectedCourseId(res.data[0].id);
        loadCourseModules(res.data[0].id);
      }
    } catch {
      // Fallback
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCourseModules = async (courseId: string) => {
    try {
      const res = await api.get(`/courses/${courseId}`);
      if (res.data?.modules && res.data.modules.length > 0) {
        setSelectedModuleId(res.data.modules[0].id);
        setSelectedModuleTitle(res.data.modules[0].title);
      } else {
        setSelectedModuleId(null);
        setSelectedModuleTitle('');
      }
    } catch (err) {
      console.error('Error cargando módulos:', err);
    }
  };

  const handleSelectCourse = (courseId: string) => {
    setSelectedCourseId(courseId);
    loadCourseModules(courseId);
  };

  return (
    <div style={styles.container}>
      {/* Banner Principal del Docente Virtual */}
      <div className="skylearn-card" style={styles.heroCard}>
        <div style={styles.heroContent}>
          <div style={styles.badgeRow}>
            <div style={styles.botBadge}>
              <Bot size={18} color="var(--color-sky)" />
              <span>Docente Virtual Inteligente 3D</span>
            </div>
            <span style={styles.aiTag}>
              <Sparkles size={13} />
              <span>Multimodal • Visemas y Voz Humana</span>
            </span>
          </div>

          <h1 style={styles.heroTitle}>Centro de Tutoría y Evaluación Personalizada</h1>
          <p style={styles.heroSubtitle}>
            Aquí tienes a tu disposición a tu profesor virtual con animación 3D, síntesis de voz sincronizada y análisis pedagógico con IA para responder tus dudas y evaluar tus aprendizajes en cualquier módulo.
          </p>

          {/* Selector de Modo */}
          <div style={styles.tabButtonsRow}>
            <button
              onClick={() => setActiveTab('chat')}
              style={{
                ...styles.tabBtn,
                backgroundColor: activeTab === 'chat' ? 'var(--color-sky)' : 'var(--color-surface)',
                color: activeTab === 'chat' ? '#FFFFFF' : 'var(--color-ink)',
                borderColor: activeTab === 'chat' ? 'var(--color-sky)' : 'var(--color-outline)',
              }}
            >
              <MessageSquare size={16} />
              <span>Consulta Didáctica Libre</span>
            </button>

            <button
              onClick={() => setActiveTab('evaluation')}
              style={{
                ...styles.tabBtn,
                backgroundColor: activeTab === 'evaluation' ? 'var(--color-sky)' : 'var(--color-surface)',
                color: activeTab === 'evaluation' ? '#FFFFFF' : 'var(--color-ink)',
                borderColor: activeTab === 'evaluation' ? 'var(--color-sky)' : 'var(--color-outline)',
              }}
            >
              <Award size={16} />
              <span>Evaluación Oral por Módulo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Contenido según la pestaña seleccionada */}
      {activeTab === 'chat' ? (
        <div style={styles.chatSection}>
          <TutorVirtual3D
            lessonId={selectedModuleId || 'general-tutoring'}
            lessonTitle={selectedModuleTitle || 'Tutoría General de Aprendizaje'}
            onNavigate={() => {}}
          />
        </div>
      ) : (
        /* Sección de Evaluación Oral con Docente 3D */
        <div style={styles.evalSection}>
          <div className="skylearn-card" style={styles.evalCard}>
            <h2 style={styles.sectionTitle}>Selecciona el Módulo que Deseas Evaluar</h2>
            <p style={styles.sectionDesc}>
              El docente virtual te planteará preguntas conceptuales y de aplicación con reconocimiento de voz y análisis didáctico.
            </p>

            {loading ? (
              <p style={{ color: 'var(--color-ink-muted)' }}>Cargando catálogo curricular...</p>
            ) : courses.length === 0 ? (
              <div style={styles.emptyCard}>
                <BookOpen size={36} color="var(--color-ink-muted)" />
                <p>No hay cursos con módulos disponibles para evaluación en este momento.</p>
              </div>
            ) : (
              <div style={styles.selectionGrid}>
                {courses.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCourse(c.id)}
                    style={{
                      ...styles.courseSelectionItem,
                      borderColor: selectedCourseId === c.id ? 'var(--color-sky)' : 'var(--color-outline)',
                      backgroundColor: selectedCourseId === c.id ? 'var(--color-sky-soft)' : 'var(--color-surface)',
                    }}
                  >
                    <h3 style={styles.courseItemTitle}>{c.title}</h3>
                    <p style={styles.courseItemDesc}>{c.description}</p>
                    <span style={styles.moduleCount}>
                      {c.modulesCount || 1} Módulo(s) didáctico(s)
                    </span>
                  </div>
                ))}
              </div>
            )}

            {selectedModuleId && (
              <div style={styles.evalStartRow}>
                <div>
                  <span style={styles.readyLabel}>Módulo Seleccionado:</span>
                  <div style={styles.readyTitle}>{selectedModuleTitle || 'Módulo Principal'}</div>
                </div>

                <button
                  onClick={() => setShowEvaluatorModal(true)}
                  className="btn-big-friendly"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <Bot size={18} />
                  <span>Comenzar Evaluación con el Docente 3D</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Evaluación Oral */}
      {showEvaluatorModal && selectedModuleId && (
        <VirtualTutorEvaluatorModal
          moduleId={selectedModuleId}
          moduleTitle={selectedModuleTitle || 'Módulo Didáctico'}
          isSimulation={user?.role === 'TEACHER'}
          onClose={() => setShowEvaluatorModal(false)}
        />
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px 16px',
    width: '100%',
    flex: 1,
  },
  heroCard: {
    padding: '24px',
    marginBottom: '24px',
    backgroundColor: 'var(--color-surface-elevated)',
  },
  heroContent: {
    maxWidth: '820px',
  },
  badgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '12px',
    flexWrap: 'wrap',
  },
  botBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: 'var(--radius-full)',
    backgroundColor: 'var(--color-sky-soft)',
    color: 'var(--color-sky-deep)',
    fontSize: '12px',
    fontWeight: 700,
  },
  aiTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '4px 10px',
    borderRadius: 'var(--radius-full)',
    backgroundColor: '#FEF3C7',
    color: '#D97706',
    fontSize: '12px',
    fontWeight: 700,
  },
  heroTitle: {
    fontSize: '24px',
    color: 'var(--color-ink)',
    margin: '0 0 8px 0',
  },
  heroSubtitle: {
    fontSize: '14px',
    color: 'var(--color-ink-muted)',
    lineHeight: 1.5,
    margin: '0 0 18px 0',
  },
  tabButtonsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  tabBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 18px',
    borderRadius: 'var(--radius-full)',
    border: '1px solid',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.18s ease',
  },
  chatSection: {
    marginTop: '12px',
  },
  evalSection: {
    marginTop: '12px',
  },
  evalCard: {
    padding: '24px',
    backgroundColor: 'var(--color-surface-elevated)',
  },
  sectionTitle: {
    fontSize: '18px',
    margin: '0 0 6px 0',
  },
  sectionDesc: {
    fontSize: '13px',
    color: 'var(--color-ink-muted)',
    margin: '0 0 18px 0',
  },
  selectionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '14px',
    marginBottom: '20px',
  },
  courseSelectionItem: {
    padding: '16px',
    borderRadius: 'var(--radius-md)',
    border: '1.5px solid',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  courseItemTitle: {
    fontSize: '15px',
    fontWeight: 700,
    margin: '0 0 4px 0',
    color: 'var(--color-ink)',
  },
  courseItemDesc: {
    fontSize: '12px',
    color: 'var(--color-ink-muted)',
    margin: '0 0 8px 0',
    lineHeight: 1.4,
  },
  moduleCount: {
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--color-sky-deep)',
  },
  emptyCard: {
    padding: '30px',
    textAlign: 'center',
    color: 'var(--color-ink-muted)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  evalStartRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-outline)',
    flexWrap: 'wrap',
    gap: '12px',
  },
  readyLabel: {
    fontSize: '11px',
    color: 'var(--color-ink-muted)',
    fontWeight: 600,
  },
  readyTitle: {
    fontSize: '16px',
    fontWeight: 800,
    color: 'var(--color-ink)',
  },
};
