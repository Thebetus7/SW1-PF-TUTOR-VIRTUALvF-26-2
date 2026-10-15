// frontend-web/src/components/HumanAvatarCanvas.tsx
import React, { useEffect, useRef } from 'react';
import type { AvatarPoseType, VisemeShape } from '../types/tutor.types';

interface HumanAvatarCanvasProps {
  pose: AvatarPoseType;
  viseme?: VisemeShape;
  isSpeaking?: boolean;
  isListening?: boolean;
  width?: number;
  height?: number;
}

export const HumanAvatarCanvas: React.FC<HumanAvatarCanvasProps> = ({
  pose = 'idle',
  viseme = 'sil',
  isSpeaking = false,
  isListening = false,
  width = 380,
  height = 340,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);
  const blinkTimerRef = useRef<number>(0);
  const isBlinkingRef = useRef<boolean>(false);
  const nextBlinkTimeRef = useRef<number>(2.5);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let startTime = performance.now();

    const render = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Manejo de parpadeo periódico natural
      blinkTimerRef.current += 0.016;
      if (blinkTimerRef.current > nextBlinkTimeRef.current) {
        isBlinkingRef.current = true;
        if (blinkTimerRef.current > nextBlinkTimeRef.current + 0.15) {
          isBlinkingRef.current = false;
          blinkTimerRef.current = 0;
          nextBlinkTimeRef.current = 2.0 + Math.random() * 2.5; // Entre 2 y 4.5 segundos
        }
      }

      const cx = canvas.width / 2;
      const cy = canvas.height * 0.44;

      // Respiración sutil y balanceo natural
      const breathY = Math.sin(elapsed * 1.8) * 2.2;
      const swayX = Math.sin(elapsed * 1.0) * 1.5;

      // Sombra ambiental suave
      const shadowGrad = ctx.createRadialGradient(cx, canvas.height - 25, 20, cx, canvas.height - 25, 110);
      shadowGrad.addColorStop(0, 'rgba(15, 23, 42, 0.12)');
      shadowGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.ellipse(cx, canvas.height - 25, 110, 18, 0, 0, Math.PI * 2);
      ctx.fill();

      // ==========================================
      // 1. TORSO Y ROPA DEL DOCENTE
      // ==========================================
      const shoulderY = cy + 90 + breathY;
      const chestGrad = ctx.createLinearGradient(cx - 90, shoulderY, cx + 90, canvas.height);
      chestGrad.addColorStop(0, '#1E40AF'); // Azul marino profesional
      chestGrad.addColorStop(1, '#0F172A');

      // Silueta del cuerpo / Torso
      ctx.beginPath();
      ctx.moveTo(cx - 45, shoulderY - 8);
      ctx.quadraticCurveTo(cx - 100, shoulderY + 10, cx - 105, canvas.height);
      ctx.lineTo(cx + 105, canvas.height);
      ctx.quadraticCurveTo(cx + 100, shoulderY + 10, cx + 45, shoulderY - 8);
      ctx.closePath();
      ctx.fillStyle = chestGrad;
      ctx.shadowColor = 'rgba(30, 64, 175, 0.25)';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Cuello de camisa blanca interior
      ctx.beginPath();
      ctx.moveTo(cx - 30, shoulderY - 6);
      ctx.lineTo(cx, shoulderY + 36);
      ctx.lineTo(cx + 30, shoulderY - 6);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      // Cuello en V del suéter
      ctx.beginPath();
      ctx.moveTo(cx - 24, shoulderY - 4);
      ctx.lineTo(cx, shoulderY + 28);
      ctx.lineTo(cx + 24, shoulderY - 4);
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Corbata / Detalle estilizado
      ctx.beginPath();
      ctx.moveTo(cx - 8, shoulderY + 10);
      ctx.lineTo(cx + 8, shoulderY + 10);
      ctx.lineTo(cx + 12, shoulderY + 68);
      ctx.lineTo(cx, shoulderY + 84);
      ctx.lineTo(cx - 12, shoulderY + 68);
      ctx.closePath();
      ctx.fillStyle = '#F59E0B'; // Acento amarillo ámbar Skylearn
      ctx.fill();

      // ==========================================
      // 2. CINEMÁTICA DE BRAZOS Y MANOS SEGÚN POSE
      // ==========================================
      const gesticulate = isSpeaking ? Math.sin(elapsed * 6) * 7 : 0;
      const listenTilt = isListening ? Math.sin(elapsed * 2) * 2 : 0;

      ctx.save();
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#1E40AF';

      if (pose === 'celebrating') {
        // Brazos arriba en celebración con pulgares arriba
        // Brazo Izquierdo
        ctx.beginPath();
        ctx.moveTo(cx - 85, shoulderY + 22);
        ctx.quadraticCurveTo(cx - 130, shoulderY - 20, cx - 110, shoulderY - 65 + breathY);
        ctx.stroke();

        // Mano izquierda (pulgar arriba)
        ctx.fillStyle = '#F8D7C4';
        ctx.beginPath();
        ctx.arc(cx - 110, shoulderY - 70 + breathY, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(cx - 114, shoulderY - 86 + breathY, 8, 16); // Pulgar arriba

        // Brazo Derecho
        ctx.beginPath();
        ctx.moveTo(cx + 85, shoulderY + 22);
        ctx.quadraticCurveTo(cx + 130, shoulderY - 20, cx + 110, shoulderY - 65 + breathY);
        ctx.stroke();

        // Mano derecha (pulgar arriba)
        ctx.fillStyle = '#F8D7C4';
        ctx.beginPath();
        ctx.arc(cx + 110, shoulderY - 70 + breathY, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(cx + 106, shoulderY - 86 + breathY, 8, 16);
      } else if (pose === 'listening') {
        // Brazo derecho en mentón (pose de atención / escucha activa)
        // Brazo Izquierdo en reposo
        ctx.beginPath();
        ctx.moveTo(cx - 85, shoulderY + 22);
        ctx.quadraticCurveTo(cx - 95, shoulderY + 80, cx - 60, canvas.height - 10);
        ctx.stroke();
        ctx.fillStyle = '#F8D7C4';
        ctx.beginPath();
        ctx.arc(cx - 60, canvas.height - 10, 11, 0, Math.PI * 2);
        ctx.fill();

        // Brazo Derecho flexionado hacia la barbilla
        ctx.beginPath();
        ctx.moveTo(cx + 85, shoulderY + 22);
        ctx.quadraticCurveTo(cx + 105, shoulderY + 60, cx + 45, cy + 42 + listenTilt);
        ctx.stroke();

        // Mano en el mentón
        ctx.fillStyle = '#F8D7C4';
        ctx.beginPath();
        ctx.arc(cx + 40, cy + 40 + listenTilt, 12, 0, Math.PI * 2);
        ctx.fill();
      } else if (pose === 'explaining' || isSpeaking) {
        // Gesticulación oratoria activa con mano derecha y mano izquierda relajada
        // Brazo Izquierdo relajado balanceándose levemente
        ctx.beginPath();
        ctx.moveTo(cx - 85, shoulderY + 22);
        ctx.quadraticCurveTo(cx - 100, shoulderY + 70, cx - 75, canvas.height - 15 + gesticulate * 0.4);
        ctx.stroke();
        ctx.fillStyle = '#F8D7C4';
        ctx.beginPath();
        ctx.arc(cx - 75, canvas.height - 15 + gesticulate * 0.4, 11, 0, Math.PI * 2);
        ctx.fill();

        // Brazo Derecho alzado en ademán explicativo
        ctx.beginPath();
        ctx.moveTo(cx + 85, shoulderY + 22);
        ctx.quadraticCurveTo(cx + 115, shoulderY + 40, cx + 95, shoulderY - 15 + gesticulate);
        ctx.stroke();

        // Mano derecha abierta explicativa
        ctx.fillStyle = '#F8D7C4';
        ctx.beginPath();
        ctx.arc(cx + 95, shoulderY - 20 + gesticulate, 13, 0, Math.PI * 2);
        ctx.fill();
        // Dedos abiertos
        ctx.beginPath();
        ctx.arc(cx + 104, shoulderY - 28 + gesticulate, 4, 0, Math.PI * 2);
        ctx.arc(cx + 98, shoulderY - 32 + gesticulate, 4, 0, Math.PI * 2);
        ctx.arc(cx + 90, shoulderY - 32 + gesticulate, 4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Postura 'idle' o 'encouraging' (Brazos relajados naturales)
        ctx.beginPath();
        ctx.moveTo(cx - 85, shoulderY + 22);
        ctx.quadraticCurveTo(cx - 100, shoulderY + 70, cx - 70, canvas.height - 15);
        ctx.stroke();
        ctx.fillStyle = '#F8D7C4';
        ctx.beginPath();
        ctx.arc(cx - 70, canvas.height - 15, 11, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(cx + 85, shoulderY + 22);
        ctx.quadraticCurveTo(cx + 100, shoulderY + 70, cx + 70, canvas.height - 15);
        ctx.stroke();
        ctx.fillStyle = '#F8D7C4';
        ctx.beginPath();
        ctx.arc(cx + 70, canvas.height - 15, 11, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // ==========================================
      // 3. CUELLO Y CABEZA
      // ==========================================
      const headY = cy + breathY;
      const headX = cx + swayX;

      // Cuello
      ctx.fillStyle = '#E8BBA5';
      ctx.fillRect(headX - 18, headY + 38, 36, 42);

      // Sombra bajo la barbilla
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.beginPath();
      ctx.arc(headX, headY + 46, 24, 0, Math.PI);
      ctx.fill();

      // Rostro (Forma ovalada estilizada)
      const faceGrad = ctx.createRadialGradient(headX, headY - 10, 20, headX, headY, 68);
      faceGrad.addColorStop(0, '#FFE3D3');
      faceGrad.addColorStop(1, '#F8D7C4');

      ctx.beginPath();
      ctx.ellipse(headX, headY, 52, 60, 0, 0, Math.PI * 2);
      ctx.fillStyle = faceGrad;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Orejas
      ctx.fillStyle = '#F4CBB5';
      ctx.beginPath();
      ctx.arc(headX - 52, headY + 4, 11, 0, Math.PI * 2);
      ctx.arc(headX + 52, headY + 4, 11, 0, Math.PI * 2);
      ctx.fill();

      // ==========================================
      // 4. CABELLO PROFESIONAL MODERNO
      // ==========================================
      ctx.fillStyle = '#2D3748'; // Castaño oscuro elegante
      ctx.beginPath();
      ctx.arc(headX, headY - 14, 55, Math.PI * 0.8, Math.PI * 2.2);
      ctx.quadraticCurveTo(headX + 56, headY - 35, headX + 42, headY - 58);
      ctx.quadraticCurveTo(headX, headY - 72, headX - 44, headY - 56);
      ctx.quadraticCurveTo(headX - 56, headY - 25, headX - 52, headY - 8);
      ctx.closePath();
      ctx.fill();

      // Mechón de flequillo frontal peinado
      ctx.beginPath();
      ctx.moveTo(headX - 40, headY - 45);
      ctx.quadraticCurveTo(headX - 10, headY - 30, headX + 25, headY - 42);
      ctx.quadraticCurveTo(headX, headY - 56, headX - 40, headY - 45);
      ctx.fillStyle = '#1A202C';
      ctx.fill();

      // ==========================================
      // 5. CEJAS Y OJOS EXPRESIVOS
      // ==========================================
      // Cejas expresivas
      ctx.strokeStyle = '#2D3748';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';

      let browTilt = 0;
      if (pose === 'celebrating') browTilt = -3;
      if (pose === 'listening') browTilt = 2;

      // Ceja Izquierda
      ctx.beginPath();
      ctx.moveTo(headX - 34, headY - 18 + browTilt);
      ctx.quadraticCurveTo(headX - 22, headY - 24 + browTilt, headX - 10, headY - 19);
      ctx.stroke();

      // Ceja Derecha
      ctx.beginPath();
      ctx.moveTo(headX + 10, headY - 19);
      ctx.quadraticCurveTo(headX + 22, headY - 24 - browTilt, headX + 34, headY - 18 - browTilt);
      ctx.stroke();

      // Ojos (con parpadeo periódico natural)
      if (isBlinkingRef.current) {
        // Pestañas cerradas
        ctx.strokeStyle = '#1F2937';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(headX - 32, headY - 4);
        ctx.quadraticCurveTo(headX - 22, headY, headX - 12, headY - 4);
        ctx.moveTo(headX + 12, headY - 4);
        ctx.quadraticCurveTo(headX + 22, headY, headX + 32, headY - 4);
        ctx.stroke();
      } else {
        // Ojos abiertos y expresivos
        // Globo ocular blanco
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(headX - 22, headY - 4, 11, 7.5, 0, 0, Math.PI * 2);
        ctx.ellipse(headX + 22, headY - 4, 11, 7.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#1F2937';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Iris castaño / avellana cálido
        ctx.fillStyle = '#3B82F6'; // Azul inteligente Skylearn
        ctx.beginPath();
        ctx.arc(headX - 22, headY - 4, 5.5, 0, Math.PI * 2);
        ctx.arc(headX + 22, headY - 4, 5.5, 0, Math.PI * 2);
        ctx.fill();

        // Pupila negra
        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        ctx.arc(headX - 22, headY - 4, 3, 0, Math.PI * 2);
        ctx.arc(headX + 22, headY - 4, 3, 0, Math.PI * 2);
        ctx.fill();

        // Brillo blanco en ojos
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(headX - 20, headY - 6, 2, 0, Math.PI * 2);
        ctx.arc(headX + 24, headY - 6, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Nariz sutil estilizada
      ctx.strokeStyle = '#D99B82';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(headX, headY - 6);
      ctx.lineTo(headX + 2, headY + 12);
      ctx.lineTo(headX - 4, headY + 14);
      ctx.stroke();

      // Mejillas saludables
      ctx.fillStyle = 'rgba(244, 114, 182, 0.22)';
      ctx.beginPath();
      ctx.arc(headX - 32, headY + 14, 9, 0, Math.PI * 2);
      ctx.arc(headX + 32, headY + 14, 9, 0, Math.PI * 2);
      ctx.fill();

      // ==========================================
      // 6. BOCA Y SINCRONIZACIÓN CON VISEMAS
      // ==========================================
      const mouthY = headY + 28;
      ctx.fillStyle = '#B91C1C';
      ctx.strokeStyle = '#991B1B';
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      switch (viseme) {
        case 'aa':
          // Boca abierta amplia
          ctx.ellipse(headX, mouthY + 2, 12, 11, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          // Dientes superiores visibles
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(headX - 8, mouthY - 7, 16, 5);
          break;

        case 'oh':
        case 'ou':
          // Boca redondeada hacia adelante
          ctx.ellipse(headX, mouthY + 2, 8, 9, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          break;

        case 'E':
        case 'ih':
          // Boca ancha abierta media
          ctx.ellipse(headX, mouthY + 1, 14, 6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(headX - 10, mouthY - 4, 20, 3);
          break;

        case 'sil':
        default:
          // Sonrisa suave amigable
          ctx.beginPath();
          ctx.arc(headX, mouthY - 4, 14, 0.25, Math.PI - 0.25);
          ctx.stroke();
          break;
      }

      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [pose, viseme, isSpeaking, isListening]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          display: 'block',
          borderRadius: '16px',
          background: 'radial-gradient(circle at 50% 30%, #F1F5F9 0%, #E2E8F0 100%)',
          boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.06)',
        }}
      />
    </div>
  );
};
