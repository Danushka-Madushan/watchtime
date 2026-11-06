import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Emits data/movies.json into the dist folder during production build
 * so that the static GitHub Pages deployment can load the initial movie library.
 */
function copyDataPlugin(): Plugin {
  return {
    name: 'copy-data-file',
    generateBundle() {
      const dataFilePath = path.resolve(__dirname, 'data/movies.json');
      if (fs.existsSync(dataFilePath)) {
        this.emitFile({
          type: 'asset',
          fileName: 'data/movies.json',
          source: fs.readFileSync(dataFilePath, 'utf-8'),
        });
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  // Local development and local builds use './',
  // while GitHub Pages builds (in CI) use '/watchtime/'
  const isGitHubPages = Boolean(
    process.env.GITHUB_PAGES === 'true' ||
    (process.env.GITHUB_ACTIONS === 'true' && command === 'build')
  );

  const base = process.env.VITE_BASE_PATH ?? (isGitHubPages ? '/watchtime/' : './');

  return {
    plugins: [
      react(),
      tailwindcss(),
      copyDataPlugin(),
    ],
    base,
  };
});
