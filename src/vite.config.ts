import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Proxy all /api requests to the BFS API server
      '/api': {
        target: 'https://dp-eastus-poc-txservices-apis.azurewebsites.net',
        changeOrigin: true,
        rewrite: (path) => {
          const newPath = path.replace(/^\/api/, '/1.0');
          console.log('🔄 Proxy rewrite:', path, '→', newPath);
          return newPath;
        },
        secure: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('❌ Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('📤 Proxying request:', req.method, req.url);
            console.log('   → Target URL:', proxyReq.path);
            console.log('   → Headers:', proxyReq.getHeaders());
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('📥 Proxy response:', proxyRes.statusCode, req.url);
            console.log('   → Content-Type:', proxyRes.headers['content-type']);
          });
        },
      },
    },
  },
})
