import { createApp } from './src/app.js';
import { config } from './src/config.js';

const server = createApp().listen(config.port, () => {
  console.log(`Serveur démarré sur le port ${config.port}`);
});

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
