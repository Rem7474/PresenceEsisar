<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <div class="user-info">
        <span>Bienvenue, <strong>{{ user.name }}</strong></span>
      </div>
      <button class="btn-logout" @click="$emit('logout')">Déconnexion</button>
    </div>

    <div class="dashboard-content">
      <div class="upload-section">
        <div class="upload-card">
          <h2>Télécharger Votre Feuille de Présence</h2>

          <div class="week-info">
            <p>Semaine actuelle: <strong>{{ week }}</strong></p>
          </div>

          <div class="upload-actions">
            <button class="btn-camera" :disabled="isLoading" @click="cameraInput.click()">
              📷 Prendre une Photo
            </button>
            <button class="btn-file" :disabled="isLoading" @click="fileInput.click()">
              📁 Sélectionner un Fichier
            </button>
            <input
              ref="cameraInput"
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              @change="handleFileSelect"
            >
            <input
              ref="fileInput"
              type="file"
              :accept="ACCEPTED_TYPES.join(',')"
              hidden
              @change="handleFileSelect"
            >
          </div>

          <div v-if="selectedFile" class="file-preview">
            <p>Fichier sélectionné: <strong>{{ selectedFile.name }}</strong></p>
            <img v-if="previewUrl" :src="previewUrl" alt="Aperçu" class="preview-image">
          </div>

          <div class="filename-display">
            <label>Nom du fichier final:</label>
            <div class="filename-box">
              <code>{{ generatedFilename }}</code>
            </div>
          </div>

          <button class="btn-submit" :disabled="!selectedFile || isLoading" @click="handleSubmit">
            {{ isLoading ? 'Envoi en cours...' : '✉️ Envoyer' }}
          </button>

          <button class="btn-external" :disabled="!selectedFile || isLoading" @click="handleExternalMail">
            📤 Envoyer avec mon application e-mail
          </button>

          <div v-if="message" :class="['message', messageType]" role="status">
            {{ message }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { isoWeek } from '../lib/week';
import { ACCEPTED_TYPES, MAX_FILE_SIZE, buildFilename } from '../lib/filename';
import { MAIL_BODY, buildMailto, buildSubject } from '../lib/mail';

const props = defineProps({
  user: { type: Object, required: true }
});
defineEmits(['logout']);

const cameraInput = ref(null);
const fileInput = ref(null);
const selectedFile = ref(null);
const previewUrl = ref(null);
const isLoading = ref(false);
const message = ref('');
const messageType = ref('');

const week = isoWeek();
const recipient = ref('');
let messageTimer;

const generatedFilename = computed(() =>
  selectedFile.value
    ? buildFilename(props.user.name, week, selectedFile.value.type)
    : 'Attestation présence P2027- [ NOM ] - Esisar- Semaine [ Numero ]'
);

const showMessage = (text, type) => {
  message.value = text;
  messageType.value = type;
  clearTimeout(messageTimer);
  messageTimer = setTimeout(() => (message.value = ''), 5000);
};

const resetSelection = () => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  selectedFile.value = null;
  previewUrl.value = null;
  cameraInput.value.value = '';
  fileInput.value.value = '';
};

const handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  if (!ACCEPTED_TYPES.includes(file.type)) {
    resetSelection();
    return showMessage('Format non supporté : utilisez une image JPEG, PNG, WebP ou un PDF.', 'error');
  }
  if (file.size > MAX_FILE_SIZE) {
    resetSelection();
    return showMessage('Fichier trop volumineux (10 Mo maximum).', 'error');
  }

  resetSelection();
  selectedFile.value = file;
  previewUrl.value = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
};

const handleSubmit = async () => {
  if (!selectedFile.value) return;

  isLoading.value = true;
  message.value = '';

  try {
    const body = new FormData();
    body.append('file', selectedFile.value);
    body.append('name', props.user.name);
    body.append('email', props.user.email);
    body.append('password', props.user.password);
    body.append('week', String(week));

    const response = await fetch('/api/upload', { method: 'POST', body });
    const result = await response.json().catch(() => ({}));

    if (response.ok) {
      showMessage('Fichier envoyé avec succès !', 'success');
      resetSelection();
    } else {
      showMessage(result.error || "Erreur lors de l'envoi.", 'error');
    }
  } catch (error) {
    console.error('Erreur réseau:', error);
    showMessage('Erreur réseau ou serveur.', 'error');
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
  try {
    recipient.value = (await (await fetch('/api/config')).json()).recipient ?? '';
  } catch (error) {
    console.error('Destinataire indisponible:', error);
  }
});

