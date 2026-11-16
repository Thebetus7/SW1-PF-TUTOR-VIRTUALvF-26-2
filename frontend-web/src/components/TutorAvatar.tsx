import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils, type VRM } from '@pixiv/three-vrm';
import type { TutorAvatar3DProps } from './TutorAvatar3D';
import MinimalTutorAvatar from './MinimalTutorAvatar';

// A licensed VRM asset can be deployed under public/avatars without changing application code.
export default function TutorAvatar(props: TutorAvatar3DProps & { gender?: 'male' | 'female' }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const current = useRef(props);
  useEffect(() => { current.current = props; });
  const [failedUrl, setFailedUrl] = useState<string | undefined>();
  const customUrl = props.gender === 'female' ? import.meta.env.VITE_TUTOR_VRM_FEMALE_URL : import.meta.env.VITE_TUTOR_VRM_MALE_URL;
  const url = customUrl;
  useEffect(() => {
    if (!url || !canvas.current) return;
    let disposed = false;
    let vrm: VRM | undefined;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ canvas: canvas.current, alpha: true, antialias: true }); }
    catch { queueMicrotask(() => setFailedUrl(url)); return; }
    renderer.setSize(320, 300); renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x64748b, 2));
    const light = new THREE.DirectionalLight(0xffffff, 2); light.position.set(1, 2, 3); scene.add(light);
    const camera = new THREE.PerspectiveCamera(30, 320 / 300, 0.1, 30); camera.position.set(0, 1.35, 2.7); camera.lookAt(0, 1.15, 0);
    const loader = new GLTFLoader(); loader.register(parser => new VRMLoaderPlugin(parser));
    void loader.loadAsync(url).then(gltf => {
      const loaded = gltf.userData.vrm as VRM | undefined;
      if (!loaded) throw new Error('El archivo no contiene un avatar VRM');
      if (disposed) { VRMUtils.deepDispose(loaded.scene); return; }
      vrm = loaded; VRMUtils.rotateVRM0(vrm); scene.add(vrm.scene);
      vrm.humanoid.getNormalizedBoneNode('leftUpperArm')?.rotation.set(0, 0, -1.1);
      vrm.humanoid.getNormalizedBoneNode('rightUpperArm')?.rotation.set(0, 0, 1.1);
    }).catch(() => { if (!disposed) setFailedUrl(url); });
    const clock = new THREE.Clock();
    renderer.setAnimationLoop(() => {
      const dt = Math.min(clock.getDelta(), 0.1); const state = current.current;
      if (vrm) {
        const names = ['aa','ee','ih','oh','ou'];
        const mouth = state.viseme === 'E' ? 'ee' : state.viseme;
        for (const name of names) vrm.expressionManager?.setValue(name, name === mouth && state.isSpeaking ? 0.8 : 0);
        vrm.expressionManager?.setValue('blink', Math.sin(clock.elapsedTime * 1.4) > 0.995 ? 1 : 0);
        vrm.expressionManager?.setValue('happy', state.pose === 'celebrating' ? 0.5 : 0.08);
        const head = vrm.humanoid.getNormalizedBoneNode('head');
        if (head) head.rotation.x = state.isListening ? 0.12 : Math.sin(clock.elapsedTime * 1.8) * (state.isSpeaking ? 0.04 : 0.01);
        const motion = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1;
        const talk = state.isSpeaking ? Math.sin(clock.elapsedTime * 2.6) * 0.12 * motion : 0;
        const celebration = state.pose === 'celebrating' ? 0.45 : 0;
        for (const side of ['left', 'right'] as const) {
          const sign = side === 'left' ? -1 : 1;
          const arm = vrm.humanoid.getNormalizedBoneNode(side === 'left' ? 'leftUpperArm' : 'rightUpperArm');
          const forearm = vrm.humanoid.getNormalizedBoneNode(side === 'left' ? 'leftLowerArm' : 'rightLowerArm');
          if (arm) { arm.rotation.z = THREE.MathUtils.damp(arm.rotation.z, sign * (1.1 - celebration - talk), 6, dt); arm.rotation.x = THREE.MathUtils.damp(arm.rotation.x, state.isSpeaking ? -0.18 : 0, 6, dt); }
          if (forearm) forearm.rotation.y = THREE.MathUtils.damp(forearm.rotation.y, sign * (state.isSpeaking ? 0.55 : 0.1), 6, dt);
        }
        const spine = vrm.humanoid.getNormalizedBoneNode('spine');
        if (spine) spine.rotation.z = Math.sin(clock.elapsedTime * 0.8) * 0.012 * motion;
        vrm.update(dt);
      }
      renderer.render(scene, camera);
    });
    return () => { disposed = true; renderer.setAnimationLoop(null); if (vrm) VRMUtils.deepDispose(vrm.scene); renderer.dispose(); };
  }, [url]);
  return !url || failedUrl === url ? <MinimalTutorAvatar {...props} /> : <div style={{ width: '100%', textAlign: 'center' }}><canvas ref={canvas} aria-label="Docente virtual animado" role="img" style={{ width: '100%', maxWidth: 320, borderRadius: 16, background: 'var(--color-surface-sunken)' }} /></div>;
}
