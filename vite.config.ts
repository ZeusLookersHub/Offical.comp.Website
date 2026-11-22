import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/',
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  build: {
    // docs/ holds the project's written documentation as well as the published site, so the out
    // dir is never emptied wholesale — scripts/clean-build-output.mjs removes just the previous
    // build's own files first. Emptying it deleted the committed markdown on every build.
    outDir: 'docs',
    emptyOutDir: false,
  },
})
