import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const resolveVersion = () => {
  if (process.env.APP_VERSION) return process.env.APP_VERSION.trim();
  try {
    return execSync('git describe --tags --always', {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
  } catch {
    try {
      const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'));
      return `v${pkg.version}` || 'v2.1.0';
    } catch {
      return 'v2.1.0';
    }
  }
};

const appVersion = resolveVersion();

const swVersionPlugin = () => ({
  name: 'sw-version-plugin',
  closeBundle() {
    const swPath = path.resolve(__dirname, 'dist/sw.js');
    if (fs.existsSync(swPath)) {
      const content = fs.readFileSync(swPath, 'utf-8');
      const updated = content.replace(/__SW_VERSION__/g, appVersion);
      fs.writeFileSync(swPath, updated, 'utf-8');
      console.log(`[sw-version-plugin] Injected version '${appVersion}' into dist/sw.js`);
    }
  }
});

export default defineConfig({
  plugins: [vue(), swVersionPlugin()],
  define: {
    __APP_VERSION__: JSON.stringify(appVersion)
  },
  server: {
    host: true,
    proxy: { '/api': 'http://localhost:3000' }
  }
});
