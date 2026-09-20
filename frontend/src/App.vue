<template>
  <div class="app-container">
    <header class="app-header">
      <h1>Attestation Présence Esisar</h1>
    </header>

    <main class="app-content">
      <LoginView v-if="!isAuthenticated" @login="handleLogin" />
      <DashboardView v-else @logout="handleLogout" :user="currentUser" />
    </main>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import LoginView from './views/LoginView.vue';
import DashboardView from './views/DashboardView.vue';

export default {
  components: {
    LoginView,
    DashboardView
  },
  setup() {
    const isAuthenticated = ref(false);
    const currentUser = ref(null);

    onMounted(() => {
      const storedUser = localStorage.getItem('presenceUser');
      if (storedUser) {
        try {
          currentUser.value = JSON.parse(storedUser);
          isAuthenticated.value = true;
        } catch (e) {
          console.error('Failed to parse stored user:', e);
        }
      }
    });

    const handleLogin = (userData) => {
      currentUser.value = userData;
      isAuthenticated.value = true;
      // Simple obfuscation for password storage (not production-grade encryption)
      const obfuscatedData = {
        ...userData,
        password: btoa(userData.password)
      };
      localStorage.setItem('presenceUser', JSON.stringify(obfuscatedData));
    };

    const handleLogout = () => {
      localStorage.removeItem('presenceUser');
      currentUser.value = null;
      isAuthenticated.value = false;
    };

    return {
      isAuthenticated,
      currentUser,
      handleLogin,
      handleLogout
    };
  }
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
