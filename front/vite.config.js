import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // sockjs-client ocekuje Node-ovu 'global' promenljivu koje u browseru nema
    global: 'window',
  },
});
