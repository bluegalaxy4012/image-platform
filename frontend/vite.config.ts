import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    basicSsl({
      name: 'frontendssl',
      certDir: '../nginx/certs',
    }),
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    https: true,
    // proxy: {
    //   '/docs': {
    //     target: 'https://13.51.201.9:8000',
    //     changeOrigin: true,
    //     secure: false,
    //   },
    //   '/register': {
    //     target: 'https://13.51.201.9:8000',
    //     changeOrigin: true,
    //     secure: false,
    //   },
    //   '/login': {
    //     target: 'https://13.51.201.9:8000',
    //     changeOrigin: true,
    //     secure: false,
    //   },
    //   '/images': {
    //     target: 'https://13.51.201.9:8000',
    //     changeOrigin: true,
    //     secure: false,
    //   },
    //   '/upload': {
    //     target: 'https://13.51.201.9:8000',
    //     changeOrigin: true,
    //     secure: false,
    //   },
    // }
  }
})
