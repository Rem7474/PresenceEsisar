Agis en tant qu'expert développeur Full-Stack (Frontend, PWA, Node.js, Sécurité). Je souhaite créer une Progressive Web App (PWA) pour ma promotion d'alternants afin d'automatiser l'envoi de notre feuille de présence hebdomadaire.

Voici le cahier des charges technique et fonctionnel :

1. Objectif de l'application :
Permettre à chaque étudiant de numériser ou importer sa feuille de présence en fin de semaine, de générer automatiquement un fichier nommé selon un format précis, et de l'envoyer par e-mail via le serveur SMTP de l'école.

2. Fonctionnalités Frontend (PWA) :
- Première connexion : L'utilisateur enregistre son Nom, son identifiant/e-mail et son mot de passe (nécessaire pour le SMTP). Ces informations doivent être mémorisées de façon persistante (localStorage avec un niveau de précaution minimal, ex: obfuscation ou chiffrement léger côté client).
- Interface principale : 
  - Un bouton pour prendre une photo directement via la caméra du smartphone (ou sélectionner un fichier depuis la galerie).
  - Calcul automatique du numéro de semaine actuel (ex: Semaine 38).
  - Affichage en temps réel du nom final du fichier généré : "Attestation présence P2027- [ NOM ] - Esisar- Semaine [ Numero ]".
  - Un bouton d'envoi.
- La PWA doit être installable (manifest.json + service worker de base).

3. Fonctionnalités Backend (Node.js / Express) :
- Une route API pour recevoir le fichier image/PDF et les métadonnées de l'utilisateur.
- Utilisation de Nodemailer pour envoyer l'e-mail avec les paramètres SMTP suivants :
  - Server : smtps.esisar.grenoble-inp.fr
  - Port : 587
  - Sécurité : STARTTLS
- Le backend déchiffre/récupère temporairement le mot de passe pour effectuer l'authentification SMTP, puis joint le fichier renommé au format exigé et l'envoie à "apprentissage@esisar.grenoble-inp.fr".
- Infrastructure : Le backend sera placé derrière un reverse proxy (ex: Nginx/Caddy). Prévois la configuration pour qu'il puisse tourner derrière ce proxy (notamment la gestion du HTTPS/certificat auto-signé ou proxy_pass).

4. Livrables attendus :
- La structure complète des dossiers du projet (Frontend + Backend).
- Le code source complet et commenté du Frontend et du Backend.
- Un guide clair pour tester l'application en local et configurer le déploiement.
