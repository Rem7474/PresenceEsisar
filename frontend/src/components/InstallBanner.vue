<template>
  <div v-if="visible" class="install-banner" role="region" aria-label="Installation de l'application">
    <span class="install-icon"><AppIcon name="download" :size="22" /></span>
    <p v-if="installEvent">Installez l'application pour l'ouvrir en un geste, comme une app native.</p>
    <p v-else>Pour installer : touchez <strong>Partager</strong> puis <strong>Sur l'écran d'accueil</strong>.</p>
    <div class="install-actions">
      <button v-if="installEvent" class="btn btn-install" @click="install">Installer</button>
      <button class="btn btn-ghost btn-dismiss" @click="dismiss">Plus tard</button>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import AppIcon from './AppIcon.vue';

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
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 0.5rem 0.85rem;
  background: var(--primary-soft);
  border-radius: var(--radius);
  padding: 0.9rem 1rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.install-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--primary);
  color: var(--on-primary);
}

.install-actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.btn-install {
  min-height: 40px;
  padding: 0 1.1rem;
  background: var(--primary);
  color: var(--on-primary);
  font-size: 0.95rem;
}
</style>
