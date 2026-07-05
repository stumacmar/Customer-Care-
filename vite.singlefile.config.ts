import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// "Excel mode": pack the whole app into one self-contained .html file that
// can be emailed to someone and opened by double-click — no website, no
// install. publicDir is disabled because the PWA extras (manifest, service
// worker, icon) don't apply to a local file; their <link> tags 404 harmlessly.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  publicDir: false,
  build: {
    outDir: 'dist-single',
    sourcemap: false,
  },
})
