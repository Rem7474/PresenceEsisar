<template>
  <div :class="['dashboard-container', { 'single-action': !smtpEnabled }]">
    <header class="topbar">
      <div class="avatar" aria-hidden="true">{{ initials }}</div>
      <div class="who">
        <span class="hello">Bonjour</span>
        <strong class="user-name">{{ user.name }}</strong>
      </div>
      <button class="icon-btn btn-logout" aria-label="Se déconnecter" @click="$emit('logout')">
        <AppIcon name="logout" />
      </button>
    </header>

    <section class="card hero">
      <div class="hero-header">
        <span class="eyebrow">Feuille de présence P2027</span>
        <button
          v-if="selectedWeek !== currentWeek"
          class="btn-reset-week"
          type="button"
          aria-label="Revenir à la semaine actuelle"
          @click="resetWeek"
        >
          <AppIcon name="rotate-ccw" :size="13" />
          <span>Semaine actuelle ({{ currentWeek }})</span>
        </button>
      </div>

      <div class="week-picker">
        <button
          class="week-nav-btn"
          type="button"
          :disabled="selectedWeek <= 1"
          aria-label="Semaine précédente"
          @click="decrementWeek"
        >
          <AppIcon name="chevron-left" :size="22" />
        </button>

        <div class="week-info">
          <span class="week-label">Semaine</span>
          <span class="week-number">{{ selectedWeek }}</span>
        </div>

        <button
          class="week-nav-btn"
          type="button"
          :disabled="selectedWeek >= 53"
          aria-label="Semaine suivante"
          @click="incrementWeek"
        >
          <AppIcon name="chevron-right" :size="22" />
        </button>
      </div>
    </section>

    <section class="card capture">
      <template v-if="!selectedFile">
        <h2>Ajoutez votre feuille</h2>
        <div class="tiles">
          <button class="tile btn-camera" :disabled="isLoading" @click="cameraInput.click()">
            <span class="tile-icon"><AppIcon name="camera" :size="26" /></span>
            <span>Prendre une photo</span>
          </button>
          <button class="tile btn-file" :disabled="isLoading" @click="fileInput.click()">
            <span class="tile-icon"><AppIcon name="file" :size="26" /></span>
            <span>Choisir un fichier</span>
          </button>
        </div>
      </template>

      <template v-else>
        <div class="preview">
          <img v-if="previewUrl" :src="previewUrl" alt="Aperçu de la feuille" class="preview-image">
          <div v-else class="pdf-tile">
            <AppIcon name="file" :size="44" />
            <span>PDF</span>
          </div>
        </div>
        <div class="file-meta">
          <span class="file-name">{{ selectedFile.name }}</span>
          <button class="btn btn-ghost btn-change" :disabled="isLoading" @click="resetSelection">Changer</button>
        </div>
      </template>

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

      <div class="filename-display">
        <span class="filename-label">Nom du fichier envoyé</span>
        <div class="filename-box">
          <code>{{ generatedFilename }}</code>
        </div>
      </div>

      <div class="filename-display recipient">
        <span class="filename-label">Objet du mail</span>
        <div class="filename-box">
          <code>{{ generatedSubject }}</code>
        </div>
      </div>

      <div v-if="recipient" class="filename-display recipient">
        <span class="filename-label">Destinataire</span>
        <div class="filename-box">
          <code>{{ recipient }}</code>
        </div>
      </div>

      <div v-if="user.email" class="filename-display recipient">
        <span class="filename-label">Copie envoyée à</span>
        <div class="filename-box">
          <code>{{ user.email }}</code>
        </div>
      </div>
    </section>

    <div class="action-bar">
      <Transition name="toast">
        <div v-if="message" :class="['message', messageType]" role="status">
          <AppIcon :name="messageType === 'success' ? 'check' : 'alert'" :size="20" />
          <span>{{ message }}</span>
        </div>
      </Transition>

      <div class="action-inner">
        <button v-if="smtpEnabled" class="btn btn-primary btn-submit" :disabled="!selectedFile || isLoading" @click="handleSubmit">
          <span v-if="isLoading" class="spinner" aria-hidden="true" />
          <AppIcon v-else name="send" />
          {{ isLoading ? 'Envoi en cours…' : 'Envoyer' }}
        </button>
        <button
          :class="['btn', 'btn-external', smtpEnabled ? 'btn-secondary' : 'btn-primary']"
          :disabled="!selectedFile || isLoading"
          @click="handleExternalMail"
        >
          <AppIcon name="mail" :size="smtpEnabled ? 18 : 20" />
          {{ smtpEnabled ? 'Envoyer avec mon application e-mail' : 'Envoyer par e-mail' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref } from 'vue';
import AppIcon from '../components/AppIcon.vue';
import { isoWeek } from '../lib/week';
import { ACCEPTED_TYPES, MAX_FILE_SIZE, buildFilename } from '../lib/filename';
import { buildBody, buildMailto, buildSubject } from '../lib/mail';

const props = defineProps({
  user: { type: Object, required: true },
  smtpEnabled: { type: Boolean, default: true },
  recipient: { type: String, default: '' }
});
defineEmits(['logout']);

const cameraInput = ref(null);
const fileInput = ref(null);
const selectedFile = ref(null);
const previewUrl = ref(null);
const isLoading = ref(false);
const message = ref('');
const messageType = ref('');

const currentWeek = isoWeek();
const selectedWeek = ref(currentWeek);

const decrementWeek = () => {
  if (selectedWeek.value > 1) selectedWeek.value--;
};

const incrementWeek = () => {
  if (selectedWeek.value < 53) selectedWeek.value++;
};

const resetWeek = () => {
  selectedWeek.value = currentWeek;
};

let messageTimer;

const initials = computed(() =>
  props.user.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
);

const generatedFilename = computed(() =>
  selectedFile.value
    ? buildFilename(props.user.name, selectedWeek.value, selectedFile.value.type)
    : 'Attestation présence P2027-[ NOM ]-Esisar-Semaine [ Numero ]'
);

const generatedSubject = computed(() =>
  buildSubject(generatedFilename.value)
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
    body.append('week', String(selectedWeek.value));

    const response = await fetch('/api/upload', { method: 'POST', body });
    const result = await response.json().catch(() => ({}));

    if (response.ok) {
      showMessage('Fichier envoyé avec succès ! Une copie vous a été envoyée par e-mail.', 'success');
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
  const shareData = { files: [file], title: subject, text: `Objet : ${subject}\n\n${buildBody(subject)}` };

  if (navigator.canShare?.(shareData)) {
    // Le partage natif n'a pas de champ « À » : l'adresse est copiée pour être collée dans l'app mail.
    // La copie est lancée dans le même geste que le partage (sans attente) pour rester autorisée.
    const copied =
      props.recipient && navigator.clipboard
        ? navigator.clipboard.writeText(props.recipient).then(() => true, () => false)
        : Promise.resolve(false);
    try {
      await navigator.share(shareData);
      if (!props.recipient) return showMessage('Partage effectué.', 'success');
      return showMessage(
        (await copied)
          ? 'Partage effectué. Adresse du destinataire copiée dans le presse-papiers.'
          : `Partage effectué. Destinataire : ${props.recipient}`,
        'success'
      );
    } catch (error) {
      if (error.name === 'AbortError') return;
      console.error('Partage impossible, repli sur mailto:', error);
    }
  }

  downloadFile(file);
  window.location.href = buildMailto(props.recipient, subject, buildBody(subject));
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
  gap: 1rem;
  /* Réserve la place de la barre d'actions fixe */
  padding-bottom: calc(10.5rem + var(--safe-bottom));
}

.dashboard-container.single-action {
  padding-bottom: calc(7rem + var(--safe-bottom));
}

.topbar {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.25rem 0;
}

.avatar {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 55%, #7c3aed));
  color: var(--on-primary);
  font-weight: 700;
  letter-spacing: 0.02em;
}

.who {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  line-height: 1.2;
}

.hello {
  font-size: 0.8rem;
  color: var(--muted);
}

.user-name {
  overflow: hidden;
  font-size: 1.05rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hero {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: linear-gradient(140deg, var(--primary), color-mix(in srgb, var(--primary) 60%, #6d28d9));
  border-color: transparent;
  color: var(--on-primary);
}

.hero-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  min-height: 26px;
}

.eyebrow {
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  opacity: 0.85;
}

.btn-reset-week {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem 0.6rem;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 9999px;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s ease, transform 0.1s ease;
}

.btn-reset-week:hover {
  background: rgba(255, 255, 255, 0.28);
}

.btn-reset-week:active {
  transform: scale(0.95);
}

.week-picker {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.week-nav-btn {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 50%;
  color: #fff;
  cursor: pointer;
  transition: background-color 0.15s ease, transform 0.1s ease, opacity 0.15s ease;
}

.week-nav-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.28);
}

.week-nav-btn:active:not(:disabled) {
  transform: scale(0.92);
}

.week-nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.week-info {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
}

.week-label {
  font-size: 1.15rem;
  font-weight: 500;
  opacity: 0.9;
}

.week-number {
  font-size: 3.25rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.03em;
}

.capture {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.capture h2 {
  font-size: 1.05rem;
  font-weight: 650;
}

.tiles {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  min-height: 132px;
  padding: 1rem 0.5rem;
  background: var(--surface-2);
  border: 2px dashed var(--border);
  border-radius: var(--radius-sm);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.12s ease, border-color 0.2s ease, background-color 0.2s ease;
}

.tile:hover:not(:disabled) {
  border-color: var(--primary);
}

.tile:active:not(:disabled) {
  transform: scale(0.97);
}

.tile:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.tile-icon {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: var(--primary-soft);
  color: var(--primary-strong);
}

.preview {
  display: grid;
  place-items: center;
  min-height: 140px;
  max-height: 220px;
  overflow: hidden;
  border-radius: var(--radius-sm);
  background: var(--surface-2);
}

.preview-image {
  display: block;
  width: 100%;
  max-height: 220px;
  object-fit: contain;
}

.pdf-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding: 2rem;
  color: var(--primary-strong);
  font-weight: 700;
}

.file-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.file-name {
  overflow: hidden;
  font-size: 0.9rem;
  color: var(--muted);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.filename-display {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
}

.filename-display.recipient {
  padding-top: 0;
  border-top: none;
}

.filename-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--muted);
}

.filename-box {
  padding: 0.75rem 0.9rem;
  border-radius: 12px;
  background: var(--surface-2);
  word-break: break-word;
}

.filename-box code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.8rem;
}

/* Barre d'actions fixe en bas, comme une app native */
.action-bar {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 1.5rem calc(1rem + var(--safe-right)) calc(0.75rem + var(--safe-bottom)) calc(1rem + var(--safe-left));
  background: linear-gradient(to top, var(--bg) 70%, transparent);
}

.action-inner {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 520px;
  margin: 0 auto;
}

.message {
  position: absolute;
  right: calc(1rem + var(--safe-right));
  bottom: calc(100% - 0.75rem);
  left: calc(1rem + var(--safe-left));
  display: flex;
  align-items: center;
  gap: 0.6rem;
  max-width: 520px;
  margin: 0 auto;
  padding: 0.85rem 1rem;
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow);
  font-size: 0.9rem;
  font-weight: 500;
}

.message.success {
  background: var(--success-soft);
  color: var(--success);
}

.message.error {
  background: var(--danger-soft);
  color: var(--danger);
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2.5px solid color-mix(in srgb, var(--on-primary) 35%, transparent);
  border-top-color: var(--on-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
