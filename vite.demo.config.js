import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Demo build for GitHub Pages: same app, but Firebase and the AI backend are replaced by
// in-browser stand-ins in ./demo, and the data is the sample set from src/data.
// Build with: npm run build:demo
const root = path.dirname(fileURLToPath(import.meta.url))
const demo = (f) => path.join(root, 'demo', f)

const banner = `<div id="demo-ribbon" style="position:fixed;z-index:9999;right:12px;bottom:12px;font:600 12px/1.3 system-ui,sans-serif;background:#4f46e5;color:#fff;padding:8px 12px;border-radius:999px;box-shadow:0 8px 24px rgba(0,0,0,.25)">Demo · sample data · nothing is saved</div>
<script>
  // the AI Insight and manual-entry pages call a local backend; in the demo, fail fast so the built-in fallback is used
  (function(){ var f = window.fetch; window.fetch = function(u){ if (String(u).indexOf('localhost:8000') !== -1) return Promise.reject(new Error('demo')); return f.apply(this, arguments); }; })();
</script>`

export default defineConfig({
  base: './',
  envDir: demo('env'), // keeps .env.local (Firebase keys) out of the demo bundle
  plugins: [
    react(),
    { name: 'demo-banner', transformIndexHtml: (html) => html.replace('<body>', '<body>' + banner) },
  ],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: [
      { find: /^.*context\/AnalysisContext\.jsx$/, replacement: demo('AnalysisContext.demo.jsx') },
      { find: /^(\.\.?\/)+firebase\.js$/, replacement: demo('mock-firebase.js') },
      { find: /^firebase\/firestore$/, replacement: demo('mock-firestore.js') },
      { find: /^react-router-dom-real$/, replacement: path.join(root, 'node_modules/react-router-dom/dist/index.mjs') },
      { find: /^react-router-dom$/, replacement: demo('router-shim.js') },
    ],
  },
  build: { outDir: 'dist-demo', emptyOutDir: true, chunkSizeWarningLimit: 2000 },
})
