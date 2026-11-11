// frontend-web/src/components/TutorAvatar3D.tsx
//
// Docente virtual 3D renderizado en tiempo real con WebGL (three.js).
// Personaje procedural: no requiere assets .glb/.vrm ni descargas externas,
// de modo que el avatar viaja con el bundle y funciona offline.
//
// Contrato público (idéntico al que consumían los hosts de la versión anterior):
//   pose        -> postura corporal del docente
//   viseme      -> forma de la boca sincronizada con la pista de voz del backend
//   isSpeaking  -> activa la gesticulación oratoria
//   isListening -> inclinación de escucha atenta
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { AvatarPoseType, VisemeShape } from '../types/tutor.types';

export interface TutorAvatar3DProps {
  pose?: AvatarPoseType;
  viseme?: VisemeShape;
  isSpeaking?: boolean;
  isListening?: boolean;
  width?: number;
  height?: number;
}

// ---------------------------------------------------------------------------
// Paleta Skylearn traducida a materiales PBR
// ---------------------------------------------------------------------------
const PALETTE = {
  skin: 0xf3c3a3,
  skinWarm: 0xe0a183,
  blush: 0xf4a3a3,
  hair: 0x2b3546,
  suit: 0x1d4ed8,
  shirt: 0xffffff,
  accent: 0xfbbf24,
  eyeWhite: 0xf8fafc,
  iris: 0x1d4ed8,
  pupil: 0x0f172a,
  mouth: 0x8c3f43,
  lipLine: 0x6d2f33,
  pedestal: 0xffffff,
  pedestalRing: 0xdbeafe,
} as const;

// ---------------------------------------------------------------------------
// Canon de proporciones (unidades de escena, personaje = 0.93 de alto)
// ---------------------------------------------------------------------------
const HEAD_R = 0.13;
const HEAD_CENTER_Y = 0.78;
const NECK_PIVOT_Y = 0.63;
const SHOULDER_X = 0.214;
const SHOULDER_Y = 0.532;

// ---------------------------------------------------------------------------
// Datos de animación
// ---------------------------------------------------------------------------
interface ArmTarget {
  x: number;
  y: number;
  z: number;
}

interface PoseTarget {
  shoulderR: ArmTarget;
  elbowR: number;
  shoulderL: ArmTarget;
  elbowL: number;
  head: ArmTarget;
  gesture: number;
}

/**
 * Signos de rotación (three.js: +x derecha, +y arriba, +z hacia cámara):
 * - Hombro z positivo  -> eleva el brazo derecho hacia fuera; negativo el izquierdo.
 * - Hombro x negativo  -> adelanta el brazo hacia el frente.
 * - Codo x negativo    -> flexiona el antebrazo hacia el frente (mano al mentón ≈ -2.0).
 */
const POSES: Record<AvatarPoseType, PoseTarget> = {
  idle: {
    shoulderR: { x: 0.04, y: 0, z: 0.16 },
    elbowR: -0.22,
    shoulderL: { x: 0.04, y: 0, z: -0.16 },
    elbowL: -0.22,
    head: { x: 0, y: 0, z: 0 },
    gesture: 0,
  },
  explaining: {
    shoulderR: { x: -0.62, y: 0, z: 0.42 },
    elbowR: -0.8,
    shoulderL: { x: -0.1, y: 0, z: -0.17 },
    elbowL: -0.32,
    head: { x: -0.03, y: 0.05, z: 0 },
    gesture: 1,
  },
  listening: {
    shoulderR: { x: -1.25, y: 0, z: 0.12 },
    elbowR: -2.35,
    shoulderL: { x: 0.05, y: 0, z: -0.15 },
    elbowL: -0.26,
    head: { x: 0.02, y: -0.06, z: 0.08 },
    gesture: 0,
  },
  celebrating: {
    shoulderR: { x: -0.15, y: 0, z: 2.45 },
    elbowR: -0.32,
    shoulderL: { x: -0.15, y: 0, z: -2.45 },
    elbowL: -0.32,
    head: { x: -0.14, y: 0, z: 0 },
    gesture: 0.35,
  },
  encouraging: {
    shoulderR: { x: -0.45, y: 0.08, z: 0.55 },
    elbowR: -0.95,
    shoulderL: { x: -0.45, y: -0.08, z: -0.55 },
    elbowL: -0.95,
    head: { x: 0.06, y: 0, z: 0 },
    gesture: 0.35,
  },
};

