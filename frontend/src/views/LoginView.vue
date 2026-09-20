<template>
  <div class="login-container">
    <div class="login-card">
      <h2>Première Connexion</h2>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="name">Nom Complet</label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            placeholder="Ex: Jean Dupont"
            required
          >
        </div>

        <div class="form-group">
          <label for="email">Identifiant / E-mail</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            placeholder="Ex: jean.dupont@esisar.grenoble-inp.fr"
            required
          >
        </div>

        <div class="form-group">
          <label for="password">Mot de passe (SMTP)</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            placeholder="Mot de passe pour l'authentification SMTP"
            required
          >
          <small>⚠️ Nécessaire pour envoyer les emails via le serveur SMTP</small>
        </div>

        <button type="submit" class="btn-primary">Continuer</button>
      </form>
    </div>
  </div>
</template>

<script>
import { reactive } from 'vue';

export default {
  emits: ['login'],
  setup(props, { emit }) {
    const form = reactive({
      name: '',
      email: '',
      password: ''
    });

    const handleSubmit = () => {
      if (form.name && form.email && form.password) {
        emit('login', { ...form });
        form.name = '';
        form.email = '';
        form.password = '';
      }
    };

    return {
      form,
      handleSubmit
    };
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 1rem;
}

.login-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  width: 100%;
  max-width: 400px;
}

.login-card h2 {
  margin-bottom: 1.5rem;
  color: #333;
  text-align: center;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
  font-size: 0.95rem;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
  transition: border-color 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-group small {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.85rem;
  color: #666;
}

.btn-primary {
  width: 100%;
  padding: 0.75rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-primary:active {
  background: #1d4ed8;
}
</style>
