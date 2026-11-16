// frontend-mobile/App.tsx
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TextInput, Button, AppState } from 'react-native';
import axios from 'axios';
import * as Notifications from 'expo-notifications';
import { SkylearnColors, SkylearnRadii, SkylearnShadows } from './src/theme/skylearn';
import { BACKEND_URL, registerForPushNotificationsAsync } from './src/services/notifications';

interface Dashboard {
  kpis: { activeStudentsCount: number; averagePassRate: number | null; totalCompletions: number };
  courses: { id: string; title: string; studentsCount: number; passRate: number | null; trafficLight: 'leaf' | 'sun' | 'coral' | null }[];
  criticalLesson: { lessonTitle: string; courseTitle: string; passRate: number } | null;
}

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [error, setError] = useState('');
  const [pushStatus, setPushStatus] = useState('');
  const [pushToken, setPushToken] = useState<string | null>(null);

  const refresh = async (session: string) => {
    try {
      const result = await axios.get<Dashboard>(`${BACKEND_URL}/teacher/dashboard`, { headers: { Authorization: `Bearer ${session}` } });
      setDashboard(result.data);
      setError('');
    } catch {
      setError('No se pudo actualizar el panel. Comprueba la conexión o inicia sesión de nuevo.');
    }
  };

  const login = async () => {
    try {
      const result = await axios.post<{ accessToken: string; user: { role: string } }>(`${BACKEND_URL}/auth/login`, { email, password });
      if (result.data.user.role !== 'TEACHER') { setError('Esta aplicación es para docentes.'); return; }
      setPassword('');
      setToken(result.data.accessToken);
      setError('');
    } catch { setError('No se pudo iniciar sesión. Verifica tus datos y la conexión.'); }
  };

  useEffect(() => {
    if (!token) return;
    void refresh(token);
    void registerForPushNotificationsAsync(token).then((registered) => { setPushToken(registered); setPushStatus(registered ? 'Notificaciones activadas' : 'Notificaciones no disponibles: revisa permisos y configuración.'); }).catch(() => setPushStatus('No se pudieron activar las notificaciones.'));
    const received = Notifications.addNotificationReceivedListener(() => { void refresh(token); });
    const response = Notifications.addNotificationResponseReceivedListener(() => { void refresh(token); });
    const state = AppState.addEventListener('change', (next) => { if (next === 'active') void refresh(token); });
    const interval = setInterval(() => { void refresh(token); }, 30000);
    return () => { received.remove(); response.remove(); state.remove(); clearInterval(interval); };
  }, [token]);

  if (!token) return (
    <SafeAreaView style={styles.safeArea}><View style={styles.container}>
      <Text style={styles.headerTitle}>Skylearn Docente</Text>
      <Text style={styles.headerSubtitle}>Inicia sesión para consultar tus cursos</Text>
      <TextInput accessibilityLabel="Correo electrónico" placeholder="Correo electrónico" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={styles.input} />
      <TextInput accessibilityLabel="Contraseña" placeholder="Contraseña" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />
      {error ? <Text accessibilityRole="alert">{error}</Text> : null}
      <Button title="Ingresar" onPress={login} />
    </View></SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Cabecera Skylearn Docente */}
        <View style={styles.header}>
          <Text style={styles.headerBadge}>PANEL DOCENTE</Text>
          <Text style={styles.headerTitle}>Skylearn Docente</Text>
          <Text style={styles.headerSubtitle}>Supervisión académica y alertas push en tiempo real</Text>
          <Text>{pushStatus}</Text>
          {error ? <Text accessibilityRole="alert">{error}</Text> : null}
          <Button title="Actualizar" onPress={() => void refresh(token)} />
          <Button title="Cerrar sesión" onPress={async () => {
            if (pushToken) {
              try { await axios.delete(`${BACKEND_URL}/teacher/device-token`, { headers: { Authorization: `Bearer ${token}` }, data: { pushToken } }); }
              catch { setError('No se pudo desconectar el dispositivo. Comprueba la conexión e inténtalo de nuevo.'); return; }
            }
            setToken(''); setPushToken(null); setDashboard(null);
          }} />
        </View>

        {/* 3 KPIs Principales */}
        <View style={styles.kpiContainer}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{dashboard?.kpis.activeStudentsCount ?? '—'}</Text>
            <Text style={styles.kpiLabel}>Estudiantes</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{dashboard?.kpis.totalCompletions ?? '—'}</Text>
            <Text style={styles.kpiLabel}>Completadas</Text>
          </View>
          <View style={[styles.kpiCard, { borderColor: SkylearnColors.leaf }]}>
            <Text style={[styles.kpiValue, { color: SkylearnColors.leafDeep }]}>
              {dashboard?.kpis.averagePassRate == null ? '—' : `${dashboard.kpis.averagePassRate}%`}
            </Text>
            <Text style={styles.kpiLabel}>Aprobación</Text>
          </View>
        </View>

        {/* Semáforo de salud pedagógica preview */}
        <View style={styles.statusSection}>
          <Text style={styles.sectionTitle}>Salud Pedagógica (Semáforo)</Text>
          {dashboard?.courses.map((course) => <View style={styles.courseItem} key={course.id}>
            <View style={[styles.statusDot, { backgroundColor: course.trafficLight ? SkylearnColors[course.trafficLight] : SkylearnColors.inkSubtle }]} />
            <View style={styles.courseInfo}><Text style={styles.courseTitle}>{course.title}</Text>
              <Text style={styles.courseStats}>{course.studentsCount} estudiantes • {course.passRate === null ? 'Sin evaluaciones' : `${course.passRate}% aprobación`}</Text></View>
          </View>)}
          {dashboard && dashboard.courses.length === 0 ? <Text>Aún no tienes cursos.</Text> : null}
          {dashboard?.criticalLesson ? <Text style={styles.courseStats}>Lección con menor aprobación: {dashboard.criticalLesson.lessonTitle} ({dashboard.criticalLesson.courseTitle}, {Math.round(dashboard.criticalLesson.passRate)}%)</Text> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderColor: SkylearnColors.outline, padding: 12, marginVertical: 10, borderRadius: 8 },
  safeArea: {
    flex: 1,
    backgroundColor: SkylearnColors.surface,
  },
  container: {
    padding: 20,
    paddingTop: 40,
  },
  header: {
    marginBottom: 24,
  },
  headerBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: SkylearnColors.skyDeep,
    letterSpacing: 1,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: SkylearnColors.ink,
  },
  headerSubtitle: {
    fontSize: 15,
    color: SkylearnColors.inkMuted,
    marginTop: 4,
  },
  kpiContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 28,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: SkylearnColors.surfaceElevated,
    borderRadius: SkylearnRadii.lg,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: SkylearnColors.outline,
    ...SkylearnShadows.card,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '800',
    color: SkylearnColors.skyDeep,
  },
  kpiLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: SkylearnColors.inkMuted,
    marginTop: 4,
  },
  statusSection: {
    backgroundColor: SkylearnColors.surfaceElevated,
    borderRadius: SkylearnRadii.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: SkylearnColors.outline,
    ...SkylearnShadows.card,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: SkylearnColors.ink,
    marginBottom: 16,
  },
  courseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: SkylearnColors.outline,
    gap: 12,
  },
  statusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  courseInfo: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: SkylearnColors.ink,
  },
  courseStats: {
    fontSize: 13,
    color: SkylearnColors.inkMuted,
    marginTop: 2,
  },
});
