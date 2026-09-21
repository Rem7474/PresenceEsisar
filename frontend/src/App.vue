<template>
  <div class="app-shell">
    <main class="app-content">
      <InstallBanner />
      <template v-if="ready">
        <LoginView v-if="!user" :smtp-enabled="config.smtpEnabled" @login="handleLogin" />
        <DashboardView
          v-else
          :user="user"
          :smtp-enabled="config.smtpEnabled"
          :recipient="config.recipient"
          @logout="handleLogout"
        />
      </template>
    </main>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import LoginView from './views/LoginView.vue';
import DashboardView from './views/DashboardView.vue';
import InstallBanner from './components/InstallBanner.vue';
import { canPersist, clearCredentials, loadCredentials, saveCredentials } from './lib/credentials';

const user = ref(null);
const ready = ref(false);
// Si la config est injoignable (hors ligne), l'envoi SMTP reste proposé : le serveur a le dernier mot.
const config = ref({ smtpEnabled: true, recipient: '' });

const loadConfig = async () => {
  try {
    config.value = { ...config.value, ...(await (await fetch('/api/config')).json()) };
  } catch (error) {
    console.error('Configuration indisponible:', error);
  }
};

onMounted(async () => {
  try {
    const [stored] = await Promise.all([loadCredentials(), loadConfig()]);
    user.value = reconcile(stored);
  } finally {
    ready.value = true;
  }
});

// Aligne l'identité mémorisée sur le mode courant (le flag SMTP peut changer entre deux déploiements).
const reconcile = (stored) => {
  if (!stored) return null;
  if (config.value.smtpEnabled) return stored.email && stored.password ? stored : null;
  const nameOnly = { name: stored.name };
  if (stored.email || stored.password) persist(nameOnly); // purge l'ancien mot de passe chiffré
  return nameOnly;
};

const persist = async (credentials) => {
  if (!canPersist()) return;
  try {
    await saveCredentials(credentials);
  } catch (error) {
    console.error('Mémorisation des identifiants impossible:', error);
  }
};

const handleLogin = async (credentials) => {
  await persist(credentials); // avant l'affichage : un rechargement immédiat ne doit pas perdre l'identité
  user.value = credentials;
};

const handleLogout = async () => {
  user.value = null;
  await clearCredentials();
};
</script>

<style scoped>
.app-shell {
  min-height: 100dvh;
}

.app-content {
  width: 100%;
  max-width: 520px;
  margin: 0 auto;
  padding: calc(1rem + var(--safe-top)) calc(1rem + var(--safe-right)) 1rem calc(1rem + var(--safe-left));
}
</style>
