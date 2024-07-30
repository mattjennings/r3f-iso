import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import AutoImport from 'unplugin-auto-import/vite'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      src: '/src',
    },
  },
  plugins: [
    react(),

    AutoImport({
      dts: 'src/auto-imports.d.ts',
      imports: ['react'],
    }),
    AutoImport({
      dts: false,
      imports: [
        {
          from: 'three',
          imports: [['*', 'THREE']],
        },
      ],
    }),
  ],
})
