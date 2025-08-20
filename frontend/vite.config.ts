import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
// import basicSsl from "@vitejs/plugin-basic-ssl";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // for self-signed
    // basicSsl({
    //   name: "frontendssl",
    //   certDir: "../nginx/certs",
    // }),
  ],
  server: {
    host: "0.0.0.0",
    port: 5173,
    https: true,
  },
});