/** Escala de la boca abierta y peso de la sonrisa por visema. */
const VISEMES: Record<VisemeShape, { open: [number, number, number]; smile: number }> = {
  sil: { open: [0.001, 0.001, 0.001], smile: 1 },
  aa: { open: [1.15, 1.35, 0.62], smile: 0 },
  E: { open: [1.42, 0.66, 0.55], smile: 0 },
  ih: { open: [1.16, 0.5, 0.5], smile: 0 },
  oh: { open: [0.62, 1.18, 0.8], smile: 0 },
  ou: { open: [0.46, 0.98, 0.9], smile: 0 },
};

interface Rig {
  figure: THREE.Group;
  headPivot: THREE.Group;
  eyeR: THREE.Group;
  eyeL: THREE.Group;
  browR: THREE.Mesh;
  browL: THREE.Mesh;
  mouthOpen: THREE.Mesh;
  mouthSmile: THREE.Mesh;
  shoulderR: THREE.Group;
  elbowR: THREE.Group;
  shoulderL: THREE.Group;
  elbowL: THREE.Group;
}

interface Stage {
  rig: Rig;
  camera: THREE.PerspectiveCamera;
  start: (tick: () => void) => void;
  stop: () => void;
  render: () => void;
  dispose: () => void;
}

// ---------------------------------------------------------------------------
// Construcción de la escena
// ---------------------------------------------------------------------------
function makeMaterial(
  color: number,
  roughness: number,
  metalness = 0.02,
  side: THREE.Side = THREE.FrontSide,
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, side });
}

/** Perfil torneado del torso: hombros como eje más ancho, cintura recogida. */
const TORSO_PROFILE: ReadonlyArray<readonly [number, number]> = [
  [0.155, 0.12],
  [0.175, 0.2],
  [0.19, 0.3],
  [0.197, 0.4],
  [0.203, 0.48],
  [0.212, 0.535],
  [0.198, 0.568],
  [0.15, 0.6],
  [0.095, 0.635],
  [0.075, 0.655],
];

/** Radio del torso interpolado desde el perfil torneado. */
function torsoRadiusAt(y: number): number {
  const profile = TORSO_PROFILE;
  if (y <= profile[0][1]) return profile[0][0];
  for (let i = 1; i < profile.length; i += 1) {
    if (y <= profile[i][1]) {
      const [r0, y0] = profile[i - 1];
      const [r1, y1] = profile[i];
      return r0 + ((r1 - r0) * (y - y0)) / (y1 - y0);
    }
  }
  return profile[profile.length - 1][0];
}

/**
 * Panel de camisa en V: anillos de ancho angular creciente que siguen el torso.
 * Se construye a mano porque LatheGeometry solo admite un ancho constante.
 */
