import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Mobile-first PWA. Service worker and manifest are hand-written in /public
// (no build-time plugin) to keep dependencies minimal and the offline story
// easy to reason about.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
