import { createApp } from 'vue';
import App from './App.vue';
import './style.css';

if (typeof __APP_VERSION__ !== 'undefined') {
  console.info(`[Présence Esisar] Version: ${__APP_VERSION__}`);
}

createApp(App).mount('#app');

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('/sw.js').catch((error) => {
    console.error('Enregistrement du service worker impossible:', error);
  });
}
