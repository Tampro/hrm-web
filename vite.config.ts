import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Local only (dev server + `npm run preview`): forward /api to the backend so the browser stays same-origin.
  // Deployed builds are served by Nginx, which does its own proxying.
  const proxy = { '/api': { target: env.VITE_PROXY_TARGET || 'http://localhost:8081', changeOrigin: true } }
  return {
    plugins: [tailwindcss(), reactRouter()],
    resolve: { tsconfigPaths: true },
    server: {
      proxy,
      // docs/ holds two WorkDo copies with their own node_modules/vendor (~200k files). Vite only ignores the root
      // node_modules, so the initial chokidar scan blocked the event loop for ~1 min: dev server and `vite preview`
      // (React Router's child compiler is a dev server too) stalled asset requests up to 16 s. Measured 2026-11-19.
      watch: { ignored: ['**/docs/**', '**/build/**', '**/test-results/**', '**/playwright-report/**'] }
    },
    // `npm run preview` serves the SPA build (build/client); E2E tests run against it
    preview: { proxy }
  }
})
