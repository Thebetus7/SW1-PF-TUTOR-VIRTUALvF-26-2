import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { TutorAvatar3DProps } from "./TutorAvatar3D";

type Point = [number, number, number];
import { selectGesture, type AvatarGesture as Gesture } from "./avatarGestures";
interface ArmPose {
  elbow: Point;
  hand: Point;
  turn: Point;
  fingers: number[];
}
const ARM_POSES: Record<Gesture, [ArmPose, ArmPose]> = {
  rest: [
    {
      elbow: [-0.42, 0.48, 0.04],
      hand: [-0.28, 0.27, 0.18],
      turn: [0, 0, -0.2],
      fingers: [0.5, 0.5, 0.5, 0.5],
    },
    {
      elbow: [0.42, 0.48, 0.04],
      hand: [0.28, 0.27, 0.18],
      turn: [0, 0, 0.2],
      fingers: [0.5, 0.5, 0.5, 0.5],
    },
  ],
  open: [
    {
      elbow: [-0.45, 0.52, 0.1],
      hand: [-0.43, 0.69, 0.34],
      turn: [-0.6, 0.2, -0.5],
      fingers: [0.05, 0.08, 0.12, 0.2],
    },
    {
      elbow: [0.45, 0.51, 0.1],
      hand: [0.43, 0.6, 0.31],
      turn: [-0.5, -0.2, 0.65],
      fingers: [0.08, 0.1, 0.12, 0.2],
    },
  ],
  point: [
    {
      elbow: [-0.43, 0.47, 0.05],
      hand: [-0.24, 0.36, 0.24],
      turn: [-0.3, 0, -0.4],
      fingers: [0.3, 0.4, 0.5, 0.5],
    },
    {
      elbow: [0.43, 0.62, 0.05],
      hand: [0.45, 0.88, 0.2],
      turn: [0, 0.1, -0.45],
      fingers: [0, 1.25, 1.3, 1.35],
    },
  ],
  think: [
    {
      elbow: [-0.4, 0.48, 0.04],
      hand: [-0.19, 0.39, 0.24],
      turn: [-0.3, 0, -0.6],
      fingers: [0.4, 0.4, 0.5, 0.5],
    },
    {
      elbow: [0.37, 0.59, 0.16],
      hand: [0.1, 0.98, 0.29],
      turn: [0.2, -0.6, 0.25],
      fingers: [0.5, 1, 1, 1],
    },
  ],
  count: [
    {
      elbow: [-0.4, 0.5, 0.06],
      hand: [-0.27, 0.42, 0.22],
      turn: [-0.3, 0, -0.4],
      fingers: [0.2, 0.3, 0.4, 0.5],
    },
    {
      elbow: [0.4, 0.59, 0.09],
      hand: [0.35, 0.85, 0.32],
      turn: [-0.1, 0, 0.15],
      fingers: [0, 0, 1.2, 1.3],
    },
  ],
  encourage: [
    {
      elbow: [-0.4, 0.51, 0.12],
      hand: [-0.08, 0.71, 0.29],
      turn: [0.6, 0.2, -1.1],
      fingers: [0.2, 0.25, 0.3, 0.4],
    },
    {
      elbow: [0.44, 0.5, 0.06],
      hand: [0.4, 0.62, 0.34],
      turn: [-0.5, 0, 0.6],
      fingers: [0.05, 0.1, 0.15, 0.2],
    },
  ],
  celebrate: [
    {
      elbow: [-0.45, 0.58, 0.05],
      hand: [-0.35, 0.87, 0.28],
      turn: [-0.1, 0, -0.25],
      fingers: [0.05, 0.08, 0.12, 0.18],
    },
    {
      elbow: [0.45, 0.58, 0.05],
      hand: [0.35, 0.87, 0.28],
      turn: [-0.1, 0, 0.25],
      fingers: [0.05, 0.08, 0.12, 0.18],
    },
  ],
  listen: [
    {
      elbow: [-0.4, 0.47, 0.04],
      hand: [-0.18, 0.33, 0.26],
      turn: [-0.25, 0, -0.5],
      fingers: [0.4, 0.5, 0.6, 0.6],
    },
    {
      elbow: [0.4, 0.47, 0.04],
      hand: [0.18, 0.33, 0.26],
      turn: [-0.25, 0, 0.5],
      fingers: [0.4, 0.5, 0.6, 0.6],
    },
  ],
};

