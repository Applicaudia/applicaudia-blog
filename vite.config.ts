import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import diagramsPlugin from './vite-plugin-diagrams'

// https://vite.dev/config/
export default defineConfig({
  base: '/blog/',
  plugins: [react(), diagramsPlugin()],
})