function buildShirtPanel(): THREE.BufferGeometry {
  const rings: Array<{ y: number; halfPhi: number }> = [
    { y: 0.4, halfPhi: 0.05 },
    { y: 0.45, halfPhi: 0.075 },
    { y: 0.5, halfPhi: 0.1 },
    { y: 0.54, halfPhi: 0.13 },
    { y: 0.58, halfPhi: 0.17 },
    { y: 0.62, halfPhi: 0.22 },
    { y: 0.655, halfPhi: 0.26 },
  ];
  const segments = 12;
  const positions: number[] = [];
  const indices: number[] = [];

  rings.forEach((ring) => {
    const radius = torsoRadiusAt(ring.y) + 0.005;
    for (let i = 0; i <= segments; i += 1) {
      const phi = -ring.halfPhi + (2 * ring.halfPhi * i) / segments;
      positions.push(radius * Math.sin(phi), ring.y, radius * Math.cos(phi));
    }
  });

  for (let ring = 0; ring < rings.length - 1; ring += 1) {
    for (let i = 0; i < segments; i += 1) {
      const a = ring * (segments + 1) + i;
      const b = a + 1;
      const c = a + segments + 1;
      const d = c + 1;
      indices.push(a, b, c, b, d, c);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function buildStage(canvas: HTMLCanvasElement, width: number, height: number): Stage {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(30, width / height, 0.05, 20);
  camera.position.set(0, 0.6, 2.05);
  camera.lookAt(0, 0.47, 0);

  // --- Iluminación de estudio -------------------------------------------
  scene.add(new THREE.HemisphereLight(0xffffff, 0xcbd5e1, 1.15));

  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(1.9, 2.6, 2.4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -1;
  key.shadow.camera.right = 1;
  key.shadow.camera.top = 1.5;
  key.shadow.camera.bottom = -0.5;
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 9;
  key.shadow.bias = -0.0008;
  key.shadow.radius = 3;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xdbeafe, 1.1);
  fill.position.set(-2.2, 1.1, 1.9);
  scene.add(fill);

  const rim = new THREE.PointLight(0x60a5fa, 2.4, 6, 2);
  rim.position.set(-1.1, 2, -1.4);
  scene.add(rim);

  // --- Materiales compartidos -------------------------------------------
  const matSkin = makeMaterial(PALETTE.skin, 0.62);
  const matSkinWarm = makeMaterial(PALETTE.skinWarm, 0.7);
  const matHair = makeMaterial(PALETTE.hair, 0.72);
  const matSuit = makeMaterial(PALETTE.suit, 0.58, 0.05);
  const matShirt = makeMaterial(PALETTE.shirt, 0.85, 0.02, THREE.DoubleSide);
  const matAccent = makeMaterial(PALETTE.accent, 0.42, 0.15);
  const matEye = makeMaterial(PALETTE.eyeWhite, 0.28);
  const matIris = makeMaterial(PALETTE.iris, 0.22);
  const matPupil = makeMaterial(PALETTE.pupil, 0.2);
  const matMouth = makeMaterial(PALETTE.mouth, 0.55);
  const matLip = makeMaterial(PALETTE.lipLine, 0.5);
  const matBlush = new THREE.MeshStandardMaterial({
    color: PALETTE.blush,
    roughness: 0.9,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
  });
  const matPedestal = makeMaterial(PALETTE.pedestal, 0.55);
  const matRing = makeMaterial(PALETTE.pedestalRing, 0.4);

  const figure = new THREE.Group();
  scene.add(figure);

  // --- Pedestal ----------------------------------------------------------
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.285, 0.12, 64), matPedestal);
  pedestal.position.y = 0.06;
  pedestal.castShadow = true;
  pedestal.receiveShadow = true;
  figure.add(pedestal);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.263, 0.006, 12, 72), matRing);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.121;
  figure.add(ring);

  // --- Torso (comprimido en Z para dar profundidad humana) --------------
  const torsoGroup = new THREE.Group();
  torsoGroup.scale.z = 0.72;
  figure.add(torsoGroup);

  const torsoPoints = TORSO_PROFILE.map(([radius, y]) => new THREE.Vector2(radius, y));
  const torso = new THREE.Mesh(new THREE.LatheGeometry(torsoPoints, 72), matSuit);
  torso.castShadow = true;
  torso.receiveShadow = true;
  torsoGroup.add(torso);

  // Camisa en V: panel a 5 mm por fuera del pecho, se ensancha hacia el cuello
  const shirt = new THREE.Mesh(buildShirtPanel(), matShirt);
  torsoGroup.add(shirt);

  // Corbata: vertical sobre el tramo recto del pecho, en coordenadas de mundo
  // (el cuerpo se comprime en Z, así que su superficie frontal queda en z ≈ 0.147).
  const tieTilt = -0.02;
  const tie = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.021, 0.165, 12), matAccent);
  tie.position.set(0, 0.4825, 0.158);
  tie.rotation.x = tieTilt;
  tie.castShadow = true;
  figure.add(tie);

  const knot = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.028, 0.018), matAccent);
  knot.position.set(0, 0.572, 0.15);
  knot.rotation.x = tieTilt;
  figure.add(knot);

  // --- Brazos ------------------------------------------------------------
  const buildArm = (side: -1 | 1) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * SHOULDER_X, SHOULDER_Y, 0);

    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.058, 24, 24), matSuit);
    cap.scale.z = 0.9;
    cap.castShadow = true;
    shoulder.add(cap);

    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.048, 0.15, 6, 16), matSuit);
    upper.position.y = -0.108;
    upper.castShadow = true;
    shoulder.add(upper);

    const elbow = new THREE.Group();
    elbow.position.y = -0.225;
    shoulder.add(elbow);

    const fore = new THREE.Mesh(new THREE.CapsuleGeometry(0.042, 0.12, 6, 16), matSuit);
    fore.position.y = -0.09;
    fore.castShadow = true;
    elbow.add(fore);

    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.043, 0.016, 20), matShirt);
    cuff.position.y = -0.165;
    elbow.add(cuff);

    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.049, 24, 24), matSkin);
    hand.scale.set(1, 1.16, 0.78);
    hand.position.y = -0.205;
    hand.castShadow = true;
    elbow.add(hand);

    const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.032, 4, 10), matSkin);
    thumb.position.set(side * -0.032, -0.187, 0.03);
    thumb.rotation.z = side * 0.5;
    elbow.add(thumb);

    figure.add(shoulder);
    return { shoulder, elbow };
  };

  const armR = buildArm(1);
  const armL = buildArm(-1);

  // --- Cabeza ------------------------------------------------------------
  const headPivot = new THREE.Group();
  headPivot.position.y = NECK_PIVOT_Y;
  figure.add(headPivot);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.064, 0.08, 24), matSkinWarm);
  neck.position.y = 0.028;
  neck.castShadow = true;
  headPivot.add(neck);

  const head = new THREE.Group();
  head.position.y = HEAD_CENTER_Y - NECK_PIVOT_Y;
  headPivot.add(head);

  const skull = new THREE.Mesh(new THREE.SphereGeometry(HEAD_R, 48, 48), matSkin);
  skull.scale.set(1, 1.06, 0.94);
  skull.castShadow = true;
  skull.receiveShadow = true;
  head.add(skull);

  // Orejas
  const earGeo = new THREE.SphereGeometry(0.031, 20, 20);
  const earR = new THREE.Mesh(earGeo, matSkinWarm);
  earR.scale.set(0.62, 1, 0.55);
  earR.position.set(0.128, 0, -0.005);
  head.add(earR);
  const earL = earR.clone();
  earL.position.x = -0.128;
  head.add(earL);

  // Cabello: casquete inclinado (frente libre, nuca cubierta) + flequillo
  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.139, 40, 40, 0, Math.PI * 2, 0, Math.PI * 0.47),
    matHair,
  );
  hairCap.scale.set(1, 1.06, 0.95);
  hairCap.position.y = 0.004;
  hairCap.rotation.x = -0.58;
  hairCap.castShadow = true;
  head.add(hairCap);

  const fringe = new THREE.Mesh(new THREE.SphereGeometry(0.075, 28, 28), matHair);
  fringe.scale.set(1.05, 0.4, 0.6);
  fringe.position.set(0.018, 0.104, 0.056);
  fringe.rotation.set(-0.1, 0, 0.22);
  fringe.castShadow = true;
  head.add(fringe);

  // Ojos (grupo escalable para el parpadeo)
  const buildEye = (side: -1 | 1) => {
    const eye = new THREE.Group();
    eye.position.set(side * 0.048, 0.022, 0.105);

    const white = new THREE.Mesh(new THREE.SphereGeometry(0.029, 28, 28), matEye);
    white.scale.set(1, 1, 0.62);
    eye.add(white);

    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.014, 24, 24), matIris);
    iris.position.z = 0.0175;
    iris.scale.set(1, 1, 0.5);
    eye.add(iris);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.0075, 20, 20), matPupil);
    pupil.position.z = 0.0225;
    pupil.scale.set(1, 1, 0.45);
    eye.add(pupil);

    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.0048, 16, 16), matEye);
    glint.position.set(side * -0.007, 0.009, 0.026);
    eye.add(glint);

    head.add(eye);
    return eye;
  };
  const eyeR = buildEye(1);
  const eyeL = buildEye(-1);

  // Cejas
  const browGeo = new THREE.CapsuleGeometry(0.0055, 0.038, 4, 10);
  const browR = new THREE.Mesh(browGeo, matHair);
  browR.rotation.z = Math.PI / 2 - 0.12;
  browR.position.set(0.05, 0.068, 0.108);
  head.add(browR);
  const browL = new THREE.Mesh(browGeo, matHair);
  browL.rotation.z = Math.PI / 2 + 0.12;
  browL.position.set(-0.05, 0.068, 0.108);
  head.add(browL);

  // Nariz
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.042, 18), matSkin);
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, 0.0, 0.122);
  head.add(nose);

  // Mejillas
  const cheekGeo = new THREE.SphereGeometry(0.032, 20, 20);
  const cheekR = new THREE.Mesh(cheekGeo, matBlush);
  cheekR.scale.set(0.9, 0.62, 0.3);
  cheekR.position.set(0.072, -0.022, 0.098);
  head.add(cheekR);
  const cheekL = cheekR.clone();
  cheekL.position.x = -0.072;
  head.add(cheekL);

  // Boca: sonrisa (toro) + apertura (elipsoide), mutuamente excluyentes
  const mouthGroup = new THREE.Group();
  mouthGroup.position.set(0, -0.052, 0.104);
  head.add(mouthGroup);

  const mouthSmile = new THREE.Mesh(
    new THREE.TorusGeometry(0.026, 0.0062, 10, 30, Math.PI),
    matLip,
  );
  mouthSmile.rotation.z = Math.PI;
  mouthSmile.position.y = 0.013;
  mouthGroup.add(mouthSmile);

  const mouthOpen = new THREE.Mesh(new THREE.SphereGeometry(0.028, 28, 28), matMouth);
  mouthOpen.scale.set(0.001, 0.001, 0.001);
  mouthOpen.position.y = -0.008;
  mouthGroup.add(mouthOpen);

  // --- Sombra de contacto ------------------------------------------------
  const shadowMaterial = new THREE.ShadowMaterial({ color: 0x0f172a, opacity: 0.17 });
  const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), shadowMaterial);
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.001;
  shadowPlane.receiveShadow = true;
  scene.add(shadowPlane);

  const rig: Rig = {
    figure,
    headPivot,
    eyeR,
    eyeL,
    browR,
    browL,
    mouthOpen,
    mouthSmile,
    shoulderR: armR.shoulder,
    elbowR: armR.elbow,
    shoulderL: armL.shoulder,
    elbowL: armL.elbow,
  };

  const dispose = () => {
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
      }
    });
    const materials = new Set<THREE.Material>([
      matSkin,
      matSkinWarm,
      matHair,
      matSuit,
      matShirt,
      matAccent,
      matEye,
      matIris,
      matPupil,
      matMouth,
      matLip,
      matBlush,
      matPedestal,
      matRing,
      shadowMaterial,
    ]);
    materials.forEach((material) => material.dispose());
    renderer.setAnimationLoop(null);
    renderer.dispose();
  };

  return {
    rig,
    camera,
    start: (tick) => renderer.setAnimationLoop(tick),
    stop: () => renderer.setAnimationLoop(null),
    render: () => renderer.render(scene, camera),
    dispose,
  };
}

