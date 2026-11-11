import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // TutorAvatar3D (three.js) se carga de forma diferida: ~510 kB min / ~129 kB gzip
    // en su propio chunk. Se eleva el umbral para no ensuciar la salida del build.
    chunkSizeWarningLimit: 700,
  },
})
