<template>
  <div class="app-container">
    <header class="app-header">
      <h1>Attestation Présence Esisar</h1>
    </header>

    <main class="app-content">
      <InstallBanner />
      <template v-if="ready">
        <LoginView v-if="!user" @login="handleLogin" />
        <DashboardView v-else :user="user" @logout="handleLogout" />
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

onMounted(async () => {
  try {
    user.value = await loadCredentials();
  } finally {
    ready.value = true;
  }
});

const handleLogin = async (credentials) => {
  user.value = credentials;
  if (!canPersist()) return;
  try {
    await saveCredentials(credentials);
  } catch (error) {
    console.error('Mémorisation des identifiants impossible:', error);
  }
};

const handleLogout = async () => {
  user.value = null;
  await clearCredentials();
};
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f5f5f5;
}

.app-header {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.app-header h1 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.app-content {
  flex: 1;
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

@media (max-width: 640px) {
  .app-header h1 {
    font-size: 1.25rem;
  }

  .app-content {
    padding: 0.5rem;
  }
}
</style>
