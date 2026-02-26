import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  base: "/website/",   // 👈 REQUIRED for GitHub Pages project repo

  build: {
    rollupOptions: {
      input: {
        home: resolve(__dirname, "index.html"),
        projects: resolve(__dirname, "projects.html"),
        blog: resolve(__dirname, "blog.html"),
        writing: resolve(__dirname, "writing.html"),
        speaking: resolve(__dirname, "speaking.html"),
        resume: resolve(__dirname, "resume.html"),
        contact: resolve(__dirname, "contact.html")
      }
    }
  }
});
