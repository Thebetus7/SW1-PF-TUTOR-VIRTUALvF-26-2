import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import type { VisemeShape } from '../types/tutor.types';

interface SpeechTrack {
  provider: 'azure' | 'browser';
  audio?: string;
  words?: Array<{ time: number; start: number; length: number }>;
  visemes?: Array<{ time: number; id: number }>;
}
export function useTutorSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const [text, setText] = useState('');
  const [range, setRange] = useState({ start: 0, length: 0 });
  const [viseme, setViseme] = useState<VisemeShape>('sil');
  const [error, setError] = useState('');
  const [provider, setProvider] = useState('');
  const [rate, setRate] = useState(() => Number(localStorage.getItem('tutor.rate')) || 1);
  const [gender, setGender] = useState<'male' | 'female'>(() => localStorage.getItem('tutor.gender') === 'female' ? 'female' : 'male');
  const [voiceName, setVoiceName] = useState(() => localStorage.getItem('tutor.voice') || '');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const generation = useRef(0);
  const audio = useRef<HTMLAudioElement | null>(null);
  const frame = useRef(0);
  const replay = useRef('');
  const controller = useRef<AbortController | null>(null);
  const complete = useRef<(() => void) | undefined>(undefined);
  const stop = useCallback(() => {
    generation.current++;
    controller.current?.abort();
    window.speechSynthesis?.cancel();
    audio.current?.pause();
    audio.current = null;
    cancelAnimationFrame(frame.current);
    complete.current = undefined;
    setSpeaking(false); setRange({ start: 0, length: 0 }); setViseme('sil');
  }, []);
  useEffect(() => {
    const load = () => setVoices(window.speechSynthesis?.getVoices().filter(v => v.lang.startsWith('es')) || []);
    load(); window.speechSynthesis?.addEventListener('voiceschanged', load);
    return () => { stop(); window.speechSynthesis?.removeEventListener('voiceschanged', load); };
  }, [stop]);
  useEffect(() => { if (audio.current) audio.current.playbackRate = rate; }, [rate]);
  useEffect(() => { localStorage.setItem('tutor.rate', String(rate)); localStorage.setItem('tutor.gender', gender); localStorage.setItem('tutor.voice', voiceName); }, [rate, gender, voiceName]);
  const speak = useCallback(async (value: string, onComplete?: () => void) => {
    stop(); const id = generation.current; replay.current = value;
    setText(value); setError(''); setProvider('Preparando voz');
    complete.current = onComplete;
    const finish = () => {
      if (id !== generation.current) return;
      cancelAnimationFrame(frame.current);
      setSpeaking(false); setRange({ start: 0, length: 0 }); setViseme('sil');
      const callback = complete.current; complete.current = undefined; callback?.();
    };
    controller.current = new AbortController();
    let track: SpeechTrack = { provider: 'browser' };
    try { track = (await api.post<SpeechTrack>('/tutor/speech', { text: value, gender }, { signal: controller.current.signal, timeout: 14000 })).data; }
    catch { if (id !== generation.current) return; setError('Voz del servicio no disponible; usando la del dispositivo.'); }
    if (id !== generation.current) return;
    if (track.provider === 'azure' && track.audio) {
      setProvider('Voz sincronizada');
      const player = new Audio(`data:audio/wav;base64,${track.audio}`); audio.current = player; player.playbackRate = rate;
      player.onended = finish; player.onerror = () => { setError('No se pudo reproducir la voz.'); finish(); };
      const tick = () => {
        if (id !== generation.current) return;
        const word = [...(track.words || [])].reverse().find(w => w.time <= player.currentTime);
        if (word) setRange({ start: word.start, length: word.length });
        const mouth = [...(track.visemes || [])].reverse().find(v => v.time <= player.currentTime);
        const shapes: VisemeShape[] = ['sil','aa','aa','oh','E','E','ih','ou','oh','aa','oh','ih','E','E','E','E','E','E','E','E','E','E'];
        setViseme(shapes[mouth?.id || 0] || 'sil');
        frame.current = requestAnimationFrame(tick);
      };
      try { await player.play(); setSpeaking(true); tick(); } catch { setError('Pulsa Repetir para activar el audio.'); finish(); }
      return;
    }
    setProvider('Voz del dispositivo · sincronización aproximada');
    if (!window.speechSynthesis) { setError('Este navegador no dispone de voz.'); finish(); return; }
    const utterance = new SpeechSynthesisUtterance(value);
    utterance.lang = 'es-ES'; utterance.rate = rate;
    const preferred = voices.find(v => v.name === voiceName) || voices.find(v => new RegExp(gender === 'male' ? 'alvaro|pablo|jorge|diego|ra[uú]l|\\bmale\\b' : 'elvira|helena|sabina|paulina|female', 'i').test(v.name)) || voices[0];
    if (preferred) utterance.voice = preferred;
    utterance.onstart = () => { if (id === generation.current) setSpeaking(true); };
    utterance.onboundary = event => {
      if (id !== generation.current) return;
      const word = value.slice(event.charIndex).match(/^\S+/)?.[0] || '';
      setRange({ start: event.charIndex, length: event.charLength || word.length });
      setViseme('aa');
    };
    utterance.onend = finish;
    utterance.onerror = () => { if (id === generation.current) setError('La voz se interrumpió. Puedes repetirla.'); finish(); };
    window.speechSynthesis.speak(utterance);
  }, [stop, gender, rate, voices, voiceName]);
  return { speak, stop, speaking, text, range, viseme, error, provider, rate, setRate, gender, setGender, voices, voiceName, setVoiceName, repeat: () => { if (replay.current) void speak(replay.current); } };
}
