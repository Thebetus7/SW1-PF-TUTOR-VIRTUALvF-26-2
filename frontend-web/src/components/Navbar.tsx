// frontend-web/src/components/Navbar.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  LogOut,
  GraduationCap,
  BookOpen,
  FolderPlus,
  ShieldCheck,
  User,
  Moon,
  Sun,
  Bot,
  ChevronDown,
} from 'lucide-react';
import { ProfileModal } from './ProfileModal';

interface NavbarProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    credits: number;
    subscriptionStatus?: string;
  } | null;
  onLogout: () => void;
  onOpenCatalog?: () => void;
  currentPath?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout, onOpenCatalog, currentPath }) => {
  const [activeHash, setActiveHash] = useState<string>(
    currentPath || (typeof window !== 'undefined' ? window.location.hash || '#/courses' : '#/courses')
  );
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme_mode') === 'dark';
  });

  const menuRef = useRef<HTMLDivElement | null>(null);

  // Aplicar modo oscuro al document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme_mode', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme_mode', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  useEffect(() => {
    if (currentPath) {
      setActiveHash(currentPath);
    }
  }, [currentPath]);

  useEffect(() => {
    const handleHash = () => {
      setActiveHash(window.location.hash || '#/courses');
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Cierre de menú al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isTeacherActive = activeHash.startsWith('#/teacher');
  const isAdminActive = activeHash.startsWith('#/admin');
  const isTutorActive = activeHash.startsWith('#/tutor');
  const isCoursesActive = !isTeacherActive && !isAdminActive && !isTutorActive;

  const getNavLinkStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    fontWeight: isActive ? 700 : 600,
    color: isActive ? 'var(--color-sky-deep)' : 'var(--color-ink-muted)',
    backgroundColor: isActive ? 'var(--color-sky-soft)' : 'transparent',
    textDecoration: 'none',
    padding: '6px 12px',
    borderRadius: '8px',
    border: isActive ? '1px solid var(--color-sky)' : '1px solid transparent',
    transition: 'all 0.18s ease',
  });

  return (
    <header style={styles.header}>
      <div style={styles.navContainer}>
        {/* Brand Logo */}
        <div style={styles.brand} onClick={onOpenCatalog}>
          <div style={styles.logoBadge}>
            <Sparkles size={20} color="#FFFFFF" />
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
              {/* Enlaces de Navegación */}
              <nav style={styles.navLinks}>
                <a
                  href="#/courses"
                  style={getNavLinkStyle(isCoursesActive)}
                  title="Catálogo de cursos y lecciones"
                >
                  <BookOpen size={15} />
                  <span>{user.role === 'STUDENT' ? 'Cursos disponibles' : 'Catálogo general'}</span>
                </a>

                {/* Sección Dedicada al Tutor Virtual (no repetido en cada tema) */}
                <a
                  href="#/tutor"
                  style={getNavLinkStyle(isTutorActive)}
                  title="Docente Virtual Interactivo 3D"
                >
                  <Bot size={15} color="var(--color-sky)" />
                  <span>Docente Virtual</span>
                </a>

                {user.role === 'TEACHER' && (
                  <a
                    href="#/teacher/courses"
                    style={getNavLinkStyle(isTeacherActive)}
                    title="Panel docente para gestionar cursos y lecciones"
                  >
                    <FolderPlus size={15} />
                    <span>Gestión docente</span>
                  </a>
                )}

                {user.role === 'ADMIN' && (
                  <a
                    href="#/admin"
                    style={getNavLinkStyle(isAdminActive)}
                    title="Panel de administración de usuarios y créditos"
                  >
                    <ShieldCheck size={15} />
                    <span>Admin</span>
                  </a>
                )}
              </nav>

              {/* Badge de Créditos para Estudiantes */}
              {user.role === 'STUDENT' && (
                <div className="star-badge" title="Tus créditos disponibles">
                  <span>⭐</span>
                  <span>{user.credits}</span>
                </div>
              )}

              {/* Botón de Perfil con Menú Desplegable (Mi Perfil, Modo Oscuro, Cerrar Sesión) */}
              <div style={styles.profileMenuContainer} ref={menuRef}>
                <button
                  onClick={() => setShowProfileMenu((prev) => !prev)}
                  style={styles.profileTriggerBtn}
                  aria-expanded={showProfileMenu}
                  aria-label="Abrir menú de usuario"
                >
                  <div style={styles.userAvatarSmall}>
                    {user.role === 'ADMIN' ? (
                      <ShieldCheck size={15} color="#EA580C" />
                    ) : user.role === 'TEACHER' ? (
                      <BookOpen size={15} color="#0284C7" />
                    ) : (
                      <GraduationCap size={15} color="#16A34A" />
                    )}
                  </div>
                  <span style={styles.profileUserName}>{user.name.split(' ')[0]}</span>
                  <ChevronDown size={14} color="var(--color-ink-muted)" />
                </button>

                {/* Dropdown Menu */}
                {showProfileMenu && (
                  <div className="skylearn-card" style={styles.dropdownCard}>
                    <div style={styles.dropdownHeader}>
                      <span style={styles.dropdownFullName}>{user.name}</span>
                      <span style={styles.dropdownRoleTag}>
                        {user.role === 'ADMIN'
                          ? 'Administrador'
                          : user.role === 'TEACHER'
                          ? 'Docente'
                          : 'Estudiante'}
                      </span>
                    </div>

                    <div style={styles.dropdownDivider} />

                    {/* Opción 1: Mi Perfil */}
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        setShowProfileModal(true);
                      }}
                      style={styles.dropdownItem}
                    >
                      <User size={16} color="var(--color-sky)" />
                      <span>Mi Perfil</span>
                    </button>

                    {/* Opción 2: Modo Oscuro */}
                    <button
                      onClick={() => {
                        toggleDarkMode();
                      }}
                      style={styles.dropdownItem}
                    >
                      {darkMode ? (
                        <>
                          <Sun size={16} color="var(--color-sun)" />
                          <span>Modo Claro</span>
                        </>
                      ) : (
                        <>
                          <Moon size={16} color="var(--color-sky-deep)" />
                          <span>Modo Oscuro</span>
                        </>
                      )}
                    </button>

                    <div style={styles.dropdownDivider} />

                    {/* Opción 3: Cerrar Sesión */}
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        onLogout();
                      }}
                      style={{ ...styles.dropdownItem, color: 'var(--color-coral)' }}
                    >
                      <LogOut size={16} color="var(--color-coral)" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={styles.guestNotice}>Modo Invitado</div>
          )}
        </div>
      </div>

      {/* Modal de Mi Perfil */}
      {showProfileModal && user && (
        <ProfileModal
          user={user}
          darkMode={darkMode}
          onToggleDarkMode={toggleDarkMode}
          onLogout={onLogout}
          onClose={() => setShowProfileModal(false)}
        />
      )}
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
    boxShadow: '0 1px 6px rgba(15, 23, 42, 0.03)',
  },
  navContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '8px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
  },
  logoBadge: {
    width: '34px',
    height: '34px',
    borderRadius: '10px',
    backgroundColor: 'var(--color-sky)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'var(--shadow-sky)',
  },
  brandTitle: {
    fontSize: '18px',
    fontWeight: 900,
    color: 'var(--color-sky-deep)',
    letterSpacing: '-0.3px',
    margin: 0,
  },
  brandSubtitle: {
    fontSize: '11px',
    color: 'var(--color-ink-muted)',
    display: 'block',
    marginTop: '-2px',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
  },
  profileMenuContainer: {
    position: 'relative',
  },
  profileTriggerBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    borderRadius: 'var(--radius-full)',
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-outline)',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  userAvatarSmall: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--color-surface-elevated)',
  },
  profileUserName: {
    fontSize: '13px',
    fontWeight: 700,
    color: 'var(--color-ink)',
  },
  dropdownCard: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    width: '210px',
    padding: '8px',
    backgroundColor: 'var(--color-surface-elevated)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-modal)',
    border: '1px solid var(--color-outline)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  dropdownHeader: {
    padding: '8px 10px',
  },
  dropdownFullName: {
    fontSize: '13px',
    fontWeight: 800,
    color: 'var(--color-ink)',
    display: 'block',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  dropdownRoleTag: {
    fontSize: '11px',
    color: 'var(--color-ink-muted)',
    display: 'block',
    marginTop: '2px',
  },
  dropdownDivider: {
    height: '1px',
    backgroundColor: 'var(--color-outline)',
    margin: '4px 0',
  },
  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 10px',
    borderRadius: '6px',
    backgroundColor: 'transparent',
    color: 'var(--color-ink)',
    fontSize: '13px',
    fontWeight: 600,
    textAlign: 'left',
    width: '100%',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },
  guestNotice: {
    fontSize: '13px',
    color: 'var(--color-sky-deep)',
    fontWeight: 700,
  },
};
