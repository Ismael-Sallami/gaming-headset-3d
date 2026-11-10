import { defineConfig } from 'vite';

/**
 * Configuración de compilación y servidor de desarrollo Vite para
 * AETHER NOVA PRO // ACOUSTIC TELEMETRY LAB.
 *
 * Optimiza el empaquetado de Three.js y GSAP en chunks dedicados
 * y habilita soporte ESNext para WebGL2 y Web Audio API.
 */
export default defineConfig({
  base: './',
  server: {
    port: 5173,
    open: false,
    host: true
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          gsap: ['gsap']
        }
      }
    }
  }
});