/** Comprobación previa de soporte WebGL (evita montar un canvas inservible). */
function detectWebGL(): boolean {
  try {
    const probe = document.createElement('canvas');
    return Boolean(probe.getContext('webgl2') ?? probe.getContext('webgl'));
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------
export const TutorAvatar3D: React.FC<TutorAvatar3DProps> = ({
  pose = 'idle',
  viseme = 'sil',
  isSpeaking = false,
  isListening = false,
  width = 380,
  height = 350,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [unsupported] = useState(() => !detectWebGL());
  const inputRef = useRef({ pose, viseme, isSpeaking, isListening });
  const pointerRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    inputRef.current = { pose, viseme, isSpeaking, isListening };
  }, [pose, viseme, isSpeaking, isListening]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let stage: Stage;
    try {
      stage = buildStage(canvas, width, height);
    } catch {
      return;
    }

    const { rig, camera, start, stop, render, dispose } = stage;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const motionScale = reduceMotion ? 0.35 : 1;

    const clock = new THREE.Clock();
    let elapsed = 0;
    let nextBlink = 2 + Math.random() * 2.5;
    let blinkStart = -1;

    // Estado suavizado: evita saltos entre poses y visemas
    const cur = {
      shoulderR: { ...POSES.idle.shoulderR },
      shoulderL: { ...POSES.idle.shoulderL },
      elbowR: POSES.idle.elbowR,
      elbowL: POSES.idle.elbowL,
      headX: 0,
      headY: 0,
      headZ: 0,
      mouth: { x: 0.001, y: 0.001, z: 0.001 },
      smile: 1,
      gesture: 0,
    };

    const damp = (current: number, target: number, lambda: number, dt: number) =>
      THREE.MathUtils.damp(current, target, lambda, dt);

    const updateCamera = () => {
      const pointer = pointerRef.current;
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointer.x * 0.08 * motionScale, 0.06);
      camera.position.y = THREE.MathUtils.lerp(
        camera.position.y,
        0.6 + pointer.y * 0.05 * motionScale,
        0.06,
      );
      camera.lookAt(0, 0.47, 0);
    };

    const tick = () => {
      const dt = Math.min(clock.getDelta(), 0.05);
      elapsed += dt;

      const {
        pose: activePose,
        viseme: activeViseme,
        isSpeaking: speaking,
        isListening: listening,
      } = inputRef.current;

      const effectivePose: AvatarPoseType =
        speaking && activePose === 'idle' ? 'explaining' : activePose;
      const target = POSES[effectivePose];
      const lambda = 7;

      // --- Postura ------------------------------------------------------
      cur.shoulderR.x = damp(cur.shoulderR.x, target.shoulderR.x, lambda, dt);
      cur.shoulderR.y = damp(cur.shoulderR.y, target.shoulderR.y, lambda, dt);
      cur.shoulderR.z = damp(cur.shoulderR.z, target.shoulderR.z, lambda, dt);
      cur.shoulderL.x = damp(cur.shoulderL.x, target.shoulderL.x, lambda, dt);
      cur.shoulderL.y = damp(cur.shoulderL.y, target.shoulderL.y, lambda, dt);
      cur.shoulderL.z = damp(cur.shoulderL.z, target.shoulderL.z, lambda, dt);
      cur.elbowR = damp(cur.elbowR, target.elbowR, lambda, dt);
      cur.elbowL = damp(cur.elbowL, target.elbowL, lambda, dt);
      cur.gesture = damp(cur.gesture, target.gesture, 5, dt);

      // Gesticulación oratoria sobre la pose activa
      const wave = speaking ? Math.sin(elapsed * 6.2) * 0.11 * cur.gesture * motionScale : 0;
      const listenTilt = listening ? Math.sin(elapsed * 1.6) * 0.04 * motionScale : 0;

      rig.shoulderR.rotation.set(cur.shoulderR.x + wave, cur.shoulderR.y, cur.shoulderR.z);
      rig.shoulderL.rotation.set(cur.shoulderL.x - wave * 0.25, cur.shoulderL.y, cur.shoulderL.z);
      rig.elbowR.rotation.x = cur.elbowR - Math.abs(wave) * 0.35;
      rig.elbowL.rotation.x = cur.elbowL;

      // --- Cabeza -------------------------------------------------------
      const headTargetX = target.head.x + (speaking ? Math.sin(elapsed * 5.1) * 0.045 : 0);
      const headTargetY = target.head.y + (listening ? -0.06 : 0);
      const headTargetZ = target.head.z + listenTilt;

      cur.headX = damp(cur.headX, headTargetX, 6, dt);
      cur.headY = damp(cur.headY, headTargetY, 6, dt);
      cur.headZ = damp(cur.headZ, headTargetZ, 6, dt);

      rig.headPivot.rotation.set(
        cur.headX,
        cur.headY + Math.sin(elapsed * 0.62) * 0.05 * motionScale,
        cur.headZ,
      );

      // --- Respiración y balanceo --------------------------------------
      rig.figure.position.y = Math.sin(elapsed * 1.7) * 0.004 * motionScale;
      rig.figure.rotation.y = Math.sin(elapsed * 0.55) * 0.045 * motionScale;

      // --- Parpadeo -----------------------------------------------------
      if (blinkStart < 0 && elapsed > nextBlink) {
        blinkStart = elapsed;
      }
      let eyeScale = 1;
      if (blinkStart >= 0) {
        const progress = (elapsed - blinkStart) / 0.15;
        if (progress >= 1) {
          blinkStart = -1;
          nextBlink = elapsed + 2.2 + Math.random() * 3.2;
        } else {
          eyeScale = 1 - Math.sin(progress * Math.PI) * 0.94;
        }
      }
      rig.eyeR.scale.y = eyeScale;
      rig.eyeL.scale.y = eyeScale;

      // Cejas: se elevan al celebrar, se fruncen al escuchar
      const browLift = effectivePose === 'celebrating' ? 0.008 : listening ? -0.004 : 0;
      rig.browR.position.y = 0.068 + browLift;
      rig.browL.position.y = 0.068 + browLift;

      // --- Boca ---------------------------------------------------------
      const shape = VISEMES[activeViseme] ?? VISEMES.sil;
      cur.mouth.x = damp(cur.mouth.x, shape.open[0], 26, dt);
      cur.mouth.y = damp(cur.mouth.y, shape.open[1], 26, dt);
      cur.mouth.z = damp(cur.mouth.z, shape.open[2], 26, dt);
      cur.smile = damp(cur.smile, shape.smile, 22, dt);

      rig.mouthOpen.scale.set(cur.mouth.x, cur.mouth.y, cur.mouth.z);
      rig.mouthSmile.scale.set(Math.max(cur.smile, 0.001), Math.max(cur.smile, 0.001), 1);

      updateCamera();
      render();
    };

    const handlePointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      pointerRef.current = {
        x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
        y: -(((event.clientY - rect.top) / rect.height) * 2 - 1),
      };
    };
    const handlePointerLeave = () => {
      pointerRef.current = { x: 0, y: 0 };
    };

    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerleave', handlePointerLeave);

    start(tick);

    return () => {
      stop();
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerleave', handlePointerLeave);
      dispose();
    };
  }, [width, height]);

  if (unsupported) {
    return (
      <div
        style={{
          width: '100%',
          maxWidth: width,
          aspectRatio: `${width} / ${height}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '16px',
          background: 'linear-gradient(160deg, #EFF6FF 0%, #DBEAFE 100%)',
          color: 'var(--color-ink-muted)',
          fontSize: '14px',
          textAlign: 'center',
          padding: '16px',
        }}
      >
        Tu navegador no puede mostrar el docente 3D. Activa la aceleración por hardware para verlo.
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        width: '100%',
        maxWidth: width,
        aspectRatio: `${width} / ${height}`,
        height: 'auto',
        display: 'block',
        borderRadius: '16px',
        background: 'radial-gradient(circle at 50% 26%, #EFF6FF 0%, #DBEAFE 46%, #E2E8F0 100%)',
        boxShadow: 'inset 0 2px 10px rgba(15, 23, 42, 0.07)',
        touchAction: 'none',
      }}
      role="img"
      aria-label="Docente virtual 3D animado"
    />
  );
};

export default TutorAvatar3D;
