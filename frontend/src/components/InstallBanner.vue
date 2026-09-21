<template>
  <div v-if="visible" class="install-banner" role="region" aria-label="Installation de l'application">
    <p v-if="installEvent">Installez l'application sur votre appareil pour l'ouvrir en un geste.</p>
    <p v-else>Pour installer l'application : touchez <strong>Partager</strong> puis <strong>Sur l'écran d'accueil</strong>.</p>
    <div class="install-actions">
      <button v-if="installEvent" class="btn-install" @click="install">Installer</button>
      <button class="btn-dismiss" @click="dismiss">Plus tard</button>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

const DISMISSED_KEY = 'installBannerDismissed';

const installEvent = ref(null);
const dismissed = ref(localStorage.getItem(DISMISSED_KEY) === '1');

const isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
// Safari iOS ne propose jamais d'installation : on affiche seulement la marche à suivre.
const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);

const visible = computed(() => !isStandalone && !dismissed.value && (installEvent.value || isIos));

const onBeforeInstallPrompt = (event) => {
  event.preventDefault();
  installEvent.value = event;
};
const onInstalled = () => {
  installEvent.value = null;
};

onMounted(() => {
  window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
  window.addEventListener('appinstalled', onInstalled);
});
onBeforeUnmount(() => {
  window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
  window.removeEventListener('appinstalled', onInstalled);
});

const install = async () => {
  const event = installEvent.value;
  installEvent.value = null; // l'événement n'est utilisable qu'une fois
  await event.prompt();
};

const dismiss = () => {
  dismissed.value = true;
  localStorage.setItem(DISMISSED_KEY, '1');
};
</script>

<style scoped>
.install-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.install-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-install,
.btn-dismiss {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
}

.btn-install {
  background: #2563eb;
  color: white;
  border: none;
}

.btn-dismiss {
  background: transparent;
  color: #374151;
  border: 1px solid #d1d5db;
}
</style>
