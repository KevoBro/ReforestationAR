import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      three: fileURLToPath(new URL("./node_modules/@needle-tools/engine/node_modules/three", import.meta.url)),
    },
  },
  server: {
    allowedHosts: ["resting-appellatively-caylee.ngrok-free.dev"],
  },
})
