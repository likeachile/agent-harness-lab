import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' : fonctionne à la racine comme dans un sous-dossier Nginx (ex. /harness/).
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { target: 'es2020' },
});
