# Guide — Activer l'envoi d'emails de Marché Fooly (à faire sur Render)

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
