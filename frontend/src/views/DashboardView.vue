<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <div class="user-info">
        <span>Bienvenue, <strong>{{ user.name }}</strong></span>
      </div>
      <button @click="$emit('logout')" class="btn-logout">Déconnexion</button>
    </div>

    <div class="dashboard-content">
      <div class="upload-section">
        <div class="upload-card">
          <h2>Télécharger Votre Feuille de Présence</h2>

          <div class="week-info">
            <p>Semaine actuelle: <strong>{{ currentWeek }}</strong></p>
          </div>

          <div class="upload-actions">
            <button @click="openCamera" class="btn-camera" :disabled="isLoading">
              📷 Prendre une Photo
            </button>
            <button @click="openFileSelector" class="btn-file" :disabled="isLoading">
              📁 Sélectionner un Fichier
            </button>
            <input
              ref="fileInput"
              type="file"
              accept="image/*,.pdf"
              style="display: none"
              @change="handleFileSelect"
            >
          </div>

          <div v-if="selectedFile" class="file-preview">
            <p>Fichier sélectionné: <strong>{{ selectedFile.name }}</strong></p>
            <img v-if="previewUrl && isImageFile" :src="previewUrl" alt="Preview" class="preview-image">
          </div>

          <div class="filename-display">
            <label>Nom du fichier final:</label>
            <div class="filename-box">
              <code>{{ generatedFilename }}</code>
            </div>
          </div>

          <button
            @click="handleSubmit"
            class="btn-submit"
            :disabled="!selectedFile || isLoading"
          >
            {{ isLoading ? 'Envoi en cours...' : '✉️ Envoyer' }}
          </button>

          <div v-if="message" :class="['message', messageType]">
            {{ message }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';

export default {
  props: {
    user: {
      type: Object,
      required: true
    }
  },
  emits: ['logout'],
  setup(props) {
    const fileInput = ref(null);
    const selectedFile = ref(null);
    const previewUrl = ref(null);
    const isLoading = ref(false);
    const message = ref('');
    const messageType = ref('');
    const currentWeek = ref(0);

    const isImageFile = computed(() => {
      if (!selectedFile.value) return false;
      return selectedFile.value.type.startsWith('image/');
    });

    const generatedFilename = computed(() => {
      if (!selectedFile.value) {
        return 'Attestation présence P2027- [ NOM ] - Esisar- Semaine [ Numero ]';
      }
      const ext = selectedFile.value.type.startsWith('image/') ? 'jpg' : 'pdf';
      return `Attestation présence P2027- ${props.user.name} - Esisar- Semaine ${currentWeek.value}.${ext}`;
    });

    const getWeekNumber = () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 1);
      const diff = now - start;
      const oneDay = 86400000;
      const day = Math.floor(diff / oneDay);
      const week = Math.ceil((day + start.getDay() + 1) / 7);
      return week;
    };

    onMounted(() => {
      currentWeek.value = getWeekNumber();
    });

    const openCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        setTimeout(() => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);
          stream.getTracks().forEach(track => track.stop());

          canvas.toBlob(blob => {
            const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
            selectedFile.value = file;
            previewUrl.value = URL.createObjectURL(blob);
          });
        }, 500);
      } catch (err) {
        showMessage('Erreur d\'accès à la caméra', 'error');
        console.error('Camera error:', err);
      }
    };

    const openFileSelector = () => {
      fileInput.value.click();
    };

    const handleFileSelect = (event) => {
      const file = event.target.files[0];
      if (file) {
        selectedFile.value = file;
        if (isImageFile.value) {
          previewUrl.value = URL.createObjectURL(file);
        }
      }
    };

    const handleSubmit = async () => {
      if (!selectedFile.value) return;

      isLoading.value = true;
      message.value = '';
      messageType.value = '';

      try {
        const formData = new FormData();
        formData.append('file', selectedFile.value);
        formData.append('user', JSON.stringify({
          name: props.user.name,
          email: props.user.email,
          password: props.user.password,
          week: currentWeek.value
        }));

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        const result = await response.json();

        if (response.ok) {
          showMessage('Fichier envoyé avec succès!', 'success');
          selectedFile.value = null;
          previewUrl.value = null;
          fileInput.value.value = '';
        } else {
          showMessage(result.error || 'Erreur lors de l\'envoi', 'error');
        }
      } catch (err) {
        showMessage('Erreur réseau ou serveur', 'error');
        console.error('Upload error:', err);
      } finally {
        isLoading.value = false;
      }
    };

    const showMessage = (text, type) => {
      message.value = text;
      messageType.value = type;
      setTimeout(() => {
        message.value = '';
      }, 5000);
    };

    return {
      fileInput,
      selectedFile,
      previewUrl,
      isLoading,
      message,
      messageType,
      currentWeek,
      isImageFile,
      generatedFilename,
      openCamera,
      openFileSelector,
      handleFileSelect,
      handleSubmit
    };
  }
};
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
