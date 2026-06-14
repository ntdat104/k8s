import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// ============================================================
// Vite config
// - Khi dev local (npm run dev): proxy /api -> backend local
//   (vd: backend chay o localhost:8080 hoac qua kubectl port-forward)
// - Khi build production: code goi /api/... , nginx trong container
//   se proxy /api -> http://backend-service:8080 (DNS noi bo K8s)
// ============================================================
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
