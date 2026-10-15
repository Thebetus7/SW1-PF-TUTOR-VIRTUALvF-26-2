// frontend-web/src/components/Navbar.tsx
import React from 'react';
import { Sparkles, LogOut, GraduationCap, BookOpen } from 'lucide-react';

interface NavbarProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    credits: number;
  } | null;
  onLogout: () => void;
  onOpenCatalog?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout, onOpenCatalog }) => {
  return (
    <header style={styles.header}>
      <div style={styles.navContainer}>
        {/* Brand Logo */}
        <div style={styles.brand} onClick={onOpenCatalog}>
          <div style={styles.logoBadge}>
            <Sparkles size={22} color="#FFFFFF" />
          </div>
          <div>
            <h1 style={styles.brandTitle}>Skylearn</h1>
            <span style={styles.brandSubtitle}>Aprende a tu propio ritmo</span>
          </div>
        </div>

        {/* Navigation Actions */}
        <div style={styles.actions}>
          {user ? (
            <>
              {/* Enlaces Rápidos de Navegación */}
              <div style={styles.navLinks}>
                <a
                  href="#/courses"
                  style={styles.navLink}
                >
                  <BookOpen size={16} />
                  <span>Cursos</span>
                </a>

                {user.role === 'TEACHER' && (
                  <a
                    href="#/teacher/courses"
                    style={{ ...styles.navLink, color: 'var(--color-sky-deep)', fontWeight: 700 }}
                  >
                    <span>Mis Cursos Creados</span>
                  </a>
                )}
              </div>

              {/* Badge de Créditos para Estudiante */}
              {user.role === 'STUDENT' && (
                <div className="star-badge" title="Tus créditos disponibles para abrir nuevas lecciones">
                  <span>⭐</span>
                  <span>{user.credits} Créditos</span>
                </div>
              )}

              {/* Rol Badge */}
              <div style={styles.roleTag}>
                {user.role === 'TEACHER' ? (
                  <>
                    <BookOpen size={16} color="var(--color-sky-deep)" />
                    <span>Docente</span>
                  </>
                ) : (
                  <>
                    <GraduationCap size={16} color="var(--color-leaf-deep)" />
                    <span>Estudiante</span>
                  </>
                )}
              </div>

              {/* Info de Usuario */}
              <span style={styles.userName}>{user.name}</span>

              {/* Botón Salir */}
              <button
                onClick={onLogout}
                style={styles.logoutBtn}
                title="Cerrar Sesión"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <div style={styles.guestNotice}>
              Modo Invitado • ¡Regístrate para obtener 3 créditos!
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

const styles: Record<string, React.CSSProperties> = {
  header: {
    backgroundColor: 'var(--color-surface-elevated)',
    borderBottom: '1px solid var(--color-outline)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
  },
  navContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '12px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
  },
  logoBadge: {
    width: '42px',
    height: '42px',
    borderRadius: '14px',
    backgroundColor: 'var(--color-sky)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'var(--shadow-sky)',
  },
  brandTitle: {
    fontSize: '22px',
    fontWeight: 900,
    color: 'var(--color-sky-deep)',
    letterSpacing: '-0.5px',
  },
  brandSubtitle: {
    fontSize: '12px',
    color: 'var(--color-ink-muted)',
    display: 'block',
    marginTop: '-3px',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginRight: '8px',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--color-ink)',
    textDecoration: 'none',
    padding: '6px 12px',
    borderRadius: '8px',
    transition: 'background-color 0.2s',
  },
  roleTag: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: 'var(--radius-full)',
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-outline)',
    fontSize: '13px',
    fontWeight: 700,
    color: 'var(--color-ink)',
  },
  userName: {
    fontSize: '15px',
    fontWeight: 700,
    color: 'var(--color-ink)',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-outline)',
    color: 'var(--color-ink-muted)',
    transition: 'all 0.2s',
  },
  guestNotice: {
    fontSize: '14px',
    color: 'var(--color-sky-deep)',
    fontWeight: 700,
  },
};
