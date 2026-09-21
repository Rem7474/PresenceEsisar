<template>
  <div class="login-container">
    <div class="brand">
      <img class="logo" src="/icon.svg" alt="">
      <h1>Présence Esisar</h1>
      <p>Envoyez votre feuille de présence en quelques secondes.</p>
    </div>

    <form class="card login-card" @submit.prevent="handleSubmit">
      <h2>{{ smtpEnabled ? 'Première connexion' : 'Votre nom' }}</h2>

      <div class="field">
        <label for="name">Nom complet</label>
        <input
          id="name"
          v-model.trim="form.name"
          type="text"
          placeholder="Jean Dupont"
          autocomplete="name"
          maxlength="100"
          required
        >
      </div>

      <div v-if="smtpEnabled" class="field">
        <label for="email">Identifiant / E-mail</label>
        <input
          id="email"
          v-model.trim="form.email"
          type="email"
          inputmode="email"
          placeholder="Votre e-mail Esisar"
          autocomplete="username"
          autocapitalize="none"
          maxlength="254"
          :required="smtpEnabled"
        >
      </div>

      <div v-if="smtpEnabled" class="field">
        <label for="password">Mot de passe (SMTP)</label>
        <div class="password-wrap">
          <input
            id="password"
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Mot de passe de votre messagerie"
            autocomplete="current-password"
            maxlength="256"
            :required="smtpEnabled"
          >
          <button
            type="button"
            class="toggle-password"
            :aria-label="showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
            @click="showPassword = !showPassword"
          >
            <AppIcon :name="showPassword ? 'eye-off' : 'eye'" />
          </button>
        </div>
      </div>

      <p class="privacy">
        <AppIcon name="lock" :size="16" />
        <span>{{ smtpEnabled ? 'Chiffré et mémorisé' : 'Mémorisé' }} uniquement sur cet appareil.</span>
      </p>

      <button type="submit" class="btn btn-primary">Continuer</button>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import AppIcon from '../components/AppIcon.vue';

defineProps({
  smtpEnabled: { type: Boolean, default: true }
});
const emit = defineEmits(['login']);

const form = reactive({ name: '', email: '', password: '' });
const showPassword = ref(false);

const handleSubmit = () => {
  emit('login', { ...form });
  Object.assign(form, { name: '', email: '', password: '' });
};
</script>

<style scoped>
.login-container {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  padding-top: 1.5rem;
}

.brand {
  text-align: center;
}

.logo {
  width: 84px;
  height: 84px;
  border-radius: 22px;
  box-shadow: 0 10px 28px color-mix(in srgb, var(--primary) 35%, transparent);
}

.brand h1 {
  margin-top: 1rem;
  font-size: 1.75rem;
  font-weight: 750;
  letter-spacing: -0.02em;
}

.brand p {
  margin-top: 0.35rem;
  color: var(--muted);
}

.login-card {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  padding: 1.5rem;
}

.login-card h2 {
  font-size: 1.15rem;
  font-weight: 650;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--muted);
}

.field input {
  width: 100%;
  min-height: 52px;
  padding: 0 1rem;
  background: var(--surface-2);
  border: 2px solid transparent;
  border-radius: var(--radius-sm);
  font-size: 1rem; /* 16 px : évite le zoom automatique d'iOS */
  transition: border-color 0.2s ease, background-color 0.2s ease;
}

.field input::placeholder {
  color: color-mix(in srgb, var(--muted) 70%, transparent);
}

.field input:focus {
  outline: none;
  background: var(--surface);
  border-color: var(--primary);
}

.password-wrap {
  position: relative;
}

.password-wrap input {
  padding-right: 3.25rem;
}

.toggle-password {
  position: absolute;
  top: 50%;
  right: 0.35rem;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  transform: translateY(-50%);
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
}

.privacy {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--muted);
}
</style>
