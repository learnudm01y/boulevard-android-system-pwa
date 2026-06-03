import { defineConfig } from 'vite';

export default defineConfig({
  // public/ files are served as-is (sw.js, icons/, sounds/, manifest.json, new_logo.png)
  publicDir: 'public',

  build: {
    // Output directory for Capacitor (webDir: "dist" in capacitor.config.json)
    outDir: 'dist',

    rollupOptions: {
      output: {
        // Keep JS at js/app.js (no hash) so service worker cache paths stay valid
        entryFileNames: 'js/app.js',
        chunkFileNames: 'js/[name].js',
        // Keep CSS at css/style.css (no hash)
        assetFileNames: (assetInfo) => {
          if (assetInfo.names?.some(n => n.endsWith('.css')) || assetInfo.name?.endsWith('.css')) {
            return 'css/style.css';
          }
          return 'assets/[name][extname]';
        },
      },
    },
  },
});
