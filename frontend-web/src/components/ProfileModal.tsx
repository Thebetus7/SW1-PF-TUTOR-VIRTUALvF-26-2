// frontend-web/src/components/ProfileModal.tsx
import React, { useState } from 'react';
import {
  X,
  User,
  Mail,
  Shield,
  Coins,
  Moon,
  Sun,
  LogOut,
  Sparkles,
  Check,
  GraduationCap,
  BookOpen,
} from 'lucide-react';

interface ProfileModalProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    credits: number;
    subscriptionStatus?: string;
  };
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onLogout: () => void;
  onClose: () => void;
  onUpdateUser?: (updated: any) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  user,
  darkMode,
  onToggleDarkMode,
  onLogout,
  onClose,
}) => {
  const [copiedId, setCopiedId] = useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(user.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return {
          icon: <Shield size={14} color="#EA580C" />,
          label: 'Administrador del Sistema',
          bg: darkMode ? 'rgba(234, 88, 12, 0.2)' : '#FFEDD5',
          color: '#EA580C',
        };
      case 'TEACHER':
        return {
          icon: <BookOpen size={14} color="#0284C7" />,
          label: 'Docente Formador',
          bg: darkMode ? 'rgba(2, 132, 199, 0.2)' : '#E0F2FE',
          color: '#0284C7',
        };
      default:
        return {
          icon: <GraduationCap size={14} color="#16A34A" />,
          label: 'Estudiante',
          bg: darkMode ? 'rgba(22, 163, 74, 0.2)' : '#DCFCE7',
          color: '#16A34A',
        };
    }
  };

  const roleInfo = getRoleBadge(user.role);

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div
        className="skylearn-card"
        style={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-title"
      >
        {/* Cabecera del Modal */}
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={styles.avatarCircle}>
              <User size={22} color="#FFFFFF" />
            </div>
            <div>
              <h2 id="profile-title" style={styles.title}>Mi Perfil de Usuario</h2>
              <span style={styles.subtitle}>Gestión de cuenta y preferencias</span>
            </div>
          </div>
          <button onClick={onClose} style={styles.closeBtn} aria-label="Cerrar modal">
            <X size={18} />
          </button>
        </div>

        {/* Tarjeta de Información Principal */}
        <div style={styles.infoCard}>
          <div style={styles.userHeadRow}>
            <div>
              <h3 style={styles.userName}>{user.name}</h3>
              <div style={styles.emailRow}>
                <Mail size={13} color="var(--color-ink-muted)" />
                <span style={styles.userEmail}>{user.email}</span>
              </div>
            </div>

            <div
              style={{
                ...styles.rolePill,
                backgroundColor: roleInfo.bg,
                color: roleInfo.color,
              }}
            >
              {roleInfo.icon}
              <span>{roleInfo.label}</span>
            </div>
          </div>

          {/* ID de Usuario copiable */}
          <div style={styles.idRow}>
            <span style={styles.idLabel}>ID de Cuenta:</span>
            <code style={styles.idCode}>{user.id.slice(0, 16)}...</code>
            <button onClick={handleCopyId} style={styles.copyBtn} title="Copiar ID completo">
              {copiedId ? <Check size={13} color="var(--color-leaf)" /> : <span>Copiar</span>}
            </button>
          </div>
        </div>

        {/* Sección de Créditos y Estado para Estudiantes */}
        {user.role === 'STUDENT' && (
          <div style={styles.statsCard}>
            <div style={styles.statItem}>
              <div style={styles.statIconBox}>
                <Coins size={18} color="var(--color-sun-deep)" />
              </div>
              <div>
                <span style={styles.statLabel}>Créditos Disponibles</span>
                <div style={styles.statValue}>{user.credits} ⭐</div>
              </div>
            </div>

            <div style={styles.statItem}>
              <div style={styles.statIconBox}>
                <Sparkles size={18} color="var(--color-sky)" />
              </div>
              <div>
                <span style={styles.statLabel}>Plan Activo</span>
                <div style={styles.statValue}>
                  {user.subscriptionStatus === 'ACTIVE' ? 'Suscripción Premium' : 'Plan Freemium'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preferencias de la Interfaz: Modo Oscuro */}
        <div style={styles.preferencesSection}>
          <h4 style={styles.prefSectionTitle}>Apariencia y Sistema</h4>

          <div style={styles.prefRow}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {darkMode ? (
                <Moon size={18} color="var(--color-sky-bright)" />
              ) : (
                <Sun size={18} color="var(--color-sun-deep)" />
              )}
              <div>
                <span style={styles.prefLabel}>Modo Oscuro</span>
                <p style={styles.prefDesc}>
                  {darkMode
                    ? 'Paleta oscura activada, descanso visual para tus ojos'
                    : 'Paleta clara brillante Skylearn activa'}
                </p>
              </div>
            </div>

            <button
              onClick={onToggleDarkMode}
              style={{
                ...styles.toggleBtn,
                backgroundColor: darkMode ? 'var(--color-sky)' : 'var(--color-outline)',
              }}
              aria-label="Alternar modo oscuro"
            >
              <div
                style={{
                  ...styles.toggleCircle,
                  transform: darkMode ? 'translateX(20px)' : 'translateX(0)',
                }}
              />
            </button>
          </div>
        </div>

        {/* Pie del Modal con Acción de Cerrar Sesión */}
        <div style={styles.footer}>
          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            style={styles.logoutBtn}
          >
            <LogOut size={16} />
            <span>Cerrar Sesión</span>
          </button>

          <button onClick={onClose} className="btn-secondary" style={{ padding: '8px 18px' }}>
            <span>Aceptar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
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
  modal: {
    width: '100%',
    maxWidth: '480px',
    backgroundColor: 'var(--color-surface-elevated)',
    borderRadius: 'var(--radius-lg)',
    padding: '24px',
    boxShadow: 'var(--shadow-modal)',
    border: '1px solid var(--color-outline)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
  },
  avatarCircle: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-sky)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'var(--shadow-sky)',
  },
  title: {
    fontSize: '18px',
    fontWeight: 800,
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
    padding: '6px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s',
  },
  infoCard: {
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-md)',
    padding: '16px',
    border: '1px solid var(--color-outline)',
    marginBottom: '16px',
  },
  userHeadRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap',
    marginBottom: '12px',
  },
  userName: {
    fontSize: '17px',
    fontWeight: 800,
    color: 'var(--color-ink)',
    margin: '0 0 4px 0',
  },
  emailRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  userEmail: {
    fontSize: '13px',
    color: 'var(--color-ink-muted)',
  },
  rolePill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: 'var(--radius-full)',
    fontSize: '12px',
    fontWeight: 700,
  },
  idRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    paddingTop: '10px',
    borderTop: '1px solid var(--color-outline)',
    fontSize: '12px',
  },
  idLabel: {
    color: 'var(--color-ink-muted)',
  },
  idCode: {
    fontFamily: 'var(--font-mono)',
    color: 'var(--color-ink)',
    backgroundColor: 'var(--color-surface-sunken)',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '11px',
  },
  copyBtn: {
    background: 'transparent',
    color: 'var(--color-sky)',
    fontSize: '11px',
    fontWeight: 700,
    padding: '2px 6px',
    borderRadius: '4px',
  },
  statsCard: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '16px',
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px',
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-outline)',
  },
  statIconBox: {
    width: '34px',
    height: '34px',
    borderRadius: '10px',
    backgroundColor: 'var(--color-surface-elevated)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--color-outline)',
  },
  statLabel: {
    fontSize: '11px',
    color: 'var(--color-ink-muted)',
    display: 'block',
  },
  statValue: {
    fontSize: '14px',
    fontWeight: 800,
    color: 'var(--color-ink)',
  },
  preferencesSection: {
    borderTop: '1px solid var(--color-outline)',
    paddingTop: '16px',
    marginBottom: '20px',
  },
  prefSectionTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: 'var(--color-ink-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '10px',
  },
  prefRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-outline)',
  },
  prefLabel: {
    fontSize: '14px',
    fontWeight: 700,
    color: 'var(--color-ink)',
    display: 'block',
  },
  prefDesc: {
    fontSize: '12px',
    color: 'var(--color-ink-muted)',
    margin: 0,
  },
  toggleBtn: {
    width: '46px',
    height: '26px',
    borderRadius: '999px',
    padding: '3px',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  toggleCircle: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: '#FFFFFF',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '16px',
    borderTop: '1px solid var(--color-outline)',
  },
  logoutBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    backgroundColor: 'transparent',
    color: 'var(--color-coral)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '13px',
    fontWeight: 700,
    transition: 'background-color 0.2s',
    border: '1px solid var(--color-coral-soft)',
  },
};

