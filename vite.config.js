import { defineConfig } from 'vite';

export default defineConfig({
  // 'spa' devuelve index.html para cualquier ruta (/projects/:slug, /about), en dev y en preview.
  appType: 'spa',
  server: { port: 5173 },
  preview: { port: 4173 }
});
