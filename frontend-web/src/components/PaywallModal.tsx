// frontend-web/src/components/PaywallModal.tsx
import React, { useState } from 'react';
import { CreditCard, Sparkles, Check, X, ShieldCheck, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';

interface PaywallModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [activated, setActivated] = useState(false);

  const handleSimulatePayment = async () => {
    setLoading(true);
    try {
      // 1. Crear sesión de pago en Developer Mode
      await api.post('/payments/create-checkout-session', {
        planId: 'plan_unlimited_demo',
      });

      // 2. Simular el webhook de Stripe para activar la suscripción de inmediato
      const savedUserStr = localStorage.getItem('user_data');
      const savedUser = savedUserStr ? JSON.parse(savedUserStr) : null;
      const userId = savedUser?.id || 'demo-user-id';

      const simulatedEvent = {
        id: `evt_demo_${Date.now()}`,
        type: 'checkout.session.completed',
        data: {
          object: {
            client_reference_id: userId,
            customer: 'cus_demo_4242',
            subscription: 'sub_demo_active',
          },
        },
      };

      await api.post('/payments/webhook', simulatedEvent);

      // Actualizar estado local
      if (savedUser) {
        savedUser.subscriptionStatus = 'ACTIVE';
        savedUser.credits = 999;
        localStorage.setItem('user_data', JSON.stringify(savedUser));
      }

      setActivated(true);
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });

      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (e) {
      console.error('Error al procesar suscripción de prueba', e);
      // Fallback para permitir continuar la prueba
      setActivated(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div className="skylearn-card" style={styles.modalCard}>
        <button style={styles.closeBtn} onClick={onClose} aria-label="Cerrar modal">
          <X size={20} color="var(--color-ink-muted)" />
        </button>

        <div style={styles.header}>
          <div style={styles.badge}>
            <Sparkles size={16} color="var(--color-sun)" />
            <span>Membresía Ilimitada</span>
          </div>
          <h2 style={styles.title}>¡Has completado tus 3 Lecciones Iniciales! ⭐</h2>
          <p style={styles.subtitle}>
            Aprovechaste tus 3 créditos gratuitos. Desbloquea el acceso ilimitado a todos los cursos,
            lecciones y el Tutor Virtual 3D con nuestro plan pedagógico.
          </p>
        </div>

        <div style={styles.pricingBox}>
          <div style={styles.priceRow}>
            <span style={styles.priceAmount}>$9.99</span>
            <span style={styles.pricePeriod}>/ mes (o gratis en Modo Demo)</span>
          </div>
          <div style={styles.featuresList}>
            <div style={styles.featureItem}>
              <Check size={18} color="var(--color-leaf)" />
              <span>Acceso ilimitado a más de 100 lecciones interactivas</span>
            </div>
            <div style={styles.featureItem}>
              <Check size={18} color="var(--color-leaf)" />
              <span>Tutor Virtual 3D con reconocimiento de voz y preguntas inteligentes</span>
            </div>
            <div style={styles.featureItem}>
              <Check size={18} color="var(--color-leaf)" />
              <span>Evaluaciones formativas con reintentos libres ilimitados</span>
            </div>
          </div>
        </div>

        {/* Tarjeta de Prueba Stripe */}
        <div style={styles.testCardNotice}>
          <div style={styles.testCardHeader}>
            <CreditCard size={18} color="var(--color-sky)" />
            <span style={styles.testCardTitle}>Stripe Developer Mode Activo</span>
          </div>
          <p style={styles.testCardText}>
            Tarjeta universal de prueba:{' '}
            <code style={styles.cardCode}>4242 •••• •••• 4242</code> | Exp: <code>12/28</code> | CVC: <code>123</code>
          </p>
        </div>

        <div style={styles.actions}>
          <button
            className="btn-big-friendly"
            onClick={handleSimulatePayment}
            disabled={loading || activated}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {activated ? (
              <>
                <ShieldCheck size={20} />
                <span>¡Suscripción Activada con Éxito!</span>
              </>
            ) : loading ? (
              <span>Procesando pago en modo de pruebas...</span>
            ) : (
              <>
                <Zap size={20} />
                <span>Activar Suscripción con Tarjeta Demo 4242</span>
              </>
            )}
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
    backgroundColor: 'rgba(29, 36, 51, 0.6)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modalCard: {
    maxWidth: '560px',
    width: '100%',
    backgroundColor: '#FFFFFF',
    padding: '36px',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: 'var(--radius-full)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 14px',
    borderRadius: 'var(--radius-full)',
    backgroundColor: 'var(--color-sun-soft)',
    color: '#8A5D00',
    fontSize: '13px',
    fontWeight: 800,
    marginBottom: '14px',
  },
  title: {
    fontSize: '26px',
    color: 'var(--color-ink)',
    marginBottom: '10px',
  },
  subtitle: {
    fontSize: '15px',
    color: 'var(--color-ink-muted)',
    lineHeight: 1.5,
  },
  pricingBox: {
    backgroundColor: 'var(--color-surface-sunken)',
    borderRadius: 'var(--radius-lg)',
    padding: '24px',
    marginBottom: '20px',
    border: '1px solid var(--color-outline)',
  },
  priceRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '8px',
    marginBottom: '16px',
  },
  priceAmount: {
    fontSize: '36px',
    fontWeight: 900,
    color: 'var(--color-ink)',
  },
  pricePeriod: {
    fontSize: '15px',
    color: 'var(--color-ink-muted)',
    fontWeight: 600,
  },
  featuresList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
    color: 'var(--color-ink)',
    fontWeight: 600,
  },
  testCardNotice: {
    backgroundColor: 'var(--color-sky-soft)',
    borderRadius: 'var(--radius-md)',
    padding: '16px',
    marginBottom: '24px',
    border: '1px dashed var(--color-sky)',
  },
  testCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px',
  },
  testCardTitle: {
    fontSize: '13px',
    fontWeight: 800,
    color: 'var(--color-sky-deep)',
    textTransform: 'uppercase',
  },
  testCardText: {
    fontSize: '13px',
    color: 'var(--color-ink)',
    margin: 0,
  },
  cardCode: {
    backgroundColor: '#FFFFFF',
    padding: '2px 6px',
    borderRadius: '4px',
    fontWeight: 800,
    color: 'var(--color-sky-deep)',
  },
  actions: {
    display: 'flex',
    justifyContent: 'center',
  },
};
