import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    host: 'localhost',
    port: 5173,
  },

  build: {
    outDir: "dist",
    sourcemap: false,
    chunkSizeWarningLimit: 1000,

    rollupOptions: {
      output: {
        manualChunks: {
          // Core React — always needed
          vendor: ["react", "react-dom", "react-router-dom"],

          // State management — separate chunk
          redux: ["@reduxjs/toolkit", "react-redux"],

          // Icons are large — isolate them so they don't bloat vendor
          icons: ["react-icons"],
        },
      },
    },
  },

  preview: {
    port: 4173,
    host: true,
  },
})