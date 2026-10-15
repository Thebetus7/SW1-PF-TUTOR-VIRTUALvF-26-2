// frontend-web/src/components/CollectedContextModal.tsx
import React from 'react';
import { X, Sparkles, BookOpen, Layers, CheckCircle2, ShieldCheck } from 'lucide-react';
import type { ModuleEvaluationContext } from '../types/tutor.types';

interface CollectedContextModalProps {
  contextData: ModuleEvaluationContext | null;
  onClose: () => void;
  onStartEvaluation?: () => void;
}

export const CollectedContextModal: React.FC<CollectedContextModalProps> = ({
  contextData,
  onClose,
  onStartEvaluation,
}) => {
  if (!contextData) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div
        style={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header del Modal */}
        <div style={styles.header}>
          <div style={styles.headerTitleBox}>
            <div style={styles.iconCircle}>
              <Sparkles size={20} color="var(--color-sun, #F59E0B)" />
            </div>
            <div>
              <h3 style={styles.title}>Auditoría de Datos Recopilados</h3>
              <p style={styles.subtitle}>
                Información del curso que nutre el contexto del Docente Virtual para la evaluación
              </p>
            </div>
          </div>
          <button onClick={onClose} style={styles.closeBtn} aria-label="Cerrar modal">
            <X size={20} />
          </button>
        </div>

        {/* Resumen del Módulo */}
        <div style={styles.metaBanner}>
          <div style={styles.metaItem}>
            <Layers size={16} color="#3B82F6" />
            <span><strong>Módulo:</strong> {contextData.moduleTitle}</span>
          </div>
          <div style={styles.metaItem}>
            <BookOpen size={16} color="#10B981" />
            <span><strong>Total Lecciones:</strong> {contextData.totalLessons}</span>
          </div>
          <div style={styles.metaItem}>
            <ShieldCheck size={16} color="#8B5CF6" />
            <span style={{ color: '#047857', fontWeight: 600 }}>Costo: 0 Créditos (Modo Demo)</span>
          </div>
        </div>

        {/* Lista de Lecciones y Contenido Analizado */}
        <div style={styles.body}>
          <h4 style={styles.sectionHeading}>
            Lecciones y Contexto Pedagógico Extraído por la IA:
          </h4>

          {contextData.lessons.length === 0 ? (
            <div style={styles.emptyNotice}>
              Este módulo no tiene lecciones publicadas aún.
            </div>
          ) : (
            <div style={styles.lessonsContainer}>
              {contextData.lessons.map((lesson, idx) => (
                <div key={lesson.id} style={styles.lessonCard}>
                  <div style={styles.lessonHeader}>
                    <span style={styles.badgeIndex}>Lección {idx + 1}</span>
                    <h5 style={styles.lessonTitle}>{lesson.title}</h5>
                  </div>
                  <div style={styles.contextBox}>
                    <span style={styles.contextLabel}>Contexto Pedagógico (`contextText`):</span>
                    <p style={styles.contextText}>
                      {lesson.contextText || 'No se ingresó variable de contexto específica. La IA utilizará los conceptos del título.'}
                    </p>
                  </div>
                  <div style={styles.targetRow}>
                    <CheckCircle2 size={14} color="#10B981" />
                    <span style={styles.targetText}>
                      Generará 1 pregunta evaluativa oral sobre los conceptos clave de esta lección.
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer de Acciones */}
        <div style={styles.footer}>
          <button onClick={onClose} className="btn-secondary" style={styles.footerBtnClose}>
            Cerrar Detalles
          </button>
          {onStartEvaluation && (
            <button
              onClick={() => {
                onClose();
                onStartEvaluation();
              }}
              className="btn-primary"
              style={styles.footerBtnStart}
            >
              <Sparkles size={16} />
              <span>Iniciar Evaluación con Docente Virtual</span>
            </button>
          )}
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
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: '18px',
    maxWidth: '680px',
    width: '100%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px',
    borderBottom: '1px solid #E2E8F0',
  },
  headerTitleBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  iconCircle: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: '#FEF3C7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: '18px',
    fontWeight: 800,
    color: '#0F172A',
    margin: 0,
  },
  subtitle: {
    fontSize: '13px',
    color: '#64748B',
    margin: '3px 0 0 0',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#64748B',
    padding: '6px',
    borderRadius: '8px',
  },
  metaBanner: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    padding: '12px 24px',
    backgroundColor: '#F8FAFC',
    borderBottom: '1px solid #E2E8F0',
    fontSize: '13px',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#334155',
  },
  body: {
    padding: '20px 24px',
    overflowY: 'auto',
    flex: 1,
  },
  sectionHeading: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#334155',
    marginBottom: '14px',
  },
  emptyNotice: {
    padding: '24px',
    textAlign: 'center',
    color: '#64748B',
  },
  lessonsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  lessonCard: {
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '14px 16px',
    backgroundColor: '#FFFFFF',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  lessonHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '8px',
  },
  badgeIndex: {
    fontSize: '11px',
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: '6px',
    backgroundColor: '#EFF6FF',
    color: '#2563EB',
  },
  lessonTitle: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#1E293B',
    margin: 0,
  },
  contextBox: {
    backgroundColor: '#F8FAFC',
    border: '1px dashed #CBD5E1',
    borderRadius: '8px',
    padding: '10px 12px',
    margin: '6px 0 10px 0',
  },
  contextLabel: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#475569',
    textTransform: 'uppercase',
    display: 'block',
    marginBottom: '4px',
  },
  contextText: {
    fontSize: '13px',
    color: '#334155',
    lineHeight: '1.4',
    margin: 0,
  },
  targetRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#059669',
    fontWeight: 500,
  },
  targetText: {
    fontSize: '12px',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 24px',
    borderTop: '1px solid #E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  footerBtnClose: {
    padding: '8px 18px',
    fontSize: '14px',
  },
  footerBtnStart: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 20px',
    fontSize: '14px',
  },
};
