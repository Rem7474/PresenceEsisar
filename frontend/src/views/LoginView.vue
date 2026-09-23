<template>
  <div class="login-container">
    <div class="brand">
      <img class="logo" src="/icon.svg" alt="">
      <h1>Présence Esisar</h1>
      <p>Envoyez votre feuille de présence en quelques secondes.</p>
    </div>

    <form class="card login-card" @submit.prevent="handleSubmit">
      <h2>{{ isCompletingProfile ? 'Complétez votre profil' : 'Première connexion' }}</h2>

      <p v-if="isCompletingProfile" class="notice-info">
        Renseignez votre adresse e-mail afin de recevoir automatiquement une copie de vos attestations envoyées.
      </p>

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

      <div class="field">
        <label for="email">Adresse e-mail</label>
        <input
          id="email"
          v-model.trim="form.email"
          type="email"
          inputmode="email"
          placeholder="prenom.nom@grenoble-inp.org"
          autocomplete="email"
          autocapitalize="none"
          maxlength="254"
          required
        >
        <span class="hint">Une copie de l'attestation vous sera transmise à cette adresse.</span>
      </div>

      <p class="privacy">
        <AppIcon name="lock" :size="16" />
        <span>Mémorisé uniquement sur cet appareil.</span>
      </p>

      <button type="submit" class="btn btn-primary">Continuer</button>
    </form>
  </div>
</template>

<script setup>
import { computed, reactive, watch } from 'vue';
import AppIcon from '../components/AppIcon.vue';

const props = defineProps({
  smtpEnabled: { type: Boolean, default: true },
  initialUser: { type: Object, default: () => ({ name: '', email: '' }) }
});
const emit = defineEmits(['login']);

const form = reactive({
  name: props.initialUser?.name || '',
  email: props.initialUser?.email || ''
});

watch(
  () => props.initialUser,
  (val) => {
    if (val?.name && !form.name) form.name = val.name;
    if (val?.email && !form.email) form.email = val.email;
  },
  { deep: true, immediate: true }
);

const isCompletingProfile = computed(() => Boolean(props.initialUser?.name && !props.initialUser?.email));

const handleSubmit = () => {
  if (!form.name || !form.email) return;
  emit('login', { name: form.name.trim(), email: form.email.trim() });
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

.notice-info {
  margin: 0;
  padding: 0.75rem 0.9rem;
  background: var(--primary-soft);
  border-radius: var(--radius-sm);
  color: var(--primary-strong);
  font-size: 0.85rem;
  line-height: 1.4;
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

.hint {
  font-size: 0.8rem;
  color: var(--muted);
  line-height: 1.3;
}

.privacy {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--muted);
}
</style>
