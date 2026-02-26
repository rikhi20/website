import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  // ✅ Custom domain serves from site root (https://rikhi.net/)
  // This ensures assets load from /assets/... instead of /website/assets/...
  base: "/",

  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        home: resolve(__dirname, "index.html"),
        projects: resolve(__dirname, "projects.html"),
        blog: resolve(__dirname, "blog.html"),
        writing: resolve(__dirname, "writing.html"),
        speaking: resolve(__dirname, "speaking.html"),
        resume: resolve(__dirname, "resume.html"),
        contact: resolve(__dirname, "contact.html"),
      },
    },
  },
});
