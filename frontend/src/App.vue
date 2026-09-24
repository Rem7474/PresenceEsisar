<template>
  <div class="app-shell">
    <main class="app-content">
      <InstallBanner />
      <template v-if="ready">
        <LoginView
          v-if="!user"
          :initial-user="initialUser"
          :smtp-enabled="config.smtpEnabled"
          @login="handleLogin"
        />
        <DashboardView
          v-else
          :user="user"
          :smtp-enabled="config.smtpEnabled"
          :recipient="config.recipient"
          :subject="config.subject"
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
const initialUser = ref({ name: '', email: '' });
const ready = ref(false);
// Si la config est injoignable (hors ligne), l'envoi SMTP reste proposé : le serveur a le dernier mot.
const config = ref({ smtpEnabled: true, recipient: '', subject: '' });

const loadConfig = async () => {
  try {
    config.value = { ...config.value, ...(await (await fetch('/api/config')).json()) };
  } catch (error) {
    console.error('Configuration indisponible:', error);
  }
};

const isValidEmail = (email) =>
  typeof email === 'string' &&
  email.length > 3 &&
  email.includes('@') &&
  email.includes('.');

onMounted(async () => {
  try {
    const [stored] = await Promise.all([loadCredentials(), loadConfig()]);
    if (stored) {
      const hasName = Boolean(stored.name?.trim());
      const hasEmail = Boolean(stored.email && isValidEmail(stored.email.trim()));

      if (hasName && hasEmail) {
        user.value = { name: stored.name.trim(), email: stored.email.trim() };
      } else {
        // Redirige vers la configuration avec le nom déjà pré-rempli si présent
        user.value = null;
        initialUser.value = {
          name: stored.name?.trim() || '',
          email: stored.email?.trim() || ''
        };
      }
    }
  } finally {
    ready.value = true;
  }
});

const persist = async (credentials) => {
  if (!canPersist()) return;
  try {
    await saveCredentials(credentials);
  } catch (error) {
    console.error('Mémorisation des informations impossible:', error);
  }
};

const handleLogin = async (credentials) => {
  const clean = {
    name: credentials.name.trim(),
    email: credentials.email.trim()
  };
  await persist(clean);
  user.value = clean;
};

const handleLogout = async () => {
  user.value = null;
  initialUser.value = { name: '', email: '' };
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
