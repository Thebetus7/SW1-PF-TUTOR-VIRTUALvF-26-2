import { useCallback, useEffect, useRef, useState } from 'react';
import type { LiveConnectConfig, Session } from '@google/genai';
import { api } from '../services/api';

type LiveState = 'disconnected' | 'connecting' | 'listening' | 'speaking' | 'error';
export function useLiveTutor(lessonId: string, gender: 'male' | 'female') {
  const [state, setState] = useState<LiveState>('disconnected');
  const [error, setError] = useState('');
  const [transcript, setTranscript] = useState<Array<{ sender: 'user' | 'tutor'; text: string }>>([]);
  const resources = useRef<{ session?: Session; input?: AudioContext; output?: AudioContext; stream?: MediaStream; node?: AudioWorkletNode; sources: Set<AudioBufferSourceNode>; next: number }>({ sources: new Set(), next: 0 });
  const epoch = useRef(0);
  const disconnect = useCallback(() => {
    epoch.current++;
    const r = resources.current;
    r.node?.disconnect(); r.stream?.getTracks().forEach(t => t.stop());
    r.session?.close(); r.sources.forEach(s => { try { s.stop(); } catch { /* already ended */ } });
    void r.input?.close(); void r.output?.close();
    resources.current = { sources: new Set(), next: 0 };
    setState('disconnected');
  }, []);
  useEffect(() => { return disconnect; }, [lessonId, disconnect]);
  const connect = async () => {
    disconnect(); const id = epoch.current;
    setState('connecting'); setError('');
    const append = (sender: 'user' | 'tutor', text: string) => {
      setTranscript(previous => {
        const last = previous[previous.length - 1];
        return last?.sender === sender ? [...previous.slice(0, -1), { sender, text: last.text + text }] : [...previous, { sender, text }];
      });
    };
    try {
      // Request media from the explicit user gesture; release it if setup is interrupted.
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      if (id !== epoch.current) { stream.getTracks().forEach(t => t.stop()); return; }
      const r = resources.current; r.stream = stream;
      r.input = new AudioContext({ sampleRate: 16000 }); r.output = new AudioContext({ sampleRate: 24000 });
      await Promise.all([r.input.resume(), r.output.resume(), r.input.audioWorklet.addModule('/audio/tutor-microphone.js')]);
      const response = await api.post<{ token: string; model: string; config: LiveConnectConfig }>('/tutor/live-token', { lessonId, gender });
      if (id !== epoch.current) return;
      const { GoogleGenAI } = await import('@google/genai');
      if (id !== epoch.current) return;
      const client = new GoogleGenAI({ apiKey: response.data.token, httpOptions: { apiVersion: 'v1alpha' } });
      const session = await client.live.connect({ model: response.data.model, config: response.data.config, callbacks: {
        onmessage: message => {
          if (id !== epoch.current) return;
          const content = message.serverContent;
          if (content?.interrupted) {
            r.sources.forEach(source => { try { source.stop(); } catch { /* ended */ } });
            r.sources.clear(); r.next = 0; setState('listening');
          }
          if (content?.inputTranscription?.text) append('user', content.inputTranscription.text);
          if (content?.outputTranscription?.text) append('tutor', content.outputTranscription.text);
          for (const part of content?.modelTurn?.parts || []) {
            if (!part.inlineData?.data || !r.output) continue;
            const raw = atob(part.inlineData.data); const bytes = Uint8Array.from(raw, c => c.charCodeAt(0));
            const pcm = new Int16Array(bytes.buffer);
            const rate = Number(part.inlineData.mimeType?.match(/rate=(\d+)/)?.[1]) || 24000;
            const buffer = r.output.createBuffer(1, pcm.length, rate);
            const samples = buffer.getChannelData(0);
            for (let i = 0; i < pcm.length; i++) samples[i] = pcm[i] / 32768;
            const source = r.output.createBufferSource(); source.buffer = buffer; source.connect(r.output.destination);
            r.sources.add(source); const start = Math.max(r.next, r.output.currentTime + 0.02); r.next = start + buffer.duration;
            source.onended = () => { r.sources.delete(source); if (!r.sources.size && id === epoch.current) setState('listening'); };
            source.start(start); setState('speaking');
          }
        },
        onerror: () => { if (id === epoch.current) { disconnect(); setError('Se interrumpió la conexión. Puedes volver a conectar.'); setState('error'); } },
        onclose: () => { if (id === epoch.current) { disconnect(); setError('La sesión terminó. Puedes volver a conectar.'); } },
      } });
      if (id !== epoch.current) { session.close(); return; }
      r.session = session;
      const source = r.input.createMediaStreamSource(stream);
      const node = new AudioWorkletNode(r.input, 'tutor-microphone'); r.node = node;
      node.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
        if (id !== epoch.current) return;
        const bytes = new Uint8Array(event.data); let binary = '';
        for (const byte of bytes) binary += String.fromCharCode(byte);
        session.sendRealtimeInput({ audio: { data: btoa(binary), mimeType: 'audio/pcm;rate=16000' } });
      };
      const mute = r.input.createGain(); mute.gain.value = 0;
      source.connect(node); node.connect(mute); mute.connect(r.input.destination);
      setState('listening');
    } catch {
      if (id !== epoch.current) return;
      disconnect(); setError('No se pudo iniciar el modo directo. Revisa el permiso del micrófono y la configuración del servicio. El chat continúa disponible.'); setState('error');
    }
  };
  return { state, error, transcript, connect, disconnect, active: state === 'listening' || state === 'speaking' || state === 'connecting' };
}
