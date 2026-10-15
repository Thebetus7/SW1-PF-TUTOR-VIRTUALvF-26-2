// frontend-web/src/pages/AuthPage.tsx
import React, { useState } from 'react';
import { api } from '../services/api';
import { User, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';

interface AuthPageProps {
  onAuthSuccess: (userData: any) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (isLogin) {
        const res = await api.post('/auth/login', { email, password });
        localStorage.setItem('access_token', res.data.accessToken);
        localStorage.setItem('user_data', JSON.stringify(res.data.user));
        onAuthSuccess(res.data.user);
      } else {
        const res = await api.post('/auth/register', { email, password, name, role });
        localStorage.setItem('access_token', res.data.accessToken);
        localStorage.setItem('user_data', JSON.stringify(res.data.user));
        onAuthSuccess(res.data.user);
      }
    } catch (err: any) {
      const detail =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Ocurrió un error al procesar tu solicitud. Intenta de nuevo.';
      setErrorMsg(detail);
    } finally {
      setLoading(false);
    }
  };

  // Botón de ayuda para pruebas rápidas
  const handleDemoFill = (demoRole: 'student' | 'teacher') => {
    if (demoRole === 'student') {
      setEmail('student@test.com');
      setPassword('Password123!');
      setIsLogin(true);
    } else {
      setEmail('teacher@test.com');
      setPassword('Password123!');
      setIsLogin(true);
    }
  };

  return (
    <div style={styles.pageContainer}>
      <div className="skylearn-card" style={styles.authCard}>
        {/* Toggle Pestañas */}
        <div style={styles.tabToggle}>
          <button
            type="button"
            onClick={() => { setIsLogin(true); setErrorMsg(null); }}
            style={{
              ...styles.tabButton,
              backgroundColor: isLogin ? 'var(--color-sky)' : 'transparent',
              color: isLogin ? '#FFFFFF' : 'var(--color-ink-muted)',
            }}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setErrorMsg(null); }}
            style={{
              ...styles.tabButton,
              backgroundColor: !isLogin ? 'var(--color-sky)' : 'transparent',
              color: !isLogin ? '#FFFFFF' : 'var(--color-ink-muted)',
            }}
          >
            Crear Cuenta
          </button>
        </div>

        {/* Mensaje de bienvenida */}
        <div style={styles.cardHeader}>
          <h2 style={styles.headerTitle}>
            {isLogin ? '¡Hola de nuevo!' : 'Únete a Skylearn'}
          </h2>
          <p style={styles.headerSubtitle}>
            {isLogin
              ? 'Ingresa tus credenciales para continuar tu aventura de aprendizaje'
              : 'Crea tu cuenta gratuita y recibe 3 créditos para desbloquear lecciones'}
          </p>
        </div>

        {/* Alerta de Error */}
        {errorMsg && (
          <div style={styles.errorAlert}>
            <AlertCircle size={20} color="var(--color-coral)" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {!isLogin && (
            <>
              {/* Campo Nombre */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Tu Nombre Completo</label>
                <div style={styles.inputWrapper}>
                  <User size={18} color="var(--color-ink-subtle)" />
                  <input
                    type="text"
                    required
                    placeholder="Ej. Lucas Morales"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={styles.input}
                  />
                </div>
              </div>

              {/* Selector de Rol */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>¿Cómo usarás Skylearn?</label>
                <div style={styles.roleSelector}>
                  <div
                    onClick={() => setRole('STUDENT')}
                    style={{
                      ...styles.roleOption,
                      borderColor: role === 'STUDENT' ? 'var(--color-sky)' : 'var(--color-outline)',
                      backgroundColor: role === 'STUDENT' ? 'var(--color-sky-soft)' : 'var(--color-surface)',
                    }}
                  >
                    <div style={styles.roleHeader}>
                      <span style={styles.roleIcon}>🎒</span>
                      <span style={styles.roleName}>Estudiante</span>
                    </div>
                    <span style={styles.roleDesc}>🎁 Incluye 3 créditos gratis para tus lecciones</span>
                  </div>

                  <div
                    onClick={() => setRole('TEACHER')}
                    style={{
                      ...styles.roleOption,
                      borderColor: role === 'TEACHER' ? 'var(--color-sky)' : 'var(--color-outline)',
                      backgroundColor: role === 'TEACHER' ? 'var(--color-sky-soft)' : 'var(--color-surface)',
                    }}
                  >
                    <div style={styles.roleHeader}>
                      <span style={styles.roleIcon}>📚</span>
                      <span style={styles.roleName}>Docente Creador</span>
                    </div>
                    <span style={styles.roleDesc}>Crea contenidos y supervisa métricas de aprendizaje</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Campo Correo */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Correo Electrónico</label>
            <div style={styles.inputWrapper}>
              <Mail size={18} color="var(--color-ink-subtle)" />
              <input
                type="email"
                required
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
              />
            </div>
          </div>

          {/* Campo Contraseña */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Contraseña</label>
            <div style={styles.inputWrapper}>
              <Lock size={18} color="var(--color-ink-subtle)" />
              <input
                type="password"
                required
                placeholder="Mínimo 8 caracteres (mayúscula y número)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
              />
            </div>
          </div>

          {/* Botón de Envío */}
          <button
            type="submit"
            disabled={loading}
            className="btn-big-friendly"
            style={{ width: '100%', marginTop: '8px' }}
          >
            {loading ? 'Procesando...' : isLogin ? 'Ingresar a mi Cuenta' : 'Crear mi Cuenta Gratis'}
            {!loading && <ArrowRight size={20} />}
          </button>
        </form>

        {/* Acceso Rápido con Cuentas Demo Oficiales */}
        <div style={styles.demoSection}>
          <span style={styles.demoLabel}>Acceso rápido con usuarios de prueba oficiales:</span>
          <div style={styles.demoButtons}>
            <button
              type="button"
              onClick={() => handleDemoFill('student')}
              style={styles.demoBtn}
            >
              🎒 Estudiante Demo (3 Créditos)
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill('teacher')}
              style={styles.demoBtn}
            >
              📚 Docente Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  pageContainer: {
    minHeight: 'calc(100vh - 80px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    backgroundColor: 'var(--color-surface)',
  },
  authCard: {
    width: '100%',
    maxWidth: '520px',
    padding: '36px',
    backgroundColor: 'var(--color-surface-elevated)',
  },
  tabToggle: {
    display: 'flex',
    backgroundColor: 'var(--color-surface-sunken)',
    borderRadius: 'var(--radius-full)',
    padding: '4px',
    marginBottom: '28px',
  },
  tabButton: {
    flex: 1,
    padding: '10px 18px',
    borderRadius: 'var(--radius-full)',
    fontSize: '15px',
    fontWeight: 700,
    transition: 'all 0.2s ease',
  },
  cardHeader: {
    marginBottom: '24px',
    textAlign: 'center',
  },
  headerTitle: {
    fontSize: '28px',
    color: 'var(--color-ink)',
    marginBottom: '6px',
  },
  headerSubtitle: {
    fontSize: '15px',
    color: 'var(--color-ink-muted)',
    lineHeight: 1.5,
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    backgroundColor: 'var(--color-coral-soft)',
    color: 'var(--color-ink)',
    borderRadius: 'var(--radius-md)',
    marginBottom: '20px',
    fontSize: '14px',
    fontWeight: 600,
    border: '1px solid var(--color-coral)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 700,
    color: 'var(--color-ink)',
  },
  inputWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: 'var(--radius-md)',
    border: '1.5px solid var(--color-outline)',
    backgroundColor: 'var(--color-surface)',
    transition: 'border-color 0.2s',
  },
  input: {
    flex: 1,
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    fontSize: '16px',
    color: 'var(--color-ink)',
  },
  roleSelector: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  roleOption: {
    padding: '14px',
    borderRadius: 'var(--radius-md)',
    border: '2px solid var(--color-outline)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  roleHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px',
  },
  roleIcon: {
    fontSize: '20px',
  },
  roleName: {
    fontWeight: 800,
    fontSize: '15px',
    color: 'var(--color-ink)',
  },
  roleDesc: {
    fontSize: '12px',
    color: 'var(--color-ink-muted)',
    lineHeight: 1.3,
    display: 'block',
  },
  demoSection: {
    marginTop: '28px',
    paddingTop: '20px',
    borderTop: '1px solid var(--color-outline)',
    textAlign: 'center',
  },
  demoLabel: {
    fontSize: '13px',
    fontWeight: 700,
    color: 'var(--color-ink-subtle)',
    display: 'block',
    marginBottom: '10px',
  },
  demoButtons: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
  },
  demoBtn: {
    padding: '8px 14px',
    borderRadius: 'var(--radius-full)',
    backgroundColor: 'var(--color-surface-sunken)',
    color: 'var(--color-ink)',
    fontSize: '13px',
    fontWeight: 700,
    border: '1px solid var(--color-outline)',
    transition: 'all 0.2s',
  },
};
