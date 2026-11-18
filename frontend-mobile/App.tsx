// frontend-mobile/App.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  AppState,
  Platform,
} from 'react-native';
import axios from 'axios';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';
import { SkylearnColors, SkylearnRadii, SkylearnShadows } from './src/theme/skylearn';
import { BACKEND_URL, registerForPushNotificationsAsync, sendLocalTestNotification } from './src/services/notifications';

interface Dashboard {
  kpis: { activeStudentsCount: number; averagePassRate: number | null; totalCompletions: number };
  courses: {
    id: string;
    title: string;
    studentsCount: number;
    passRate: number | null;
    trafficLight: 'leaf' | 'sun' | 'coral' | null;
  }[];
  criticalLesson: { lessonTitle: string; courseTitle: string; passRate: number } | null;
}

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [token, setToken] = useState('');
  const [teacherName, setTeacherName] = useState('Profesor');
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [error, setError] = useState('');
  const [quickFillNotice, setQuickFillNotice] = useState('');
  const [pushStatus, setPushStatus] = useState('');
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async (session: string) => {
    try {
      const result = await axios.get<Dashboard>(`${BACKEND_URL}/teacher/dashboard`, {
        headers: { Authorization: `Bearer ${session}` },
        timeout: 10000,
      });
      setDashboard(result.data);
      setError('');
    } catch {
      setError('No se pudo actualizar el panel. Comprueba la conexión o inicia sesión de nuevo.');
    }
  }, []);

  const onRefresh = useCallback(async () => {
    if (!token) return;
    setIsRefreshing(true);
    await refresh(token);
    setIsRefreshing(false);
  }, [token, refresh]);

  const executeLogin = async (loginEmail: string, loginPass: string) => {
    setIsLoggingIn(true);
    setError('');
    setQuickFillNotice('');

    try {
      const result = await axios.post<{
        accessToken: string;
        user: { name?: string; email: string; role: string };
      }>(
        `${BACKEND_URL}/auth/login`,
        { email: loginEmail.trim(), password: loginPass },
        { timeout: 10000 },
      );

      if (result.data.user.role !== 'TEACHER') {
        setError('Acceso restringido: Esta aplicación móvil es exclusiva para el rol Docente.');
        setIsLoggingIn(false);
        return;
      }

      setTeacherName(result.data.user.name || 'Profesor');
      setPassword('');
      setToken(result.data.accessToken);
      setError('');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (!err.response) {
          setError(
            `Error de conexión con el backend en: ${BACKEND_URL}. Verifica que el servidor esté activo y la URL sea alcanzable.`,
          );
        } else if (err.response.status === 401) {
          setError('Credenciales inválidas. Revisa el correo y la contraseña.');
        } else {
          setError('Error al iniciar sesión. Inténtalo nuevamente.');
        }
      } else {
        setError('No se pudo iniciar sesión. Verifica tu conexión.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLoginPress = () => {
    if (!email.trim() || !password) {
      setError('Por favor, ingresa tu correo y contraseña.');
      return;
    }
    void executeLogin(email, password);
  };

  /**
   * Rellena automáticamente los campos con las credenciales demo oficiales del docente
   */
  const handleQuickFill = () => {
    setEmail('teacher@test.com');
    setPassword('Password123!');
    setError('');
    setQuickFillNotice('✓ Credenciales de Docente Demo cargadas.');
    setTimeout(() => setQuickFillNotice(''), 4000);
  };

  /**
   * Ingreso rápido de 1 solo toque (rellena y ejecuta el login directamente)
   */
  const handleInstantLogin = () => {
    setEmail('teacher@test.com');
    setPassword('Password123!');
    void executeLogin('teacher@test.com', 'Password123!');
  };

  const handleLogout = async () => {
    if (pushToken && token) {
      try {
        await axios.delete(`${BACKEND_URL}/teacher/device-token`, {
          headers: { Authorization: `Bearer ${token}` },
          data: { pushToken },
          timeout: 5000,
        });
      } catch {
        // Silencioso en logout para no bloquear la salida del usuario
      }
    }
    setToken('');
    setPushToken(null);
    setDashboard(null);
    setEmail('');
    setPassword('');
    setError('');
  };

  useEffect(() => {
    if (!token) return;
    void refresh(token);

    void registerForPushNotificationsAsync(token)
      .then((registered) => {
        setPushToken(registered);
        setPushStatus(
          registered
            ? 'Alertas push activadas en este dispositivo'
            : 'Notificaciones push pendientes de permisos del sistema',
        );
      })
      .catch(() => setPushStatus('Notificaciones push no disponibles'));

    const received = Notifications.addNotificationReceivedListener(() => {
      void refresh(token);
    });
    const response = Notifications.addNotificationResponseReceivedListener(() => {
      void refresh(token);
    });
    const state = AppState.addEventListener('change', (next) => {
      if (next === 'active') void refresh(token);
    });
    const interval = setInterval(() => {
      void refresh(token);
    }, 30000);

    return () => {
      received.remove();
      response.remove();
      state.remove();
      clearInterval(interval);
    };
  }, [token, refresh]);

  // =========================================================================
  // VISTA 1: LOGIN AMIGABLE CON AUTOCOMPLETADO Y FILOSOFÍA SKYLEARN
  // =========================================================================
  if (!token) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <ScrollView
          contentContainerStyle={styles.loginScrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo y Encabezado de Marca */}
          <View style={styles.brandContainer}>
            <View style={styles.brandIconCircle}>
              <Ionicons name="school" size={44} color={SkylearnColors.sky} />
            </View>
            <View style={styles.brandBadge}>
              <Text style={styles.brandBadgeText}>PORTAL DOCENTE</Text>
            </View>
            <Text style={styles.brandTitle}>Skylearn</Text>
            <Text style={styles.brandSubtitle}>
              Supervisión de cursos, métricas de aprobación y alertas pedagógicas en tiempo real.
            </Text>
          </View>

          {/* Tarjeta de Inicio de Sesión */}
          <View style={styles.loginCard}>
            <Text style={styles.cardTitle}>Iniciar Sesión</Text>
            <Text style={styles.cardSubtitle}>
              Ingresa con tus credenciales de docente para acceder a tus métricas.
            </Text>

            {/* Banner de Mensaje de Error */}
            {Boolean(error) ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={20} color={SkylearnColors.coralDeep} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Banner de Aviso de Relleno Rápido */}
            {Boolean(quickFillNotice) ? (
              <View style={styles.quickFillNoticeBanner}>
                <Ionicons name="checkmark-circle" size={18} color={SkylearnColors.leafDeep} />
                <Text style={styles.quickFillNoticeText}>{quickFillNotice}</Text>
              </View>
            ) : null}

            {/* Campo: Correo Electrónico */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Correo electrónico</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={SkylearnColors.inkSubtle}
                  style={styles.inputIcon}
                />
                <TextInput
                  accessibilityLabel="Correo electrónico del docente"
                  placeholder="ej. docente@skylearn.edu"
                  placeholderTextColor={SkylearnColors.inkFaint}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={styles.textInput}
                />
              </View>
            </View>

            {/* Campo: Contraseña */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contraseña</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={SkylearnColors.inkSubtle}
                  style={styles.inputIcon}
                />
                <TextInput
                  accessibilityLabel="Contraseña del docente"
                  placeholder="••••••••"
                  placeholderTextColor={SkylearnColors.inkFaint}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  style={styles.textInput}
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.passwordToggle}
                  hitSlop={10}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={SkylearnColors.inkSubtle}
                  />
                </Pressable>
              </View>
            </View>

            {/* Botón Principal de Ingreso */}
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
                isLoggingIn && styles.buttonDisabled,
              ]}
              onPress={handleLoginPress}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <View style={styles.buttonContent}>
                  <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.primaryButtonText}>Conectando...</Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.primaryButtonText}>Entrar al Panel</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </View>
              )}
            </Pressable>

            {/* SECCIÓN DE ACCESO RÁPIDO PARA TESTING / DEMO */}
            <View style={styles.quickAccessDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ACCESO RÁPIDO DE PRUEBA</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.quickAccessContainer}>
              {/* Botón 1: Rellenar campos */}
              <Pressable
                style={({ pressed }) => [
                  styles.quickFillButton,
                  pressed && styles.quickFillButtonPressed,
                ]}
                onPress={handleQuickFill}
              >
                <Ionicons name="flash-outline" size={18} color={SkylearnColors.sunDeep} />
                <Text style={styles.quickFillButtonText}>Autocompletar Docente Demo</Text>
              </Pressable>

              {/* Botón 2: Ingreso instantáneo de 1 toque */}
              <Pressable
                style={({ pressed }) => [
                  styles.instantLoginButton,
                  pressed && styles.buttonPressed,
                  isLoggingIn && styles.buttonDisabled,
                ]}
                onPress={handleInstantLogin}
                disabled={isLoggingIn}
              >
                <Ionicons name="play-circle" size={18} color={SkylearnColors.skyDeep} />
                <Text style={styles.instantLoginButtonText}>Ingreso Directo (1 toque)</Text>
              </Pressable>
            </View>
          </View>

          {/* Pie informativo */}
          <View style={styles.loginFooter}>
            <Ionicons name="information-circle-outline" size={16} color={SkylearnColors.inkSubtle} />
            <Text style={styles.footerText}>
              ¿Eres estudiante? Utiliza la aplicación Web para interactuar con las lecciones y el Docente Virtual 3D.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // =========================================================================
  // VISTA 2: DASHBOARD DOCENTE CON SEMÁFORO PEDAGÓGICO Y FILOSOFÍA SKYLEARN
  // =========================================================================
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.dashboardContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={SkylearnColors.sky}
            colors={[SkylearnColors.sky]}
          />
        }
      >
        {/* Cabecera Superior: Perfil y Botón de Salida */}
        <View style={styles.topBar}>
          <View style={styles.profileInfo}>
            <View style={styles.avatarMiniCircle}>
              <Ionicons name="person" size={20} color={SkylearnColors.skyDeep} />
            </View>
            <View>
              <Text style={styles.teacherNameText}>{teacherName}</Text>
              <View style={styles.teacherRoleBadge}>
                <Text style={styles.teacherRoleText}>DOCENTE FORMADOR</Text>
              </View>
            </View>
          </View>

          <View style={styles.topActions}>
            <Pressable
              style={({ pressed }) => [styles.iconActionBtn, pressed && styles.iconActionBtnPressed]}
              onPress={() => void refresh(token)}
              accessibilityLabel="Actualizar métricas"
            >
              <Ionicons name="reload" size={18} color={SkylearnColors.skyDeep} />
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.logoutActionBtn, pressed && styles.iconActionBtnPressed]}
              onPress={handleLogout}
              accessibilityLabel="Cerrar sesión"
            >
              <Ionicons name="log-out-outline" size={18} color={SkylearnColors.coralDeep} />
              <Text style={styles.logoutBtnText}>Salir</Text>
            </Pressable>
          </View>
        </View>

        {/* Tarjeta de Notificaciones Push con prueba interactiva */}
        <View style={styles.pushStatusCard}>
          <View
            style={[
              styles.pushDot,
              { backgroundColor: pushToken ? SkylearnColors.leaf : SkylearnColors.sun },
            ]}
          />
          <Ionicons
            name={pushToken ? 'notifications-outline' : 'notifications-off-outline'}
            size={18}
            color={pushToken ? SkylearnColors.leafDeep : SkylearnColors.sunDeep}
            style={{ marginRight: 8 }}
          />
          <Text style={styles.pushStatusText} numberOfLines={1}>
            {pushStatus || 'Alertas push conectadas'}
          </Text>
          <Pressable
            style={styles.testNotificationBtn}
            onPress={async () => {
              await sendLocalTestNotification(
                '🎓 Skylearn Docente: Alerta de Prueba',
                '¡Las notificaciones están funcionando perfectamente en tu dispositivo!',
              );
            }}
          >
            <Ionicons name="paper-plane-outline" size={14} color={SkylearnColors.skyDeep} />
            <Text style={styles.testNotificationBtnText}>Probar</Text>
          </Pressable>
        </View>

        {/* Error si lo hay */}
        {Boolean(error) ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color={SkylearnColors.coralDeep} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* 3 KPIs PRINCIPALES (TARJETAS SKYLEARN) */}
        <View style={styles.kpiContainer}>
          {/* KPI 1: Alumnos */}
          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconWrap, { backgroundColor: SkylearnColors.skySoft }]}>
              <Ionicons name="people" size={20} color={SkylearnColors.skyDeep} />
            </View>
            <Text style={styles.kpiValue}>{dashboard?.kpis.activeStudentsCount ?? '—'}</Text>
            <Text style={styles.kpiLabel}>Estudiantes</Text>
          </View>

          {/* KPI 2: Completadas */}
          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconWrap, { backgroundColor: SkylearnColors.sunSoft }]}>
              <Ionicons name="ribbon" size={20} color={SkylearnColors.sunDeep} />
            </View>
            <Text style={[styles.kpiValue, { color: SkylearnColors.sunDeep }]}>
              {dashboard?.kpis.totalCompletions ?? '—'}
            </Text>
            <Text style={styles.kpiLabel}>Completadas</Text>
          </View>

          {/* KPI 3: Aprobación */}
          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconWrap, { backgroundColor: SkylearnColors.leafSoft }]}>
              <Ionicons name="trending-up" size={20} color={SkylearnColors.leafDeep} />
            </View>
            <Text style={[styles.kpiValue, { color: SkylearnColors.leafDeep }]}>
              {dashboard?.kpis.averagePassRate == null
                ? '—'
                : `${dashboard.kpis.averagePassRate}%`}
            </Text>
            <Text style={styles.kpiLabel}>Aprobación</Text>
          </View>
        </View>

        {/* ALERTA DE LECCIÓN CRÍTICA */}
        {dashboard?.criticalLesson ? (
          <View style={styles.criticalLessonCard}>
            <View style={styles.criticalHeaderRow}>
              <View style={styles.criticalBadge}>
                <Ionicons name="warning" size={16} color={SkylearnColors.coralDeep} />
                <Text style={styles.criticalBadgeText}>ATENCIÓN DIDÁCTICA</Text>
              </View>
              <Text style={styles.criticalPassRate}>
                {Math.round(dashboard.criticalLesson.passRate)}% aprobación
              </Text>
            </View>
            <Text style={styles.criticalLessonTitle}>
              {dashboard.criticalLesson.lessonTitle}
            </Text>
            <Text style={styles.criticalCourseTitle}>
              Curso: {dashboard.criticalLesson.courseTitle}
            </Text>
            <Text style={styles.criticalAdvice}>
              Esta lección presenta la menor tasa de comprensión. Considera reforzar los conceptos clave o revisar las preguntas evaluadas por el Docente Virtual.
            </Text>
          </View>
        ) : null}

        {/* SEMÁFORO PEDAGÓGICO DE CURSOS */}
        <View style={styles.statusSection}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Salud Pedagógica por Curso</Text>
              <Text style={styles.sectionSubtitle}>
                Monitoreo preventivo del progreso de tus alumnos
              </Text>
            </View>
          </View>

          {/* Leyenda del Semáforo */}
          <View style={styles.trafficLegendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: SkylearnColors.leaf }]} />
              <Text style={styles.legendText}>≥75% Óptimo</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: SkylearnColors.sun }]} />
              <Text style={styles.legendText}>60-74% Alerta</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: SkylearnColors.coral }]} />
              <Text style={styles.legendText}>&lt;60% Riesgo</Text>
            </View>
          </View>

          {/* Lista de Cursos */}
          {dashboard?.courses && dashboard.courses.length > 0 ? (
            dashboard.courses.map((course) => {
              const statusColor = course.trafficLight
                ? SkylearnColors[course.trafficLight]
                : SkylearnColors.inkSubtle;
              const statusLabel =
                course.trafficLight === 'leaf'
                  ? 'Óptimo'
                  : course.trafficLight === 'sun'
                    ? 'Atención'
                    : course.trafficLight === 'coral'
                      ? 'Riesgo'
                      : 'Sin evaluar';

              return (
                <View style={styles.courseCard} key={course.id}>
                  <View style={styles.courseHeader}>
                    <View style={styles.courseTitleWrapper}>
                      <Text style={styles.courseTitle}>{course.title}</Text>
                      <Text style={styles.courseStats}>
                        {course.studentsCount} {course.studentsCount === 1 ? 'estudiante' : 'estudiantes'} inscritos
                      </Text>
                    </View>
                    <View style={[styles.courseStatusPill, { backgroundColor: `${statusColor}20` }]}>
                      <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                      <Text style={[styles.statusLabelText, { color: statusColor }]}>
                        {statusLabel}
                      </Text>
                    </View>
                  </View>

                  {/* Barra de progreso de aprobación */}
                  <View style={styles.progressBarTrack}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${Math.min(course.passRate ?? 0, 100)}%`,
                          backgroundColor: statusColor,
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.courseFooter}>
                    <Text style={styles.footerStatLabel}>Tasa de Aprobación:</Text>
                    <Text style={[styles.footerStatValue, { color: statusColor }]}>
                      {course.passRate === null ? 'Pendiente' : `${course.passRate}%`}
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyCoursesBox}>
              <Ionicons name="folder-open-outline" size={36} color={SkylearnColors.inkSubtle} />
              <Text style={styles.emptyCoursesText}>Aún no tienes cursos con alumnos registrados.</Text>
            </View>
          )}
        </View>

        <View style={styles.safeBottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

// =========================================================================
// ESTILOS ERGONÓMICOS SKYLEARN Y REGLAS DE PERFORMANCE REACT NATIVE
// =========================================================================
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: SkylearnColors.surface,
  },
  loginScrollContainer: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  brandIconCircle: {
    width: 80,
    height: 80,
    borderRadius: SkylearnRadii.full,
    backgroundColor: SkylearnColors.skySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brandBadge: {
    backgroundColor: SkylearnColors.skySoft,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: SkylearnRadii.full,
    marginBottom: 6,
  },
  brandBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: SkylearnColors.skyDeep,
    letterSpacing: 0.8,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: SkylearnColors.ink,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 14,
    color: SkylearnColors.inkMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  loginCard: {
    width: '100%',
    backgroundColor: SkylearnColors.surfaceElevated,
    borderRadius: SkylearnRadii.xl,
    padding: 24,
    borderWidth: 1,
    borderColor: SkylearnColors.outline,
    ...SkylearnShadows.card,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: SkylearnColors.ink,
  },
  cardSubtitle: {
    fontSize: 13,
    color: SkylearnColors.inkMuted,
    marginTop: 4,
    marginBottom: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SkylearnColors.coralSoft,
    borderColor: SkylearnColors.coral,
    borderWidth: 1,
    padding: 12,
    borderRadius: SkylearnRadii.md,
    marginBottom: 16,
    gap: 10,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: SkylearnColors.coralDeep,
    fontWeight: '600',
    lineHeight: 18,
  },
  quickFillNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SkylearnColors.leafSoft,
    borderColor: SkylearnColors.leaf,
    borderWidth: 1,
    padding: 10,
    borderRadius: SkylearnRadii.md,
    marginBottom: 16,
    gap: 8,
  },
  quickFillNoticeText: {
    flex: 1,
    fontSize: 12,
    color: SkylearnColors.leafDeep,
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: SkylearnColors.ink,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SkylearnColors.surface,
    borderWidth: 1,
    borderColor: SkylearnColors.outline,
    borderRadius: SkylearnRadii.md,
    paddingHorizontal: 14,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: SkylearnColors.ink,
  },
  passwordToggle: {
    padding: 6,
  },
  primaryButton: {
    backgroundColor: SkylearnColors.sky,
    borderRadius: SkylearnRadii.md,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    ...SkylearnShadows.card,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  quickAccessDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: SkylearnColors.outline,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '800',
    color: SkylearnColors.inkSubtle,
    letterSpacing: 0.8,
  },
  quickAccessContainer: {
    gap: 10,
  },
  quickFillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SkylearnColors.sunSoft,
    borderWidth: 1,
    borderColor: SkylearnColors.sun,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: SkylearnRadii.md,
    gap: 8,
  },
  quickFillButtonPressed: {
    backgroundColor: '#FDE68A',
  },
  quickFillButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: SkylearnColors.sunDeep,
  },
  instantLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SkylearnColors.skySoft,
    borderWidth: 1,
    borderColor: SkylearnColors.sky,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: SkylearnRadii.md,
    gap: 8,
  },
  instantLoginButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: SkylearnColors.skyDeep,
  },
  loginFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 16,
    gap: 8,
  },
  footerText: {
    flex: 1,
    fontSize: 12,
    color: SkylearnColors.inkSubtle,
    lineHeight: 18,
  },

  // =========================================================================
  // ESTILOS DEL DASHBOARD
  // =========================================================================
  dashboardContainer: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 24 : 12,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarMiniCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: SkylearnColors.skySoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: SkylearnColors.sky,
  },
  teacherNameText: {
    fontSize: 17,
    fontWeight: '800',
    color: SkylearnColors.ink,
  },
  teacherRoleBadge: {
    backgroundColor: SkylearnColors.skySoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: SkylearnRadii.full,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  teacherRoleText: {
    fontSize: 9,
    fontWeight: '800',
    color: SkylearnColors.skyDeep,
    letterSpacing: 0.6,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconActionBtn: {
    width: 38,
    height: 38,
    borderRadius: SkylearnRadii.md,
    backgroundColor: SkylearnColors.surfaceElevated,
    borderWidth: 1,
    borderColor: SkylearnColors.outline,
    alignItems: 'center',
    justifyContent: 'center',
    ...SkylearnShadows.card,
  },
  logoutActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 38,
    borderRadius: SkylearnRadii.md,
    backgroundColor: SkylearnColors.coralSoft,
    borderWidth: 1,
    borderColor: SkylearnColors.coral,
    gap: 6,
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: SkylearnColors.coralDeep,
  },
  iconActionBtnPressed: {
    opacity: 0.7,
  },
  pushStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SkylearnColors.surfaceElevated,
    borderRadius: SkylearnRadii.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: SkylearnColors.outline,
    ...SkylearnShadows.card,
  },
  pushDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  pushStatusText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: SkylearnColors.inkMuted,
  },
  testNotificationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SkylearnColors.skySoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: SkylearnRadii.sm,
    gap: 4,
  },
  testNotificationBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: SkylearnColors.skyDeep,
  },
  kpiContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 20,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: SkylearnColors.surfaceElevated,
    borderRadius: SkylearnRadii.lg,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: SkylearnColors.outline,
    ...SkylearnShadows.card,
  },
  kpiIconWrap: {
    width: 36,
    height: 36,
    borderRadius: SkylearnRadii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '900',
    color: SkylearnColors.skyDeep,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: SkylearnColors.inkMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  criticalLessonCard: {
    backgroundColor: SkylearnColors.coralSoft,
    borderColor: SkylearnColors.coral,
    borderWidth: 1.5,
    borderRadius: SkylearnRadii.lg,
    padding: 16,
    marginBottom: 20,
    ...SkylearnShadows.card,
  },
  criticalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  criticalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  criticalBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: SkylearnColors.coralDeep,
    letterSpacing: 0.6,
  },
  criticalPassRate: {
    fontSize: 13,
    fontWeight: '900',
    color: SkylearnColors.coralDeep,
  },
  criticalLessonTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: SkylearnColors.ink,
    marginBottom: 2,
  },
  criticalCourseTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: SkylearnColors.inkMuted,
    marginBottom: 8,
  },
  criticalAdvice: {
    fontSize: 12,
    color: SkylearnColors.ink,
    lineHeight: 17,
  },
  statusSection: {
    backgroundColor: SkylearnColors.surfaceElevated,
    borderRadius: SkylearnRadii.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: SkylearnColors.outline,
    ...SkylearnShadows.card,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: SkylearnColors.ink,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: SkylearnColors.inkMuted,
    marginTop: 2,
  },
  trafficLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: SkylearnColors.outline,
    marginBottom: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '700',
    color: SkylearnColors.inkMuted,
  },
  courseCard: {
    backgroundColor: SkylearnColors.surface,
    borderRadius: SkylearnRadii.md,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: SkylearnColors.outline,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 8,
  },
  courseTitleWrapper: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: SkylearnColors.ink,
  },
  courseStats: {
    fontSize: 12,
    color: SkylearnColors.inkMuted,
    marginTop: 2,
  },
  courseStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: SkylearnRadii.full,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabelText: {
    fontSize: 11,
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: SkylearnColors.outline,
    borderRadius: SkylearnRadii.full,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: SkylearnRadii.full,
  },
  courseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerStatLabel: {
    fontSize: 12,
    color: SkylearnColors.inkMuted,
    fontWeight: '600',
  },
  footerStatValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  emptyCoursesBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyCoursesText: {
    fontSize: 13,
    color: SkylearnColors.inkSubtle,
    textAlign: 'center',
  },
  safeBottomSpace: {
    height: 30,
  },
});