export default function MinimalTutorAvatar(
  props: TutorAvatar3DProps & { gender?: "male" | "female" },
) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const state = useRef(props);
  useEffect(() => {
    state.current = props;
  });
  const [unsupported, setUnsupported] = useState(false);
  useEffect(() => {
    if (!canvas.current) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas.current,
        antialias: true,
        alpha: true,
      });
    } catch {
      queueMicrotask(() => setUnsupported(true));
      return;
    }
    renderer.setSize(320, 340);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8090a0, 2.8));
    const key = new THREE.DirectionalLight(0xfff4e6, 3);
    key.position.set(-2, 3, 4);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xdbeafe, 1.5);
    fill.position.set(2, 1, 2);
    scene.add(fill);
    const camera = new THREE.PerspectiveCamera(31, 320 / 340, 0.1, 20);
    camera.position.set(0, 0.9, 2.9);
    camera.lookAt(0, 0.79, 0);
    const material = (color: number) =>
      new THREE.MeshStandardMaterial({ color, roughness: 0.82 });
    const skin = material(0xd7a17e),
      hair = material(0x3c302c),
      jacket = material(0x527895),
      shirt = material(0xf2f0ea),
      ink = material(0x303b43),
      lip = material(0x8b5148),
      inside = material(0x5c3530);
    const figure = new THREE.Group();
    scene.add(figure);
    const ball = (
      parent: THREE.Object3D,
      size: Point,
      position: Point,
      mat: THREE.Material,
    ) => {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), mat);
      mesh.scale.set(...size);
      mesh.position.set(...position);
      parent.add(mesh);
      return mesh;
    };
    const torso = new THREE.Group();
    figure.add(torso);
    const profile = [
      new THREE.Vector2(0.26, 0.14),
      new THREE.Vector2(0.3, 0.27),
      new THREE.Vector2(0.35, 0.52),
      new THREE.Vector2(0.36, 0.65),
      new THREE.Vector2(0.29, 0.76),
      new THREE.Vector2(0.12, 0.83),
    ];
    const body = new THREE.Mesh(new THREE.LatheGeometry(profile, 40), jacket);
    body.scale.z = 0.58;
    torso.add(body);
    ball(torso, [0.073, 0.105, 0.025], [0, 0.735, 0.188], shirt);
    ball(torso, [0.072, 0.095, 0.07], [0, 0.858, 0.015], skin);
    const head = new THREE.Group();
    head.position.set(0, 1.075, 0.015);
    torso.add(head);
    const female = props.gender === "female";
    ball(head, [female ? 0.167 : 0.18, 0.228, 0.164], [0, 0, 0], skin);
    ball(head, [0.19, 0.145, 0.17], [0, 0.15, -0.025], hair);
    ball(head, [0.115, 0.055, 0.055], [-0.06, 0.21, 0.105], hair);
    if (female) {
      ball(head, [0.06, 0.19, 0.09], [-0.153, 0.025, -0.045], hair);
      ball(head, [0.06, 0.19, 0.09], [0.153, 0.025, -0.045], hair);
    }
    ball(head, [0.026, 0.047, 0.025], [-0.18, -0.015, 0], skin);
    ball(head, [0.026, 0.047, 0.025], [0.18, -0.015, 0], skin);
    ball(head, [0.022, 0.041, 0.034], [0, -0.005, 0.161], skin);
    const eyes = [-1, 1].map((side) =>
      ball(head, [0.012, 0.015, 0.006], [side * 0.062, 0.038, 0.151], ink),
    );
    const brows = [-1, 1].map((side) =>
      ball(head, [0.033, 0.006, 0.006], [side * 0.064, 0.084, 0.143], hair),
    );
    const mouth = ball(head, [0.039, 0.006, 0.008], [0, -0.086, 0.148], inside);
    const lowerLip = ball(head, [0.034, 0.004, 0.007], [0, -0.097, 0.149], lip);
    const arms = [-1, 1].map((side) => {
      const upper = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.075, 1, 8, 16),
        jacket,
      );
      figure.add(upper);
      const lower = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.049, 1, 8, 16),
        jacket,
      );
      figure.add(lower);
      const hand = new THREE.Group();
      figure.add(hand);
      ball(hand, [0.041, 0.054, 0.024], [0, 0, 0], skin);
      const fingers = [0, 1, 2, 3].map((i) => {
        const finger = new THREE.Group();
        finger.position.set((i - 1.5) * 0.019, 0.04, 0);
        hand.add(finger);
        ball(
          finger,
          [0.009, 0.035 - (i === 3 ? 0.009 : 0), 0.009],
          [0, 0.026, 0],
          skin,
        );
        return finger;
      });
      ball(
        hand,
        [0.014, 0.033, 0.014],
        [-side * 0.043, -0.002, 0.009],
        skin,
      ).rotation.z = side * 0.55;
      return {
        upper,
        lower,
        hand,
        fingers,
        shoulder: new THREE.Vector3(side * 0.29, 0.72, 0),
        elbow: new THREE.Vector3(side * 0.42, 0.48, 0.04),
        wrist: new THREE.Vector3(side * 0.28, 0.27, 0.18),
      };
    });
    const up = new THREE.Vector3(0, 1, 0);
    const direction = new THREE.Vector3();
    const setLimb = (
      mesh: THREE.Mesh,
      from: THREE.Vector3,
      to: THREE.Vector3,
    ) => {
      direction.subVectors(to, from);
      const length = direction.length();
      mesh.position.copy(from).add(to).multiplyScalar(0.5);
      mesh.scale.y = Math.max(
        0.01,
        length /
          (1 +
            (mesh === arms[0].upper || mesh === arms[1].upper ? 0.15 : 0.098)),
      );
      mesh.quaternion.setFromUnitVectors(up, direction.normalize());
    };
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const clock = new THREE.Clock();
    const target = new THREE.Vector3();
    const handTarget = new THREE.Quaternion();
    const handEuler = new THREE.Euler();
    let gesture: Gesture = "rest";
    let lastGesture: Gesture = "rest";
    let gestureAt = 0;
    let speakingTime = 0;
    let wasSpeaking = false;
    let selectionAt = 0;
    let previousSelection = "auto";
    let gestureHistory: string[] = [];
    renderer.setAnimationLoop(() => {
      const elapsedDelta = clock.getDelta();
      const dt = Math.min(elapsedDelta, 0.25);
      const time = clock.elapsedTime;
      const current = state.current;
      const moving = reduced.matches ? 0 : 1;
      if (current.isSpeaking && !wasSpeaking) {
        speakingTime = 0;
        gestureHistory = [];
      }
      if (current.isSpeaking) speakingTime += elapsedDelta;
      wasSpeaking = Boolean(current.isSpeaking);
      const selection = current.gestureSelection || "auto";
      if (selection !== previousSelection) {
        selectionAt = time;
        previousSelection = selection;
      }
      gesture = selectGesture({
        selection,
        elapsed: selection === "demo" ? time - selectionAt : speakingTime,
        speaking: Boolean(current.isSpeaking),
        listening: Boolean(current.isListening),
        pose: current.pose,
        speechText: current.speechText,
        spokenEnd: current.spokenEnd,
      });
      // Reduced motion removes rhythmic movement but preserves meaningful changes of posture.
      if (gesture !== lastGesture) {
        gestureAt = time;
        lastGesture = gesture;
        current.onGestureChange?.(gesture);
        gestureHistory.push(gesture);
        if (canvas.current) {
          canvas.current.dataset.gesture = gesture;
          canvas.current.dataset.gestureHistory = JSON.stringify(
            gestureHistory.slice(-16),
          );
        }
      }
      const settle = Math.min(1, (time - gestureAt) / 0.7);
      const beat = current.isSpeaking
        ? Math.sin(time * 3) * 0.012 * moving * settle
        : 0;
      const poses = ARM_POSES[gesture];
      arms.forEach((arm, i) => {
        arm.elbow.lerp(target.set(...poses[i].elbow), 1 - Math.exp(-dt * 5));
        target.set(...poses[i].hand);
        target.y += beat * (i === 0 ? 1 : -1);
        arm.wrist.lerp(target, 1 - Math.exp(-dt * 5));
        setLimb(arm.upper, arm.shoulder, arm.elbow);
        setLimb(arm.lower, arm.elbow, arm.wrist);
        arm.hand.position.copy(arm.wrist);
        handEuler.set(...poses[i].turn);
        handTarget.setFromEuler(handEuler);
        arm.hand.quaternion.slerp(handTarget, 1 - Math.exp(-dt * 6));
        arm.fingers.forEach((finger, j) => {
          finger.rotation.x = THREE.MathUtils.damp(
            finger.rotation.x,
            poses[i].fingers[j],
            7,
            dt,
          );
        });
      });
      torso.rotation.z = THREE.MathUtils.damp(
        torso.rotation.z,
        Math.sin(time * 0.7) * 0.008 * moving,
        5,
        dt,
      );
      head.rotation.x = THREE.MathUtils.damp(
        head.rotation.x,
        gesture === "listen"
          ? 0.095
          : gesture === "celebrate"
            ? Math.sin(time * 3) * 0.045 * moving
            : current.isSpeaking
              ? Math.sin(time * 2.2) * 0.025 * moving
              : 0,
        7,
        dt,
      );
      head.rotation.z = THREE.MathUtils.damp(
        head.rotation.z,
        gesture === "think"
          ? -0.14
          : gesture === "listen"
            ? 0.085
            : gesture === "encourage"
              ? 0.045
              : 0,
        5,
        dt,
      );
      const opening =
        current.isSpeaking && current.viseme !== "sil"
          ? current.viseme === "aa"
            ? 0.026
            : 0.017
          : 0.006;
      mouth.scale.y = THREE.MathUtils.damp(mouth.scale.y, opening, 18, dt);
      mouth.scale.x = THREE.MathUtils.damp(
        mouth.scale.x,
        current.viseme === "ou" || current.viseme === "oh"
          ? 0.022
          : gesture === "celebrate"
            ? 0.046
            : 0.036,
        14,
        dt,
      );
      lowerLip.position.y = -0.09 - mouth.scale.y * 0.6;
      lowerLip.scale.x = THREE.MathUtils.damp(
        lowerLip.scale.x,
        gesture === "celebrate"
          ? 0.048
          : gesture === "encourage"
            ? 0.042
            : 0.034,
        8,
        dt,
      );
      head.rotation.y = THREE.MathUtils.damp(
        head.rotation.y,
        gesture === "think" ? -0.12 : gesture === "point" ? 0.08 : 0,
        5,
        dt,
      );
      const blink = Math.sin(time * 1.25) > 0.995 ? 0.002 : 0.015;
      eyes.forEach((eye) => {
        eye.scale.y = THREE.MathUtils.damp(eye.scale.y, blink, 35, dt);
      });
      brows.forEach((brow, i) => {
        brow.position.y = THREE.MathUtils.damp(
          brow.position.y,
          gesture === "think"
            ? i === 0
              ? 0.102
              : 0.078
            : gesture === "celebrate"
              ? 0.104
              : gesture === "listen"
                ? 0.095
                : 0.084,
          7,
          dt,
        );
        brow.rotation.z = THREE.MathUtils.damp(
          brow.rotation.z,
          gesture === "think"
            ? i === 0
              ? -0.12
              : 0.05
            : gesture === "celebrate"
              ? i === 0
                ? 0.1
                : -0.1
              : 0,
          7,
          dt,
        );
      });
      renderer.render(scene, camera);
    });
    return () => {
      renderer.setAnimationLoop(null);
      const materials = new Set<THREE.Material>();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          (Array.isArray(object.material)
            ? object.material
            : [object.material]
          ).forEach((mat) => materials.add(mat));
        }
      });
      materials.forEach((mat) => mat.dispose());
      renderer.dispose();
    };
  }, [props.gender]);
  return unsupported ? (
    <p role="status">
      El docente sigue disponible por voz y texto. No se pudo activar el avatar
      3D.
    </p>
  ) : (
    <canvas
      ref={canvas}
      role="img"
      aria-label="Docente 3D minimalista con gestos de explicación, escucha y ánimo"
      style={{
        display: "block",
        width: "100%",
        maxWidth: 320,
        aspectRatio: "320 / 340",
        borderRadius: 18,
        background: "var(--color-surface-sunken)",
      }}
    />
  );
}
