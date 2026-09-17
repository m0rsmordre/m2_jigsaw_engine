import { createRequire } from 'node:module'
import path from 'node:path'
import fs from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const require = createRequire(import.meta.url)
// CJS package
const obfuscator = require('rollup-plugin-obfuscator') as (opts: object) => import('rollup').Plugin

/** Serve public page folders index.html for AdSense crawl pages. */
function staticHtmlPages(): Plugin {
  const pages = [
    'calendar',
    'how-to',
    'rules',
    'about',
    'contact',
    'terms',
    'privacy',
    'cookie-policy',
  ]
  return {
    name: 'static-html-pages',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const raw = req.url?.split('?')[0] || ''
        for (const page of pages) {
          if (raw === `/${page}` || raw === `/${page}/`) {
            req.url = `/${page}/index.html`
            break
          }
        }
        next()
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
        const raw = req.url?.split('?')[0] || ''
        for (const page of pages) {
          if (raw === `/${page}` || raw === `/${page}/`) {
            const file = path.join(server.config.root, 'dist', page, 'index.html')
            if (fs.existsSync(file)) {
              req.url = `/${page}/index.html`
            }
            break
          }
        }
        next()
      })
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), staticHtmlPages()],
  worker: {
    format: 'es',
  },
  build: {
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      plugins:
        mode === 'production'
          ? [
              obfuscator({
                include: ['**/*.js'],
                exclude: ['**/node_modules/**', '**/tablebase.worker*.js'],
                options: {
                  compact: true,
                  controlFlowFlattening: false,
                  deadCodeInjection: false,
                  debugProtection: false,
                  disableConsoleOutput: true,
                  identifierNamesGenerator: 'hexadecimal',
                  renameGlobals: false,
                  rotateStringArray: true,
                  selfDefending: false,
                  stringArray: true,
                  stringArrayThreshold: 0.6,
                  transformObjectKeys: false,
                },
              }),
            ]
          : [],
    },
  },
}))
