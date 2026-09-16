import { createRequire } from 'node:module'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const require = createRequire(import.meta.url)
// CJS package
const obfuscator = require('rollup-plugin-obfuscator') as (opts: object) => import('rollup').Plugin

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
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
