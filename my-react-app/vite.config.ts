import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL("./index.html", import.meta.url)),
        singleModel: fileURLToPath(new URL("./single-model.html", import.meta.url)),
        multiModel: fileURLToPath(new URL("./multi-model.html", import.meta.url)),
      },
    },
  },
  resolve: {
    alias: {
      three: fileURLToPath(new URL("./node_modules/@needle-tools/engine/node_modules/three", import.meta.url)),
    },
  },
  server: {
    allowedHosts: ["resting-appellatively-caylee.ngrok-free.dev", "aozwb-153-33-215-110.run.pinggy-free.link"],
  },
})
