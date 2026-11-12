// frontend-web/src/pages/AdminDashboardPage.tsx
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  ShieldCheck,
  Users,
  GraduationCap,
  Sparkles,
  Search,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Save,
  Plus,
  Minus,
} from 'lucide-react';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  credits: number;
  subscriptionStatus: string;
  createdAt: string;
}

interface AdminDashboardPageProps {
  onCreditsModified?: () => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onCreditsModified }) => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'STUDENT' | 'TEACHER' | 'ADMIN'>('ALL');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Estados locales de créditos en edición por usuario: { [userId]: number }
  const [creditDrafts, setCreditDrafts] = useState<Record<string, number>>({});
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [resettingDemo, setResettingDemo] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/users');
      setUsers(res.data);

      // Inicializar drafts con los valores actuales
      const initialDrafts: Record<string, number> = {};
      res.data.forEach((u: UserRecord) => {
        initialDrafts[u.id] = u.credits;
      });
      setCreditDrafts(initialDrafts);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al cargar los usuarios administrativos.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreditChange = (userId: string, value: number) => {
    const safeVal = Math.max(0, Math.floor(value || 0));
    setCreditDrafts((prev) => ({
      ...prev,
      [userId]: safeVal,
    }));
  };

  const handleQuickAdd = (userId: string, amount: number) => {
    const current = creditDrafts[userId] ?? 0;
    handleCreditChange(userId, current + amount);
  };

  const handleSaveCredits = async (userId: string, userEmail: string) => {
    const newBalance = creditDrafts[userId];
    if (newBalance === undefined || newBalance < 0) return;

    try {
      setSavingUserId(userId);
      setFeedback(null);
      await api.patch(`/admin/users/${userId}/credits`, { balance: newBalance });

      // Actualizar estado en la lista local
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, credits: newBalance } : u))
      );

      setFeedback({
        type: 'success',
        message: `¡Créditos de ${userEmail} actualizados a ${newBalance} correctamente!`,
      });

      if (onCreditsModified) {
        onCreditsModified();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al guardar los créditos.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setSavingUserId(null);
    }
  };

  const handleResetDemoData = async () => {
    if (!window.confirm('¿Seguro que deseas restablecer todos los usuarios demo oficiales a 3 créditos?')) {
      return;
    }

    try {
      setResettingDemo(true);
      setFeedback(null);
      await api.post('/admin/reset-demo-data');
      await fetchUsers();
      setFeedback({
        type: 'success',
        message: '¡Datos demo y balance inicial de 3 créditos restablecidos exitosamente!',
      });
      if (onCreditsModified) {
        onCreditsModified();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al restablecer datos demo.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setResettingDemo(false);
    }
  };

  // Filtrado de usuarios
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const studentsCount = users.filter((u) => u.role === 'STUDENT').length;
  const teachersCount = users.filter((u) => u.role === 'TEACHER').length;

  return (
    <div style={styles.container}>
      {/* Encabezado */}
      <div style={styles.header}>
        <div style={styles.headerTitleRow}>
          <div style={styles.iconBadge}>
            <ShieldCheck size={28} color="#FFFFFF" />
          </div>
          <div>
            <h1 style={styles.title}>Panel de Administración & Control de Créditos</h1>
            <p style={styles.subtitle}>
              Monitorea los usuarios de la plataforma y ajusta los créditos en caliente para pruebas de desarrollo y evaluación de software.
            </p>
          </div>
        </div>

        <button
          onClick={handleResetDemoData}
          disabled={resettingDemo}
          style={styles.resetBtn}
          title="Restablecer cuentas oficiales student@test.com y teacher@test.com a 3 créditos"
        >
          <RotateCcw size={18} className={resettingDemo ? 'spin' : ''} />
          <span>{resettingDemo ? 'Restableciendo...' : 'Restablecer Datos Demo (3 Créditos)'}</span>
        </button>
      </div>

      {/* Mensajes de Feedback */}
      {feedback && (
        <div
          style={{
            ...styles.alert,
            backgroundColor: feedback.type === 'success' ? '#ECFDF5' : '#FEF2F2',
            borderColor: feedback.type === 'success' ? '#10B981' : '#EF4444',
            color: feedback.type === 'success' ? '#065F46' : '#991B1B',
          }}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 size={20} color="#10B981" />
          ) : (
            <AlertCircle size={20} color="#EF4444" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Métricas Rápidas */}
      <div style={styles.metricsGrid}>
        <div className="skylearn-card" style={styles.metricCard}>
          <div style={{ ...styles.metricIconWrap, backgroundColor: '#E0F2FE' }}>
            <Users size={22} color="#0284C7" />
          </div>
          <div>
            <span style={styles.metricLabel}>Total Usuarios</span>
            <h3 style={styles.metricValue}>{users.length}</h3>
          </div>
        </div>

        <div className="skylearn-card" style={styles.metricCard}>
          <div style={{ ...styles.metricIconWrap, backgroundColor: '#DCFCE7' }}>
            <GraduationCap size={22} color="#16A34A" />
          </div>
          <div>
            <span style={styles.metricLabel}>Estudiantes</span>
            <h3 style={styles.metricValue}>{studentsCount}</h3>
          </div>
        </div>

        <div className="skylearn-card" style={styles.metricCard}>
          <div style={{ ...styles.metricIconWrap, backgroundColor: '#FEF3C7' }}>
            <Sparkles size={22} color="#D97706" />
          </div>
          <div>
            <span style={styles.metricLabel}>Docentes & Admins</span>
            <h3 style={styles.metricValue}>{teachersCount + (users.length - studentsCount - teachersCount)}</h3>
          </div>
        </div>
      </div>

      {/* Controles de Búsqueda y Filtro */}
      <div className="skylearn-card" style={styles.filterSection}>
        <div style={styles.searchBox}>
          <Search size={18} color="var(--color-ink-muted)" />
          <input
            type="text"
            placeholder="Buscar por nombre o correo (ej. student@test.com)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.filterButtons}>
          {(['ALL', 'STUDENT', 'TEACHER', 'ADMIN'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              style={{
                ...styles.filterBtn,
                backgroundColor: roleFilter === r ? 'var(--color-sky)' : '#F1F5F9',
                color: roleFilter === r ? '#FFFFFF' : 'var(--color-ink)',
                fontWeight: roleFilter === r ? 700 : 500,
              }}
            >
              {r === 'ALL' ? 'Todos' : r === 'STUDENT' ? 'Estudiantes' : r === 'TEACHER' ? 'Docentes' : 'Admins'}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Usuarios */}
      {loading ? (
        <div style={styles.loadingBox}>
          <div className="spin" style={{ fontSize: '32px' }}>⚙️</div>
          <p style={{ marginTop: '12px', color: 'var(--color-ink-muted)' }}>Cargando usuarios y cuentas de crédito...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="skylearn-card" style={styles.emptyCard}>
          <Users size={48} color="var(--color-ink-muted)" />
          <h3 style={{ marginTop: '12px' }}>No se encontraron usuarios</h3>
          <p style={{ color: 'var(--color-ink-muted)', marginTop: '4px' }}>
            Prueba ajustando el término de búsqueda o el filtro de rol.
          </p>
        </div>
      ) : (
        <div style={styles.usersList}>
          {filteredUsers.map((u) => {
            const currentDraft = creditDrafts[u.id] ?? u.credits;
            const hasChanges = currentDraft !== u.credits;
            const isSaving = savingUserId === u.id;

            return (
              <div key={u.id} className="skylearn-card" style={styles.userCard}>
                {/* Info Izquierda */}
                <div style={styles.userInfoCol}>
                  <div style={styles.userMainRow}>
                    <div style={styles.avatar}>
                      {u.name ? u.name.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={styles.nameRow}>
                        <h4 style={styles.userName}>{u.name}</h4>
                        <span
                          style={{
                            ...styles.roleBadge,
                            backgroundColor:
                              u.role === 'ADMIN'
                                ? '#FFEDD5'
                                : u.role === 'TEACHER'
                                ? '#E0F2FE'
                                : '#DCFCE7',
                            color:
                              u.role === 'ADMIN'
                                ? '#C2410C'
                                : u.role === 'TEACHER'
                                ? '#0369A1'
                                : '#15803D',
                          }}
                        >
                          {u.role === 'ADMIN' ? '🛡️ Admin' : u.role === 'TEACHER' ? '📚 Docente' : '🎒 Estudiante'}
                        </span>
                      </div>
                      <span style={styles.userEmail}>{u.email}</span>
                    </div>
                  </div>
                </div>

                {/* Control Central: Balance de Créditos */}
                <div style={styles.creditControlCol}>
                  <div style={styles.balanceStatus}>
                    <span style={styles.balanceLabel}>Créditos en Sistema:</span>
                    <span style={styles.balanceBadge}>
                      ⭐ {u.credits}
                    </span>
                  </div>

                  {/* Panel de Ajuste Rápido */}
                  <div style={styles.editorRow}>
                    <button
                      type="button"
                      onClick={() => handleQuickAdd(u.id, -1)}
                      disabled={currentDraft <= 0}
                      style={styles.stepBtn}
                      title="Restar 1 crédito"
                    >
                      <Minus size={14} />
                    </button>

                    <input
                      type="number"
                      min="0"
                      value={currentDraft}
                      onChange={(e) => handleCreditChange(u.id, parseInt(e.target.value, 10))}
                      style={styles.creditInput}
                    />

                    <button
                      type="button"
                      onClick={() => handleQuickAdd(u.id, 1)}
                      style={styles.stepBtn}
                      title="Sumar 1 crédito"
                    >
                      <Plus size={14} />
                    </button>

                    {/* Botones de Presets Rápidos */}
                    <div style={styles.presetButtons}>
                      <button
                        type="button"
                        onClick={() => handleCreditChange(u.id, 3)}
                        style={styles.presetBtn}
                        title="Fijar en los 3 créditos estándar"
                      >
                        =3
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickAdd(u.id, 5)}
                        style={styles.presetBtn}
                        title="Añadir 5 créditos"
                      >
                        +5
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickAdd(u.id, 10)}
                        style={styles.presetBtn}
                        title="Añadir 10 créditos"
                      >
                        +10
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCreditChange(u.id, 50)}
                        style={styles.presetBtn}
                        title="Fijar en 50 para pruebas extensas"
                      >
                        =50
                      </button>
                    </div>

                    {/* Botón Guardar Cambios */}
                    <button
                      type="button"
                      onClick={() => handleSaveCredits(u.id, u.email)}
                      disabled={!hasChanges || isSaving}
                      style={{
                        ...styles.saveBtn,
                        opacity: hasChanges && !isSaving ? 1 : 0.4,
                        cursor: hasChanges && !isSaving ? 'pointer' : 'not-allowed',
                      }}
                    >
                      <Save size={16} />
                      <span>{isSaving ? 'Guardando...' : 'Aplicar'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '32px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
    paddingBottom: '20px',
    borderBottom: '1px solid var(--color-border)',
  },
  headerTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  iconBadge: {
    width: '54px',
    height: '54px',
    borderRadius: '16px',
    backgroundColor: '#EA580C',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(234, 88, 12, 0.25)',
  },
  title: {
    fontSize: '24px',
    fontWeight: 800,
    color: 'var(--color-ink)',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--color-ink-muted)',
    marginTop: '4px',
  },
  resetBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    color: 'var(--color-ink)',
    padding: '10px 18px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  alert: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 18px',
    borderRadius: '12px',
    border: '1px solid',
    fontSize: '14px',
    fontWeight: 500,
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
  },
  metricCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px',
  },
  metricIconWrap: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: {
    fontSize: '13px',
    color: 'var(--color-ink-muted)',
    fontWeight: 600,
  },
  metricValue: {
    fontSize: '24px',
    fontWeight: 800,
    color: 'var(--color-ink)',
    marginTop: '2px',
  },
  filterSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
    padding: '16px 20px',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#F8FAFC',
    border: '1px solid var(--color-border)',
    borderRadius: '10px',
    padding: '8px 14px',
    flex: '1',
    minWidth: '260px',
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    fontSize: '14px',
    color: 'var(--color-ink)',
    width: '100%',
  },
  filterButtons: {
    display: 'flex',
    gap: '8px',
  },
  filterBtn: {
    border: 'none',
    padding: '8px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  loadingBox: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  emptyCard: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  usersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  userCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '18px',
    padding: '18px 24px',
  },
  userInfoCol: {
    flex: '1',
    minWidth: '260px',
  },
  userMainRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  avatar: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-sky-soft)',
    color: 'var(--color-sky-deep)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: '18px',
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  userName: {
    fontSize: '16px',
    fontWeight: 700,
    color: 'var(--color-ink)',
    margin: 0,
  },
  roleBadge: {
    fontSize: '11px',
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: '6px',
    textTransform: 'uppercase',
  },
  userEmail: {
    fontSize: '13px',
    color: 'var(--color-ink-muted)',
    marginTop: '2px',
    display: 'block',
  },
  creditControlCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '8px',
  },
  balanceStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  balanceLabel: {
    fontSize: '13px',
    color: 'var(--color-ink-muted)',
    fontWeight: 500,
  },
  balanceBadge: {
    backgroundColor: '#FEF3C7',
    color: '#B45309',
    fontSize: '14px',
    fontWeight: 800,
    padding: '3px 10px',
    borderRadius: '8px',
  },
  editorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  stepBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: '1px solid var(--color-border)',
    backgroundColor: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'var(--color-ink)',
  },
  creditInput: {
    width: '64px',
    height: '32px',
    textAlign: 'center',
    fontSize: '15px',
    fontWeight: 700,
    color: 'var(--color-ink)',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    outline: 'none',
  },
  presetButtons: {
    display: 'flex',
    gap: '4px',
  },
  presetBtn: {
    padding: '4px 8px',
    borderRadius: '6px',
    border: '1px solid #E2E8F0',
    backgroundColor: '#F8FAFC',
    fontSize: '12px',
    fontWeight: 700,
    color: 'var(--color-sky-deep)',
    cursor: 'pointer',
  },
  saveBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'var(--color-leaf, #10B981)',
    color: '#FFFFFF',
    border: 'none',
    padding: '6px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 700,
    transition: 'all 0.2s',
  },
};

