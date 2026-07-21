# Guide — Activer l'envoi d'emails de Marché Fooly (à faire sur Render)

> ## ⚠️ IMPORTANT — HISTORIQUE ET DÉCISION (20/07/2026)
>
> Les étapes A, B, C ci-dessous ont été réalisées et les réglages sont
> **corrects**… mais l'envoi SMTP échoue (`Connection timeout`) car
> **Render bloque les ports SMTP (25, 465, 587) sur les services
> GRATUITS** depuis le 26/09/2025 :
> https://render.com/changelog/free-web-services-will-no-longer-allow-outbound-traffic-to-smtp-ports
>
> **Décision prise : rester en gratuit et envoyer via l'API Brevo**
> (HTTPS, non bloquée). Le code du backend gère désormais les deux
> transports ; il n'y a plus qu'à suivre la section « Étape D » ci-dessous.
> Les variables déjà ajoutées (étape B) restent utiles : **ne rien
> supprimer** (`SMTP_FROM`, `SMTP_REPLY_TO` et `APP_URL` servent aussi à
> l'envoi Brevo ; le SMTP redeviendra un secours si le plan Render change).

---

## Étape D — Activer l'envoi via Brevo (la marche à suivre actuelle)

Brevo est un service d'envoi d'emails avec une offre **gratuite de
300 emails/jour** — largement suffisant pour démarrer. Environ 15 minutes.

### D1. Créer le compte Brevo

1. Aller sur **https://www.brevo.com** → « S'inscrire gratuitement ».
2. Créer le compte (idéalement avec l'email `contact@marchefooly.com`),
   confirmer l'email d'inscription, choisir l'offre **gratuite**.

### D2. Déclarer et vérifier l'expéditeur

Brevo n'envoie qu'au nom d'expéditeurs **vérifiés** :

1. Dans Brevo : menu du compte (en haut à droite) →
   **« Senders, Domains & Dedicated IPs »** → onglet **« Senders »** →
   **« Add a sender »**.
2. Renseigner : nom `Marche Fooly`, email `contact@marchefooly.com`.
3. Brevo envoie un **code/lien de confirmation** à cette boîte : l'ouvrir
   dans le webmail Hostinger (hpanel.hostinger.com → Emails → Webmail) et
   confirmer.

### D3. Créer la clé API

1. Menu du compte (en haut à droite) → **« SMTP & API »** →
   onglet **« API Keys »** → **« Generate a new API key »**.
2. La nommer `marche-fooly-backend` et **copier la clé immédiatement**
   (elle commence par `xkeysib-` et ne sera plus jamais affichée).
   ⚠️ Bien rester dans l'onglet **API Keys** — la clé « SMTP » de l'onglet
   voisin ne fonctionnera pas ici.

### D4. Ajouter la clé sur Render

1. **dashboard.render.com** → service **`marche-fooly`** → onglet
   **« Environment »** → **« + Add Environment Variable »** :
   - **Key** : `BREVO_API_KEY`
   - **Value** : la clé copiée en D3
2. Enregistrer avec **« Save and deploy »** et attendre le statut « Live ».

### D5. Tester

Comme l'étape C ci-dessous : demander un lien sur
`www.marchefooly.com/mot-de-passe-oublie` avec un email de compte existant,
et vérifier la réception (spams compris). Dans les logs Render, la ligne
`[forgotPassword] email de reinitialisation envoye` confirme l'envoi.

### D6. (Recommandé, à faire plus tard) Authentifier le domaine

Tant que le domaine n'est pas authentifié (DKIM), Brevo peut afficher
l'expéditeur via `@brevosend.com`, ce qui est moins professionnel :

1. Dans Brevo : « Senders, Domains & Dedicated IPs » → **« Domains »** →
   ajouter `marchefooly.com` → Brevo fournit des enregistrements DNS.
2. Les ajouter dans **hPanel Hostinger → Domaines → Zone DNS**, puis
   revenir dans Brevo cliquer « Authenticate ».

### Dépannage spécifique Brevo (logs Render)

| Message dans les logs | Cause | Solution |
|---|---|---|
| `Brevo API 401` | Clé incorrecte ou tronquée | Revérifier `BREVO_API_KEY` (clé API, pas clé SMTP) |
| `Brevo API 400: sender ... not valid` | Expéditeur non vérifié | Refaire l'étape D2 |
| Rien dans les logs, message « indisponible » sur le site | `NOTIFICATION_EMAIL_ENABLED` ≠ `true` | Vérifier la variable |

> **Pour qui ?** La personne qui a accès au compte **Render** (hébergeur du
> backend) et au compte **Hostinger** (hébergeur de l'email
> `contact@marchefooly.com`).
>
> **Pourquoi ?** Le site sait déjà envoyer des emails (mot de passe oublié,
> notifications de commandes et de vendeurs), mais cette fonction est
> **éteinte** tant que les réglages ci-dessous ne sont pas remplis.
> Il n'y a **aucun code à toucher** : c'est uniquement du réglage, environ
> **10 minutes**.
>
> **Aucun risque** : ces réglages n'affectent ni les produits, ni les
> commandes, ni les comptes. Au pire, les emails ne partent pas — comme
> aujourd'hui — et on réessaie.

---

## Étape A — Retrouver le mot de passe de la boîte email (Hostinger)

Il nous faut le mot de passe de la boîte **`contact@marchefooly.com`**
(⚠️ c'est le mot de passe de la BOÎTE EMAIL, pas celui du compte Hostinger).

1. Se connecter sur **hpanel.hostinger.com**.
2. Aller dans la section **Emails**.
3. Cliquer sur **Gérer** (Manage) à côté de `marchefooly.com`.
4. Dans la barre latérale, ouvrir **« Connect Apps & Devices »**
   (Connecter apps et appareils) : cette page affiche les réglages du
   serveur d'envoi — on doit y voir `smtp.hostinger.com` et le port `465`.
5. **Si le mot de passe de la boîte est oublié** : sur la même page de
   gestion des emails, utiliser l'option de réinitialisation du mot de passe
   de la boîte `contact@marchefooly.com`, et noter le nouveau mot de passe.
   (⚠️ si le mot de passe est changé, penser à le mettre à jour aussi sur le
   téléphone/ordinateur qui consulte cette boîte.)

Garder ce mot de passe sous la main pour l'étape B — et ne le communiquer
nulle part ailleurs.

## Étape B — Ajouter les réglages sur Render

1. Se connecter sur **dashboard.render.com**.
2. Cliquer sur le service **`marche-fooly`** (le backend).
3. Dans le panneau de gauche, cliquer sur l'onglet **« Environment »**.
4. Sous **« Environment Variables »**, cliquer sur
   **« + Add Environment Variable »** et ajouter, une par une, les lignes du
   tableau ci-dessous. Pour chaque ligne : la colonne **Key** va dans le champ
   *Key*, la colonne **Value** dans le champ *Value* (copier-coller
   exactement, sans espace avant/après).

| Key | Value |
|---|---|
| `NOTIFICATION_EMAIL_ENABLED` | `true` |
| `SMTP_HOST` | `smtp.hostinger.com` |
| `SMTP_PORT` | `465` |
| `SMTP_SECURE` | `true` |
| `SMTP_USER` | `contact@marchefooly.com` |
| `SMTP_PASS` | *(le mot de passe de la boîte email, étape A)* |
| `SMTP_FROM` | `Marche Fooly <contact@marchefooly.com>` |
| `SMTP_REPLY_TO` | `contact@marchefooly.com` |
| `APP_URL` | `https://www.marchefooly.com` |

> Certaines de ces variables existent peut-être déjà dans la liste : dans ce
> cas, ne pas les recréer — vérifier/modifier leur valeur avec le petit
> crayon (Edit).

5. Cliquer sur le bouton d'enregistrement et choisir **« Save and deploy »**
   (le menu propose aussi « Save, rebuild, and deploy » et « Save only » —
   « Save and deploy » suffit).
6. Render redémarre le backend tout seul : attendre que le statut redevienne
   **« Live »** (1 à 3 minutes).

## Étape C — Tester que ça marche

1. Ouvrir **www.marchefooly.com/mot-de-passe-oublie**.
2. Saisir l'adresse email d'un compte client existant (par exemple le sien)
   et cliquer **« Envoyer le lien »**.
3. Un message vert « un lien de réinitialisation vient d'être envoyé »
   doit s'afficher — et l'email doit arriver dans la boîte en moins d'une
   minute. **Penser à vérifier le dossier spams/indésirables.**
4. Cliquer le lien de l'email, choisir un nouveau mot de passe, se
   reconnecter avec : si tout cela fonctionne, c'est terminé. ✅

À partir de là, les emails de notifications (nouvelle commande, changement
de statut, vendeurs) partent aussi automatiquement.

## En cas de problème

| Symptôme | Cause probable | Solution |
|---|---|---|
| La page affiche encore « momentanément indisponible » | `NOTIFICATION_EMAIL_ENABLED` absent, différent de `true`, ou déploiement pas terminé | Vérifier la valeur exacte (`true`, en minuscules, sans espace) et que le service est bien « Live » |
| Message vert, mais aucun email reçu (même en spams) | Mot de passe email incorrect, ou port bloqué | Revérifier `SMTP_PASS` ; sinon essayer la variante : `SMTP_PORT` = `587` et `SMTP_SECURE` = `false`, puis « Save and deploy » |
| L'email arrive mais le lien ne s'ouvre pas sur le bon site | `APP_URL` mal renseignée | Vérifier `APP_URL` = `https://www.marchefooly.com` (sans `/` à la fin) |

Si ça bloque toujours : envoyer une capture d'écran de la liste des
variables (en **masquant** `SMTP_PASS`) et des « Logs » du service Render.

## Sécurité — à respecter

- Le mot de passe email ne doit être saisi **que** dans le champ `SMTP_PASS`
  de Render — jamais dans un fichier du code, un message ou un document.
- Ne jamais faire de capture d'écran où `SMTP_PASS` est visible.

## Sources officielles (vérifiées le 20/07/2026)

- Render — variables d'environnement :
  https://render.com/docs/configure-environment-variables
- Hostinger — réglages de configuration email (SMTP) :
  https://www.hostinger.com/support/1575756-how-to-get-email-account-configuration-details-for-hostinger-email/
