import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv, type ProxyOptions } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Local only (dev server + `npm run preview`): forward /api to the backend so the browser stays same-origin.
  // Deployed builds are served by Nginx, which does its own proxying.
  // The Origin header is dropped: browser → proxy is same-origin, proxy → backend is server-to-server. Otherwise
  // the backend CORS list (HRM_CORS_ORIGINS, default only :5173) rejects `vite preview` on :4173 with 403.
  const toBackend = (target: string): ProxyOptions => ({
    target,
    changeOrigin: true,
    configure: (proxyServer) => proxyServer.on('proxyReq', (proxyReq) => proxyReq.removeHeader('origin'))
  })
  // Same split as the backend gateway (gateway-server application.yml). Specific prefixes first: the first match wins.
  const employeeTarget = env.VITE_EMPLOYEE_PROXY_TARGET || 'http://localhost:8083'
  /** host of one backend service: VITE_<NAME>_PROXY_TARGET or localhost:<port> */
  const service = (name: string, port: number) =>
    toBackend(env[`VITE_${name}_PROXY_TARGET`] || `http://localhost:${port}`)
  const proxy: Record<string, ProxyOptions> = {
    '/api/v1/employees': toBackend(employeeTarget),
    '/api/v1/org': toBackend(employeeTarget),
    '/api/v1/lifecycle': toBackend(employeeTarget),
    '/api/v1/performance': toBackend(employeeTarget),
    '/api/v1/training': toBackend(employeeTarget),
    '/api/v1/media': service('MEDIA', 8082),
    '/api/v1/attendance': service('ATTENDANCE', 8084),
    '/api/v1/recruitment': service('RECRUITMENT', 8085),
    '/api/v1/public/career': service('RECRUITMENT', 8085),
    '/api/v1/payroll': service('PAYROLL', 8086),
    '/api/v1/asset': service('ASSET', 8087),
    '/api/v1/meeting': service('MEETING', 8088),
    '/api/v1/document': service('DOCUMENT', 8089),
    '/api/v1/reports': service('REPORT', 8090),
    '/api': toBackend(env.VITE_PROXY_TARGET || 'http://localhost:8081')
  }
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
