// frontend-mobile/App.tsx
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, SafeAreaView, ScrollView } from 'react-native';
import { SkylearnColors, SkylearnRadii, SkylearnShadows } from './src/theme/skylearn';
import { registerForPushNotificationsAsync } from './src/services/notifications';

export default function App() {
  const [kpis] = useState({
    totalCourses: 5,
    totalStudents: 142,
    overallPassRatePercentage: 88.5,
  });

  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Cabecera Skylearn Docente */}
        <View style={styles.header}>
          <Text style={styles.headerBadge}>PANEL DOCENTE</Text>
          <Text style={styles.headerTitle}>Skylearn Docente</Text>
          <Text style={styles.headerSubtitle}>Supervisión académica y alertas push en tiempo real</Text>
        </View>

        {/* 3 KPIs Principales */}
        <View style={styles.kpiContainer}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{kpis.totalCourses}</Text>
            <Text style={styles.kpiLabel}>Cursos</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{kpis.totalStudents}</Text>
            <Text style={styles.kpiLabel}>Estudiantes</Text>
          </View>
          <View style={[styles.kpiCard, { borderColor: SkylearnColors.leaf }]}>
            <Text style={[styles.kpiValue, { color: SkylearnColors.leafDeep }]}>
              {kpis.overallPassRatePercentage}%
            </Text>
            <Text style={styles.kpiLabel}>Aprobación</Text>
          </View>
        </View>

        {/* Semáforo de salud pedagógica preview */}
        <View style={styles.statusSection}>
          <Text style={styles.sectionTitle}>Salud Pedagógica (Semáforo)</Text>
          <View style={styles.courseItem}>
            <View style={[styles.statusDot, { backgroundColor: SkylearnColors.leaf }]} />
            <View style={styles.courseInfo}>
              <Text style={styles.courseTitle}>Fundamentos de Programación</Text>
              <Text style={styles.courseStats}>84 alumnos • 92% Aprobación</Text>
            </View>
          </View>
          <View style={styles.courseItem}>
            <View style={[styles.statusDot, { backgroundColor: SkylearnColors.coral }]} />
            <View style={styles.courseInfo}>
              <Text style={styles.courseTitle}>Estructuras de Datos y Algoritmos</Text>
              <Text style={styles.courseStats}>58 alumnos • Lección Crítica: Árboles AVL</Text>
            </View>
          </View>
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
