// frontend-mobile/App.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
  KeyboardAvoidingView,
  Platform,
  AppState,
  type AppStateStatus,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as Notifications from 'expo-notifications';
import { SkylearnColors, SkylearnRadii, SkylearnShadows } from './src/theme/skylearn';
import { BACKEND_URL, registerForPushNotificationsAsync } from './src/services/notifications';

interface Dashboard {
  kpis: {
    activeStudentsCount: number;
    averagePassRate: number | null;
    totalCompletions: number;
  };
  courses: Array<{
    id: string;
    title: string;
    studentsCount: number;
    passRate: number | null;
    trafficLight: 'leaf' | 'sun' | 'coral' | null;
  }>;
  criticalLesson: {
    lessonId?: string;
    lessonTitle: string;
    courseTitle: string;
    passRate: number;
    totalAttempts?: number;
  } | null;
}

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [token, setToken] = useState('');
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pushStatus, setPushStatus] = useState<'idle' | 'active' | 'warning'>('idle');
  const [pushStatusText, setPushStatusText] = useState('Verificando notificaciones...');
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Consulta del dashboard con manejo de estado
  const refresh = useCallback(async (session: string, isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const result = await axios.get<Dashboard>(`${BACKEND_URL}/teacher/dashboard`, {
        headers: { Authorization: `Bearer ${session}` },
      });
      setDashboard(result.data);
      setError('');
      const now = new Date();
      setLastUpdated(
        `${now.getHours().toString().padStart(2, '0')}:${now
          .getMinutes()
          .toString()
          .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`,
      );
    } catch {
      setError('No se pudo sincronizar el panel docente. Comprueba la conexión a la red.');
    } finally {
      if (isManual) setRefreshing(false);
    }
  }, []);

  // Inicio de sesión
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Por favor, ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await axios.post<{ accessToken: string; user: { role: string } }>(
        `${BACKEND_URL}/auth/login`,
        { email: email.trim(), password },
      );

      if (result.data.user.role !== 'TEACHER') {
        setError('Acceso restringido: esta aplicación móvil es exclusiva para el rol de docente.');
        setLoading(false);
        return;
      }

      setPassword('');
      setToken(result.data.accessToken);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError('Credenciales incorrectas. Verifica tu correo y contraseña.');
      } else {
        setError('No se pudo conectar con el servidor. Verifica tu conexión de red.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Botón Quick Fill para agilizar pruebas y demostraciones
  const handleQuickFill = () => {
    setEmail('teacher@test.com');
    setPassword('Password123!');
    setError('');
  };

  // Cierre de sesión seguro y resiliente
  const handleLogout = async () => {
    if (pushToken && token) {
      try {
        await axios.delete(`${BACKEND_URL}/teacher/device-token`, {
          headers: { Authorization: `Bearer ${token}` },
          data: { pushToken },
        });
      } catch {
        // No bloqueamos el logout local si la petición remota falla
        console.warn('No se pudo desvincular el push token en el backend.');
      }
    }
    setToken('');
    setPushToken(null);
    setDashboard(null);
    setError('');
    setPushStatus('idle');
  };

  // Ciclo de vida y listeners cuando hay sesión activa
  useEffect(() => {
    if (!token) return;

    void refresh(token);

    // Registro de push token
    void registerForPushNotificationsAsync(token)
      .then((registered) => {
        setPushToken(registered);
        if (registered) {
          setPushStatus('active');
          setPushStatusText('Alertas en tiempo real conectadas');
        } else {
          setPushStatus('warning');
          setPushStatusText('Notificaciones en modo local / simulado');
        }
      })
      .catch(() => {
        setPushStatus('warning');
        setPushStatusText('Sin permisos de notificaciones push');
      });

    // Listeners de notificaciones push para auto-refresco
    const receivedSub = Notifications.addNotificationReceivedListener(() => {
      void refresh(token);
    });
    const responseSub = Notifications.addNotificationResponseReceivedListener(() => {
      void refresh(token);
    });

    // Auto-refresco al volver a la aplicación (foreground)
    const stateSub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        void refresh(token);
      }
    });

    // Polling preventivo cada 30 segundos
    const interval = setInterval(() => {
      void refresh(token);
    }, 30000);

    return () => {
      receivedSub.remove();
      responseSub.remove();
      stateSub.remove();
      clearInterval(interval);
    };
  }, [token, refresh]);

  // Semáforo: helper para formato de estado
  const getTrafficLightInfo = useMemo(() => {
    return (status: 'leaf' | 'sun' | 'coral' | null) => {
      switch (status) {
        case 'leaf':
          return {
            color: SkylearnColors.leafDeep,
            bg: SkylearnColors.leafSoft,
            label: 'Saludable',
            icon: 'checkmark-circle' as const,
          };
        case 'sun':
          return {
            color: SkylearnColors.sunDeep,
            bg: SkylearnColors.sunSoft,
            label: 'En Observación',
            icon: 'alert-circle' as const,
          };
        case 'coral':
          return {
            color: SkylearnColors.coralDeep,
            bg: SkylearnColors.coralSoft,
            label: 'Atención Requerida',
            icon: 'warning' as const,
          };
        default:
          return {
            color: SkylearnColors.inkSubtle,
            bg: SkylearnColors.surfaceSunken,
            label: 'Sin Evaluaciones',
            icon: 'help-circle' as const,
          };
      }
    };
  }, []);

  // ==========================================
  // VISTA: PANTALLA DE INICIO DE SESIÓN
  // ==========================================
  if (!token) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}
        >
          <ScrollView
            contentContainerStyle={styles.loginScrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header del Login con Iconografía Escolar */}
            <View style={styles.brandHero}>
              <View style={styles.brandIconCircle}>
                <Ionicons name="school" size={40} color={SkylearnColors.sky} />
              </View>
              <Text style={styles.brandBadge}>PORTAL DOCENTE</Text>
              <Text style={styles.loginTitle}>Skylearn Docente</Text>
              <Text style={styles.loginSubtitle}>
                Supervisión pedagógica y analítica formativa en tiempo real
              </Text>
            </View>

            {/* Tarjeta de Formulario */}
            <View style={styles.formCard}>
              {/* Botón Quick Fill Oficial para Demostraciones y QA */}
              <Pressable
                style={({ pressed }) => [
                  styles.quickFillButton,
                  pressed && styles.quickFillButtonPressed,
                ]}
                onPress={handleQuickFill}
                accessibilityRole="button"
                accessibilityLabel="Llenar con credenciales de docente de prueba"
              >
                <Ionicons name="flash" size={16} color={SkylearnColors.sunDeep} />
                <Text style={styles.quickFillText}>⚡ Llenar credenciales Docente Demo</Text>
              </Pressable>

              {/* Mensaje de Error Amigable */}
              {error ? (
                <View style={styles.errorBanner} accessibilityRole="alert">
                  <Ionicons name="alert-circle" size={18} color={SkylearnColors.coralDeep} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* Campo Correo Electrónico */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Correo electrónico docente</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={SkylearnColors.inkSubtle}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="ejemplo@skylearn.edu"
                    placeholderTextColor={SkylearnColors.inkFaint}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoCorrect={false}
                    accessibilityLabel="Correo electrónico docente"
                  />
                </View>
              </View>

              {/* Campo Contraseña */}
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
                    style={styles.textInput}
                    placeholder="Ingresa tu contraseña"
                    placeholderTextColor={SkylearnColors.inkFaint}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    accessibilityLabel="Contraseña"
                  />
                  <Pressable
                    style={styles.passwordToggle}
                    onPress={() => setShowPassword(!showPassword)}
                    accessibilityLabel="Alternar visualización de contraseña"
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={SkylearnColors.inkSubtle}
                    />
                  </Pressable>
                </View>
              </View>

              {/* Botón Principal de Inicio de Sesión */}
              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.primaryButtonPressed,
                  loading && styles.buttonDisabled,
                ]}
                onPress={handleLogin}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Iniciar sesión"
              >
                {loading ? (
                  <View style={styles.buttonLoadingRow}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.primaryButtonText}>Verificando acceso...</Text>
                  </View>
                ) : (
                  <View style={styles.buttonRow}>
                    <Ionicons name="log-in-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.primaryButtonText}>Ingresar al Panel</Text>
                  </View>
                )}
              </Pressable>
            </View>

            {/* Footer Informativo */}
            <View style={styles.loginFooter}>
              <Ionicons name="shield-checkmark-outline" size={16} color={SkylearnColors.leafDeep} />
              <Text style={styles.loginFooterText}>
                Acceso protegido bajo estándares de seguridad RBAC
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ==========================================
  // VISTA: PANEL DOCENTE (DASHBOARD)
  // ==========================================
  const activeStudents = dashboard?.kpis.activeStudentsCount ?? 0;
  const totalCompletions = dashboard?.kpis.totalCompletions ?? 0;
  const averagePassRate = dashboard?.kpis.averagePassRate;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.dashboardContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refresh(token, true)}
            colors={[SkylearnColors.sky]}
            tintColor={SkylearnColors.sky}
          />
        }
      >
        {/* Cabecera Principal */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View>
              <View style={styles.badgeRow}>
                <Text style={styles.headerBadge}>PANEL DOCENTE</Text>
              </View>
              <Text style={styles.headerTitle}>Skylearn Docente</Text>
              <Text style={styles.headerSubtitle}>
                Supervisión pedagógica y analítica formativa
              </Text>
            </View>

            {/* Botón de Logout Rápido */}
            <Pressable
              style={({ pressed }) => [
                styles.iconButtonLogout,
                pressed && styles.iconButtonPressed,
              ]}
              onPress={handleLogout}
              accessibilityRole="button"
              accessibilityLabel="Cerrar sesión"
            >
              <Ionicons name="log-out-outline" size={20} color={SkylearnColors.coralDeep} />
            </Pressable>
          </View>

          {/* Barra de Notificaciones y Sincronización */}
          <View style={styles.statusChipRow}>
            <View
              style={[
                styles.statusBadge,
                pushStatus === 'active'
                  ? styles.statusBadgeActive
                  : styles.statusBadgeWarning,
              ]}
            >
              <Ionicons
                name={pushStatus === 'active' ? 'notifications' : 'notifications-outline'}
                size={14}
                color={
                  pushStatus === 'active'
                    ? SkylearnColors.leafDeep
                    : SkylearnColors.sunDeep
                }
              />
              <Text
                style={[
                  styles.statusBadgeText,
                  {
                    color:
                      pushStatus === 'active'
                        ? SkylearnColors.leafDeep
                        : SkylearnColors.sunDeep,
                  },
                ]}
              >
                {pushStatusText}
              </Text>
            </View>

            {/* Botón de Actualizar Manual */}
            <Pressable
              style={({ pressed }) => [
                styles.refreshChip,
                pressed && styles.refreshChipPressed,
              ]}
              onPress={() => void refresh(token, true)}
              accessibilityRole="button"
              accessibilityLabel="Actualizar métricas"
            >
              <Ionicons
                name="refresh-outline"
                size={14}
                color={SkylearnColors.skyDeep}
              />
              <Text style={styles.refreshChipText}>
                {lastUpdated ? `Actualizado ${lastUpdated}` : 'Actualizar'}
              </Text>
            </Pressable>
          </View>

          {/* Banner de Error en Dashboard si ocurre */}
          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color={SkylearnColors.coralDeep} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </View>

        {/* 3 KPIs Principales */}
        <View style={styles.kpiContainer}>
          {/* KPI 1: Alumnos Activos */}
          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconWrapper, { backgroundColor: SkylearnColors.skySoft }]}>
              <Ionicons name="people" size={20} color={SkylearnColors.skyDeep} />
            </View>
            <Text style={styles.kpiValue}>{dashboard ? activeStudents : '—'}</Text>
            <Text style={styles.kpiLabel}>Alumnos Activos</Text>
          </View>

          {/* KPI 2: Lecciones Completadas */}
          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconWrapper, { backgroundColor: SkylearnColors.sunSoft }]}>
              <Ionicons name="checkmark-done-circle" size={20} color={SkylearnColors.sunDeep} />
            </View>
            <Text style={styles.kpiValue}>{dashboard ? totalCompletions : '—'}</Text>
            <Text style={styles.kpiLabel}>Lecciones Vistas</Text>
          </View>

          {/* KPI 3: Tasa de Aprobación Global */}
          <View style={[styles.kpiCard, styles.kpiCardHighlight]}>
            <View style={[styles.kpiIconWrapper, { backgroundColor: SkylearnColors.leafSoft }]}>
              <Ionicons name="ribbon" size={20} color={SkylearnColors.leafDeep} />
            </View>
            <Text style={[styles.kpiValue, { color: SkylearnColors.leafDeep }]}>
              {dashboard && averagePassRate !== null ? `${averagePassRate}%` : '—'}
            </Text>
            <Text style={styles.kpiLabel}>Aprobación Global</Text>
          </View>
        </View>

        {/* Alerta de Lección Crítica con Menor Tasa de Aprobación */}
        {dashboard?.criticalLesson ? (
          <View style={styles.criticalCard}>
            <View style={styles.criticalHeader}>
              <View style={styles.criticalBadge}>
                <Ionicons name="warning" size={14} color={SkylearnColors.coralDeep} />
                <Text style={styles.criticalBadgeText}>ATENCIÓN PEDAGÓGICA</Text>
              </View>
              <Text style={styles.criticalRateText}>
                {Math.round(dashboard.criticalLesson.passRate)}% aprobación
              </Text>
            </View>

            <Text style={styles.criticalTitle}>
              {dashboard.criticalLesson.lessonTitle}
            </Text>
            <Text style={styles.criticalSubtitle}>
              Curso: {dashboard.criticalLesson.courseTitle}
            </Text>

            <View style={styles.criticalAdviceBox}>
              <Ionicons name="bulb-outline" size={16} color={SkylearnColors.sunDeep} />
              <Text style={styles.criticalAdviceText}>
                Esta lección presenta la mayor fricción evaluativa. Considera reforzar el video o
                ajustar la dificultad del banco de preguntas.
              </Text>
            </View>
          </View>
        ) : null}

        {/* Sección: Salud Pedagógica de Cursos (Semáforo) */}
        <View style={styles.coursesSection}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Salud Pedagógica por Curso</Text>
              <Text style={styles.sectionSubtitle}>
                Monitoreo según tasa de aprobación en exámenes
              </Text>
            </View>
          </View>

          {/* Leyenda del Semáforo */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: SkylearnColors.leafDeep }]} />
              <Text style={styles.legendText}>≥80% Saludable</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: SkylearnColors.sunDeep }]} />
              <Text style={styles.legendText}>60-79% Observación</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: SkylearnColors.coralDeep }]} />
              <Text style={styles.legendText}>&lt;60% Fricción</Text>
            </View>
          </View>

          {/* Lista de Cursos */}
          {dashboard?.courses && dashboard.courses.length > 0 ? (
            dashboard.courses.map((course) => {
              const statusInfo = getTrafficLightInfo(course.trafficLight);
              return (
                <View key={course.id} style={styles.courseCard}>
                  <View style={styles.courseCardHeader}>
                    <View style={styles.courseTitleWrapper}>
                      <Text style={styles.courseTitle} numberOfLines={2}>
                        {course.title}
                      </Text>
                    </View>
                    <View style={[styles.courseStatusBadge, { backgroundColor: statusInfo.bg }]}>
                      <Ionicons name={statusInfo.icon} size={14} color={statusInfo.color} />
                      <Text style={[styles.courseStatusBadgeText, { color: statusInfo.color }]}>
                        {statusInfo.label}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.courseMetaRow}>
                    <View style={styles.courseMetaItem}>
                      <Ionicons
                        name="people-outline"
                        size={15}
                        color={SkylearnColors.inkMuted}
                      />
                      <Text style={styles.courseMetaText}>
                        {course.studentsCount}{' '}
                        {course.studentsCount === 1 ? 'estudiante' : 'estudiantes'}
                      </Text>
                    </View>

                    <View style={styles.courseMetaItem}>
                      <Ionicons
                        name="stats-chart-outline"
                        size={15}
                        color={SkylearnColors.inkMuted}
                      />
                      <Text style={styles.courseMetaText}>
                        {course.passRate === null
                          ? 'Sin evaluaciones'
                          : `${course.passRate}% de aprobación`}
                      </Text>
                    </View>
                  </View>

                  {/* Barra de Progreso Visual */}
                  {course.passRate !== null ? (
                    <View style={styles.progressBarTrack}>
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${Math.min(100, Math.max(0, course.passRate))}%`,
                            backgroundColor: statusInfo.color,
                          },
                        ]}
                      />
                    </View>
                  ) : null}
                </View>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="file-tray-outline" size={40} color={SkylearnColors.inkSubtle} />
              <Text style={styles.emptyTitle}>Aún no tienes cursos registrados</Text>
              <Text style={styles.emptySubtitle}>
                Crea tu primer curso en la plataforma web para comenzar a recibir métricas de tus
                alumnos.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: SkylearnColors.surface,
  },
  keyboardContainer: {
    flex: 1,
  },

  // ESTILOS DE LOGIN
  loginScrollContainer: {
    padding: 24,
    paddingTop: 48,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  brandHero: {
    alignItems: 'center',
    marginBottom: 28,
  },
  brandIconCircle: {
    width: 80,
    height: 80,
    borderRadius: SkylearnRadii.full,
    backgroundColor: SkylearnColors.skySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...SkylearnShadows.card,
  },
  brandBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: SkylearnColors.skyDeep,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  loginTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: SkylearnColors.ink,
    textAlign: 'center',
  },
  loginSubtitle: {
    fontSize: 14,
    color: SkylearnColors.inkMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  formCard: {
    backgroundColor: SkylearnColors.surfaceElevated,
    borderRadius: SkylearnRadii.xl,
    padding: 22,
    borderWidth: 1,
    borderColor: SkylearnColors.outline,
    ...SkylearnShadows.card,
  },
  quickFillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SkylearnColors.sunSoft,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: SkylearnRadii.md,
    borderWidth: 1,
    borderColor: SkylearnColors.sunBright,
    marginBottom: 18,
    gap: 8,
  },
  quickFillButtonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
  quickFillText: {
    fontSize: 14,
    fontWeight: '700',
    color: SkylearnColors.sunDeep,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SkylearnColors.coralSoft,
    borderRadius: SkylearnRadii.sm,
    padding: 12,
    marginBottom: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: SkylearnColors.coral,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: SkylearnColors.coralDeep,
    fontWeight: '600',
    lineHeight: 18,
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
    backgroundColor: SkylearnColors.background,
    borderWidth: 1.5,
    borderColor: SkylearnColors.outline,
    borderRadius: SkylearnRadii.sm,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: SkylearnColors.ink,
    paddingVertical: 12,
  },
  passwordToggle: {
    padding: 6,
  },
  primaryButton: {
    backgroundColor: SkylearnColors.sky,
    borderRadius: SkylearnRadii.md,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    ...SkylearnShadows.card,
  },
  primaryButtonPressed: {
    backgroundColor: SkylearnColors.skyDeep,
    transform: [{ scale: 0.99 }],
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loginFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 6,
  },
  loginFooterText: {
    fontSize: 12,
    color: SkylearnColors.inkMuted,
    fontWeight: '500',
  },

  // ESTILOS DE DASHBOARD
  dashboardContainer: {
    padding: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: SkylearnColors.skyDeep,
    backgroundColor: SkylearnColors.skySoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: SkylearnRadii.full,
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: SkylearnColors.ink,
    marginTop: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: SkylearnColors.inkMuted,
    marginTop: 2,
  },
  iconButtonLogout: {
    width: 42,
    height: 42,
    borderRadius: SkylearnRadii.full,
    backgroundColor: SkylearnColors.coralSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: SkylearnColors.coral,
  },
  iconButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  statusChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    gap: 10,
    flexWrap: 'wrap',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: SkylearnRadii.full,
    gap: 6,
    borderWidth: 1,
  },
  statusBadgeActive: {
    backgroundColor: SkylearnColors.leafSoft,
    borderColor: SkylearnColors.leaf,
  },
  statusBadgeWarning: {
    backgroundColor: SkylearnColors.sunSoft,
    borderColor: SkylearnColors.sunBright,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  refreshChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SkylearnColors.surfaceElevated,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: SkylearnRadii.full,
    borderWidth: 1,
    borderColor: SkylearnColors.outline,
    gap: 6,
  },
  refreshChipPressed: {
    backgroundColor: SkylearnColors.surfaceSunken,
  },
  refreshChipText: {
    fontSize: 12,
    color: SkylearnColors.skyDeep,
    fontWeight: '600',
  },

  // KPIS
  kpiContainer: {
    flexDirection: 'row',
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
  kpiCardHighlight: {
    borderColor: SkylearnColors.leaf,
    backgroundColor: '#F7FCF9',
  },
  kpiIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: SkylearnRadii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '800',
    color: SkylearnColors.ink,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: SkylearnColors.inkMuted,
    marginTop: 4,
    textAlign: 'center',
  },

  // LECCIÓN CRÍTICA
  criticalCard: {
    backgroundColor: SkylearnColors.coralSoft,
    borderRadius: SkylearnRadii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: SkylearnColors.coral,
    marginBottom: 22,
    ...SkylearnShadows.card,
  },
  criticalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  criticalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDE8E8',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: SkylearnRadii.full,
    gap: 4,
  },
  criticalBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: SkylearnColors.coralDeep,
    letterSpacing: 0.6,
  },
  criticalRateText: {
    fontSize: 13,
    fontWeight: '800',
    color: SkylearnColors.coralDeep,
  },
  criticalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: SkylearnColors.ink,
  },
  criticalSubtitle: {
    fontSize: 13,
    color: SkylearnColors.inkMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  criticalAdviceBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: SkylearnColors.surfaceElevated,
    borderRadius: SkylearnRadii.sm,
    padding: 10,
    marginTop: 10,
    gap: 8,
  },
  criticalAdviceText: {
    flex: 1,
    fontSize: 12,
    color: SkylearnColors.inkMuted,
    lineHeight: 17,
  },

  // SECCIÓN DE CURSOS
  coursesSection: {
    backgroundColor: SkylearnColors.surfaceElevated,
    borderRadius: SkylearnRadii.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: SkylearnColors.outline,
    ...SkylearnShadows.card,
  },
  sectionHeaderRow: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: SkylearnColors.ink,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: SkylearnColors.inkMuted,
    marginTop: 2,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: SkylearnColors.surfaceSunken,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: SkylearnRadii.sm,
    marginBottom: 16,
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
    fontSize: 10,
    fontWeight: '700',
    color: SkylearnColors.inkMuted,
  },
  courseCard: {
    backgroundColor: SkylearnColors.surface,
    borderRadius: SkylearnRadii.md,
    padding: 14,
    borderWidth: 1,
    borderColor: SkylearnColors.outline,
    marginBottom: 12,
  },
  courseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  courseTitleWrapper: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: SkylearnColors.ink,
    lineHeight: 20,
  },
  courseStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: SkylearnRadii.full,
    gap: 4,
  },
  courseStatusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  courseMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 16,
  },
  courseMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  courseMetaText: {
    fontSize: 12,
    color: SkylearnColors.inkMuted,
    fontWeight: '600',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: SkylearnColors.surfaceSunken,
    borderRadius: SkylearnRadii.full,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: SkylearnRadii.full,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: SkylearnColors.ink,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: SkylearnColors.inkMuted,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
});
