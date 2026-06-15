import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// base is set to the repo name for GitHub Pages project sites (only on build);
// dev stays at '/' so local preview is http://localhost:5173/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/shoe-showcase/' : '/',
}))