const downloadFile = (file) => {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
};

// Sans SMTP : partage natif du fichier (mobile), sinon téléchargement + mailto: (bureau).
// Le partage doit être déclenché directement par le clic, sans attente préalable.
const handleExternalMail = async () => {
  if (!selectedFile.value) return;

  const subject = buildSubject(generatedFilename.value);
  const file = new File([selectedFile.value], generatedFilename.value, { type: selectedFile.value.type });
  const shareData = { files: [file], title: subject, text: `${MAIL_BODY}\n\nDestinataire : ${recipient.value}` };

  if (navigator.canShare?.(shareData)) {
    try {
      await navigator.share(shareData);
      return showMessage(`Partage effectué. Destinataire de l'attestation : ${recipient.value}`, 'success');
    } catch (error) {
      if (error.name === 'AbortError') return;
      console.error('Partage impossible, repli sur mailto:', error);
    }
  }

  downloadFile(file);
  window.location.href = buildMailto(recipient.value, subject, MAIL_BODY);
  showMessage('Fichier téléchargé : joignez-le au mail qui vient de s\'ouvrir.', 'success');
};

onBeforeUnmount(() => {
  clearTimeout(messageTimer);
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
});
</script>

<style scoped>
.dashboard-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 1rem;
  border-bottom: 1px solid #eee;
  margin-bottom: 1.5rem;
  border-radius: 8px;
}

.user-info {
  font-size: 0.95rem;
  color: #666;
}

.btn-logout {
  padding: 0.5rem 1rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.3s;
}

.btn-logout:hover {
  background: #dc2626;
}

.dashboard-content {
  flex: 1;
}

.upload-section {
  display: flex;
  justify-content: center;
}

.upload-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  width: 100%;
  max-width: 500px;
}

.upload-card h2 {
  margin-bottom: 1.5rem;
  color: #333;
  text-align: center;
}

.week-info {
  background: #eff6ff;
  border-left: 4px solid #3b82f6;
  padding: 1rem;
  margin-bottom: 1.5rem;
  border-radius: 4px;
}

.week-info p {
  margin: 0;
  font-size: 0.95rem;
}

.upload-actions {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.btn-camera,
.btn-file {
  flex: 1;
  min-width: 120px;
  padding: 0.75rem;
  background: #e5e7eb;
  border: 2px solid #d1d5db;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
  font-size: 0.9rem;
}

.btn-camera:hover:not(:disabled),
.btn-file:hover:not(:disabled) {
  background: #d1d5db;
  border-color: #9ca3af;
}

.btn-camera:disabled,
.btn-file:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.file-preview {
  background: #f3f4f6;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1.5rem;
}

.file-preview p {
  margin: 0 0 0.75rem 0;
  font-size: 0.9rem;
  color: #666;
}

.preview-image {
  max-width: 100%;
  max-height: 200px;
  border-radius: 4px;
}

.filename-display {
  margin-bottom: 1.5rem;
}

.filename-display label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
  font-size: 0.95rem;
}

.filename-box {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  padding: 1rem;
  border-radius: 4px;
  word-break: break-all;
}

.filename-box code {
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 0.85rem;
  color: #374151;
}

.btn-submit {
  width: 100%;
  padding: 0.75rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-submit:hover:not(:disabled) {
  background: #059669;
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-external {
  width: 100%;
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: white;
  color: #2563eb;
  border: 2px solid #2563eb;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-external:hover:not(:disabled) {
  background: #eff6ff;
}

.btn-external:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.message {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 4px;
  text-align: center;
  font-weight: 500;
}

.message.success {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #6ee7b7;
}

.message.error {
  background: #fee2e2;
  color: #7f1d1d;
  border: 1px solid #fca5a5;
}

@media (max-width: 640px) {
  .upload-card {
    padding: 1.5rem;
  }

  .upload-actions {
    flex-direction: column;
  }

  .btn-camera,
  .btn-file {
    width: 100%;
  }
}
</style>
