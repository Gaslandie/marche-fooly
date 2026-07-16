# Plan d'exécution — Connexion / Inscription avec Google

> **Statut : EN STAND-BY (plan validé, exécution non planifiée).**
> Décision de juillet 2026 : la fonctionnalité est reportée. Le placeholder
> « Continuer avec Google » a été **retiré de la plateforme** (l'interface
> n'affiche plus aucun bouton Google — pas de fausse promesse). Le jour où la
> décision sera prise, ce plan permet une mise en place rapide, y compris la
> réintroduction du bouton (étape F5).
>
> Ce document est destiné à l'agent qui implémentera la fonctionnalité.
> Il doit être suivi **étape par étape, dans l'ordre**, sans improviser.
> ⚠️ **LE SITE EST EN PRODUCTION** : il y a de vrais comptes clients, vendeurs
> et de vrais produits en base. Lire `AGENTS.md` (racine du projet) AVANT de
> commencer, en particulier la section « Contexte production (IMPORTANT) ».

---

## 1. Contexte et objectif

- La page `/mon-compte` (composant `frontend/src/components/account/AuthTabs.tsx`)
  affichait un bouton « Continuer avec Google » désactivé (placeholder). Ce
  placeholder a été **retiré** lors de la mise en stand-by : il n'y a
  actuellement **aucun bouton Google** dans l'interface.
- **Objectif** : rendre fonctionnels la **connexion** ET l'**inscription** via
  Google, sur les deux onglets (Connexion / Inscription), sans rien casser de
  l'authentification email + mot de passe existante.

### Architecture d'authentification EXISTANTE (à respecter absolument)

```
Navigateur ──POST /api/auth/login──▶ Route Handler Next.js (BFF)
                                        │  transmet au backend Express
                                        ▼
                              Express POST /api/auth/login
                                        │  vérifie, renvoie { user, token }
                                        ▼
                       Le Route Handler pose le JWT en cookie httpOnly
                       et ne renvoie au navigateur QUE { success, message, user }
```

- Le JWT n'est **jamais** exposé au navigateur (ni localStorage, ni réponse JSON).
- Fichiers de référence : `frontend/src/app/api/auth/login/route.ts`,
  `frontend/src/lib/auth.ts` (`AUTH_COOKIE_NAME`, `authCookieOptions`,
  `backendJson`), `backend/src/controllers/authController.js`.

### Approche retenue (validée sur la documentation officielle Google)

**Google Identity Services (GIS) — flux « ID token »** :

1. Le frontend charge le script officiel `https://accounts.google.com/gsi/client`
   et affiche le bouton officiel Google.
2. Quand l'utilisateur choisit son compte Google, GIS renvoie au navigateur un
   `credential` (un **ID token** JWT signé par Google).
3. Le navigateur POSTe ce `credential` à un **nouveau** Route Handler Next
   `POST /api/auth/google`, qui le transmet à un **nouveau** endpoint Express
   `POST /api/auth/google`.
4. Le backend **vérifie l'ID token** avec la librairie officielle
   `google-auth-library` (`OAuth2Client.verifyIdToken`), puis trouve ou crée le
   compte, et renvoie `{ user, token }` **exactement comme le login classique**.
5. Le Route Handler Next pose le cookie httpOnly (même mécanique que le login).

Pourquoi ce flux et pas le flux OAuth « authorization code » avec redirection :
- On ne consomme aucune API Google (pas de Gmail, Drive…) : on veut seulement
  authentifier. L'ID token suffit.
- Pas de `client_secret` nécessaire, pas d'URI de redirection, pas de gestion
  d'état OAuth : moins de pièces mobiles, moins de risques en production.
- C'est la méthode documentée par Google pour ce cas :
  - Vérification serveur : https://developers.google.com/identity/gsi/web/guides/verify-google-id-token
  - Bonnes pratiques : https://developers.google.com/identity/siwg/best-practices
  - Note FedCM (transparent pour nous, géré par le script GIS) :
    https://developers.google.com/identity/gsi/web/guides/fedcm-migration

### Règles de sécurité NON NÉGOCIABLES (issues de la doc officielle)

- **Ne jamais faire confiance au navigateur** : la création/connexion de compte
  se décide UNIQUEMENT après vérification de l'ID token côté backend.
- L'identifiant stable d'un compte Google est le claim **`sub`** (PAS l'email,
  qui peut changer). `sub` → champ `googleId` en base.
- `verifyIdToken` vérifie automatiquement `aud` (doit être NOTRE client ID),
  `iss` et `exp`. Il faut vérifier **manuellement** `email_verified === true`.
- Tout compte créé via Google a le rôle **`customer`** forcé côté serveur
  (comme l'inscription classique — jamais de rôle venant du client).
- Un compte `suspended` doit être refusé (403), comme dans `login`.

---

## 2. Prérequis hors code — QUI FAIT QUOI

> Contexte d'accès (juillet 2026) :
> - **Mohamed** a accès au **code** (dépôt GitHub) uniquement ;
> - **la cliente** a l'accès complet aux **hébergeurs** (backend + frontend)
>   avec son compte.
>
> Point clé : la **console Google Cloud ne demande AUCUN accès à
> l'hébergement** — il faut seulement un compte Google et connaître le domaine
> de production du site. Mohamed peut donc préparer toute la partie Google
> lui-même, sans rien demander à la cliente, puis ne lui demander que DEUX
> variables d'environnement à ajouter.

| Tâche | Qui | Accès nécessaire |
|---|---|---|
| Créer le projet Google Cloud, l'écran de consentement et le Client ID (étapes 1 à 4 ci-dessous) | **Mohamed** (recommandé), ou la cliente si l'entreprise préfère que le projet Google appartienne à son compte | Un simple compte Google |
| Ajouter `GOOGLE_CLIENT_ID` sur l'hébergeur du **backend** puis redéployer | **La cliente** (seule à avoir l'accès hébergeur) | Hébergeur backend |
| Ajouter `NEXT_PUBLIC_GOOGLE_CLIENT_ID` sur l'hébergeur du **frontend** puis REBUILDER/redéployer | **La cliente** | Hébergeur frontend |
| Tout le code (backend + frontend, sections 4 et 5) | **Mohamed / l'agent**, via GitHub | Dépôt GitHub |
| Recette de production (section 6) | Mohamed + la cliente | Navigateur |

> Conseil de propriété : si le projet Google Cloud est créé sur le compte
> personnel de Mohamed, penser à y AJOUTER le compte Google de l'entreprise /
> de la cliente comme propriétaire (IAM) pour que Marché Fooly n'en perde
> jamais le contrôle.
>
> L'agent ne peut PAS faire cette partie console/hébergeurs. Sans elle, rien
> ne fonctionnera. Il peut cependant tout implémenter et tester dès que le
> Client ID de développement existe.

### Étapes détaillées dans la console Google (par Mohamed ou la cliente)

1. Aller sur https://console.cloud.google.com avec le compte Google de
   l'entreprise. Créer un projet (ex. `marche-fooly`).
2. Menu **API et services → Écran de consentement OAuth** (ou « Branding ») :
   - Type d'utilisateurs : **Externe** ;
   - Nom de l'application : `Marché Fooly` ;
   - E-mail d'assistance : `contact@marchefooly.com` ;
   - Domaine autorisé : le domaine de production du site (ex. `marchefooly.com`) ;
   - **Ne pas ajouter de logo pour l'instant** (l'ajout d'un logo déclenche une
     revue de validation par Google qui peut prendre du temps — on pourra le
     faire plus tard) ;
   - Publier l'application (statut « En production », pas « Test »).
3. Menu **API et services → Identifiants → Créer des identifiants →
   ID client OAuth** :
   - Type d'application : **Application Web** ;
   - Nom : `Marché Fooly Web` ;
   - **Origines JavaScript autorisées** (très important, orthographe exacte) :
     - l'URL de production du frontend, ex. `https://www.marchefooly.com`
       ET `https://marchefooly.com` si les deux existent ;
     - `http://localhost:3000` (développement local) ;
   - **Aucune « URI de redirection » n'est nécessaire** (le flux ID token
     n'en utilise pas). Laisser vide.
4. Copier le **Client ID** généré (il se termine par
   `.apps.googleusercontent.com`). Il n'est PAS secret (il est visible dans le
   HTML), mais on le gère quand même par variable d'environnement.
5. Configurer les variables d'environnement **sur les hébergeurs**
   (→ **c'est la cliente qui a cet accès** ; lui transmettre le Client ID et
   les instructions ci-dessous, c'est tout ce qu'elle a à faire) :
   - Hébergeur du **backend** Express : `GOOGLE_CLIENT_ID=<le client ID>` ;
   - Hébergeur du **frontend** Next : `NEXT_PUBLIC_GOOGLE_CLIENT_ID=<le même client ID>`
     (⚠️ variable inlinée AU BUILD : il faudra **rebuilder/redéployer** le
     frontend après l'avoir ajoutée) ;
   - En local (pour le développeur) : les ajouter dans `backend/.env` et
     `frontend/.env.local` (fichiers non commités).

---

## 3. Décisions de modèle de données (POURQUOI, avant le COMMENT)

Le modèle `backend/src/models/User.js` actuel impose :
- `phone` : **required** — or Google ne fournit PAS de téléphone ;
- `passwordHash` : **required** — or un compte Google n'a pas de mot de passe.

Décisions (les plus sûres pour une base de production existante) :

| Champ | Décision | Justification |
|---|---|---|
| `googleId` | **Nouveau champ** `String`, index **unique + sparse** | `sub` Google. `sparse` est OBLIGATOIRE : sans lui, l'index unique considérerait tous les comptes existants (sans googleId) comme des doublons `null`. |
| `authProvider` | **Nouveau champ** `String`, enum `["local", "google"]`, `default: "local"` | Tracer l'origine du compte. Le `default` couvre tous les comptes existants sans migration. |
| `phone` | Passer à `required: false` (garder le validateur de format quand présent) | Assouplissement NON destructif : les documents existants ont tous un téléphone ; seuls les nouveaux comptes Google peuvent ne pas en avoir. Le checkout n'est pas impacté : la commande porte SON PROPRE téléphone (validé dans `backend/src/models/Order.js`). L'utilisateur Google pourra ajouter son téléphone via PATCH `/api/auth/me` (`phone` est déjà dans `UPDATE_ME_ALLOWED_FIELDS`). |
| `passwordHash` | **Ne pas toucher au schéma.** Pour un compte Google, stocker le hash d'un mot de passe aléatoire imprévisible | Évite d'assouplir le schéma. Le login classique sur ce compte échouera naturellement (mot de passe inconnu) avec le message générique existant. |
| `avatarUrl` | Renseigner avec `payload.picture` si présent et si URL valide | Champ existant avec validateur d'URL optionnel — bonus UX gratuit. |
| `isEmailVerified` | `true` pour un compte créé via Google | Google garantit `email_verified`. Pour un compte EXISTANT lié, passer aussi à `true` (l'email est prouvé). |

### Politique de liaison de comptes (account linking)

Cas à gérer dans CET ordre dans le contrôleur :

1. **`googleId` connu en base** → connexion directe (vérifier `suspended`).
2. **`googleId` inconnu, mais un compte existe avec le même email** →
   **lier** : renseigner `googleId`, `isEmailVerified = true` sur ce compte,
   puis connecter (vérifier `suspended`). C'est sûr car on a exigé
   `email_verified === true` de Google. Ne PAS toucher à `role`, `status`,
   `passwordHash`, `phone` du compte existant.
3. **Aucun compte** → créer : rôle `customer`, `status: "active"`,
   `authProvider: "google"`, `googleId`, email en minuscules, noms depuis
   `given_name`/`family_name`, hash aléatoire, `isEmailVerified: true`.

Piège de validation : `firstName`/`lastName` ont `minlength: 2`. Un
`given_name` Google peut faire 1 caractère ou être absent. Utiliser un
helper de secours :

```js
const safeName = (value, fallback) => {
  const cleaned = String(value || "").trim().slice(0, 80);
  return cleaned.length >= 2 ? cleaned : fallback;
};
// firstName: safeName(payload.given_name, "Client")
// lastName:  safeName(payload.family_name, "Fooly")
```

---

## 4. Étapes BACKEND (dans l'ordre)

> Rappel : ne PAS modifier `register`, `login`, `me`, `updateMe`, `logout`
> existants. On AJOUTE seulement.

### Étape B1 — Dépendance

```bash
npm --prefix backend install google-auth-library
```

### Étape B2 — `backend/src/config/env.js`

Ajouter une clé **optionnelle** (PAS de `requireEnv` : la fonctionnalité doit
être désactivable en retirant la variable — feature flag naturel) :

```js
googleClientId: process.env.GOOGLE_CLIENT_ID || "",
```

Mettre aussi à jour `backend/.env.example` avec un commentaire expliquant la
variable (sans valeur réelle).

### Étape B3 — `backend/src/models/User.js`

1. `phone` : remplacer `required: true` par `required: false` (garder le
   `validate` existant tel quel — il ne doit s'appliquer que si une valeur est
   fournie ; vérifier que le validateur `isPhoneNumber` tolère chaîne vide /
   absence, sinon l'adapter : `validator: (v) => !v || isPhoneNumber(v)`).
2. Ajouter après `passwordHash` :

```js
googleId: {
  type: String,
  trim: true,
  index: { unique: true, sparse: true },
},
authProvider: {
  type: String,
  enum: ["local", "google"],
  default: "local",
},
```

⚠️ **Interdits** : ne pas renommer de champ, ne pas ajouter de champ
`required: true`, ne pas écrire de script de migration. Les documents
existants doivent rester valides tels quels.

### Étape B4 — `backend/src/validators/authValidators.js`

Ajouter (sur le modèle des validateurs existants du fichier) :

```js
const googleAuthValidators = [
  body("credential")
    .isString()
    .withMessage("Jeton Google requis")
    .isLength({ min: 20, max: 4096 })
    .withMessage("Jeton Google invalide"),
];
```

et l'exporter dans le `module.exports`.

### Étape B5 — `backend/src/controllers/authController.js`

Ajouter un handler `googleAuth` (S'INSPIRER du style de `login`) :

```js
const crypto = require("node:crypto");
const { OAuth2Client } = require("google-auth-library");
const { env } = require("../config/env"); // adapter à l'export réel du fichier

const googleClient = new OAuth2Client();

const googleAuth = async (req, res, next) => {
  try {
    // Feature flag : sans client ID configuré, la fonctionnalité est éteinte.
    if (!env.googleClientId) {
      return res.status(503).json({
        success: false,
        message: "Connexion Google non configurée",
        data: null,
      });
    }

    const { credential } = req.body;

    // 1) Vérification cryptographique de l'ID token (aud, iss, exp).
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: env.googleClientId,
      });
      payload = ticket.getPayload();
    } catch {
      return res.status(401).json({
        success: false,
        message: "Connexion Google impossible. Réessayez.",
        data: null,
      });
    }

    // 2) Exigences supplémentaires (doc officielle).
    if (!payload || !payload.sub || !payload.email || payload.email_verified !== true) {
      return res.status(401).json({
        success: false,
        message: "Compte Google non vérifié.",
        data: null,
      });
    }

    const email = String(payload.email).toLowerCase();

    // 3) Compte déjà lié à ce Google ID ?
    let user = await User.findOne({ googleId: payload.sub });

    // 4) Sinon : liaison par email (email prouvé par Google).
    if (!user) {
      user = await User.findOne({ email });
      if (user) {
        user.googleId = payload.sub;
        user.isEmailVerified = true;
      }
    }

    // 5) Sinon : création d'un nouveau compte client.
    if (!user) {
      const randomSecret = crypto.randomBytes(32).toString("hex");
      user = new User({
        firstName: safeName(payload.given_name, "Client"),
        lastName: safeName(payload.family_name, "Fooly"),
        email,
        passwordHash: await hashPassword(randomSecret),
        role: "customer",            // TOUJOURS forcé côté serveur
        status: "active",
        googleId: payload.sub,
        authProvider: "google",
        isEmailVerified: true,
        avatarUrl: typeof payload.picture === "string" ? payload.picture : "",
      });
    }

    // 6) Mêmes garde-fous que login.
    if (user.status === "suspended") {
      return res.status(403).json({
        success: false,
        message: "Ce compte est suspendu",
        data: null,
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = signAuthToken(user);
    return res.status(200).json({
      success: true,
      message: "Connexion réussie",
      data: { user: toPublicUser(user), token },
    });
  } catch (error) {
    // Course condition possible sur l'index unique googleId/email.
    if (error && error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Un compte existe deja avec ces informations",
        data: null,
      });
    }
    return next(error);
  }
};
```

Notes d'implémentation :
- `safeName` : helper de la section 3, à définir en haut du fichier.
- Si `avatarUrl` de Google fait échouer le validateur d'URL du modèle,
  l'attraper : le plus simple est de tenter `user.save()` et, sur une
  `ValidationError` portant sur `avatarUrl`, vider le champ et re-sauver —
  OU valider l'URL avant affectation. Ne JAMAIS laisser l'avatar bloquer la
  connexion.
- Exporter `googleAuth` dans le `module.exports` du contrôleur.

### Étape B6 — `backend/src/routes/authRoutes.js`

```js
router.post("/google", runValidators(googleAuthValidators), googleAuth);
```

Rien d'autre : le rate limiter est DÉJÀ appliqué à tout `/api/auth` dans
`backend/src/app.js` (`app.use("/api/auth", authRateLimiter)`).

### Étape B7 — Validations backend

```bash
node --check backend/src/controllers/authController.js
node --check backend/src/routes/authRoutes.js
node --check backend/src/validators/authValidators.js
node --check backend/src/models/User.js
node --check backend/src/config/env.js
```

Test manuel local (backend lancé, `GOOGLE_CLIENT_ID` renseigné) :

```bash
curl -s -X POST http://localhost:5000/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{"credential":"jeton-bidon-pour-test-0123456789"}'
# Attendu: 401 {"success":false,"message":"Connexion Google impossible. Réessayez." ...}
```

Et sans `GOOGLE_CLIENT_ID` : attendu 503 « Connexion Google non configurée ».

---

## 5. Étapes FRONTEND (dans l'ordre)

### Étape F1 — `frontend/.env.example`

Ajouter avec commentaire :

```
# ID client OAuth Google (Web). PAS un secret, mais géré par environnement.
# Nécessaire pour afficher le bouton "Continuer avec Google".
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
```

### Étape F2 — Types GIS : `frontend/src/types/google-gsi.d.ts` (nouveau)

Déclaration minimale pour TypeScript (le script GIS n'a pas de types npm
officiels) :

```ts
export {};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize(config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }): void;
          renderButton(
            parent: HTMLElement,
            options: {
              type?: "standard" | "icon";
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              width?: number;
              locale?: string;
            },
          ): void;
        };
      };
    };
  }
}
```

### Étape F3 — Route Handler BFF : `frontend/src/app/api/auth/google/route.ts` (nouveau)

**Copier la structure de `frontend/src/app/api/auth/login/route.ts`**
(même en-tête de commentaire, mêmes imports `AUTH_COOKIE_NAME`,
`authCookieOptions`, `backendJson`) en changeant uniquement :
- le chemin backend appelé : `"/api/auth/google"` ;
- les messages d'erreur (« Connexion Google impossible », etc.).

La mécanique cookie httpOnly doit être STRICTEMENT identique : le token ne
sort jamais vers le navigateur.

### Étape F4 — Composant bouton : `frontend/src/components/account/GoogleSignInButton.tsx` (nouveau, Client Component)

Responsabilités :
1. Si `process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID` est absent → `return null`
   (aucun bouton, aucune fausse promesse — règle AGENTS.md).
2. Charger le script officiel avec `next/script` :
   `<Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={...} />`.
3. Au chargement : `window.google.accounts.id.initialize({ client_id, callback })`
   puis `renderButton(ref.current, { theme: "outline", size: "large", text, locale: "fr", width: 320 })`.
   - Prop `text` du composant : `"signin_with"` (onglet Connexion) /
     `"signup_with"` (onglet Inscription).
4. `callback({ credential })` : POST JSON `{ credential }` sur
   `/api/auth/google` (fetch interne, comme `handleLogin` de AuthTabs), puis en
   cas de succès **reproduire exactement `goToAccount()`** de AuthTabs
   (`router.push(returnPath)` + `router.refresh()`) ; en cas d'échec, afficher
   le message d'erreur dans un état local (alert Bootstrap, même style que les
   erreurs existantes).
5. Gérer un état « erreur réseau » identique aux formulaires existants.

### Étape F5 — Intégration dans `frontend/src/components/account/AuthTabs.tsx`

⚠️ L'ancien placeholder « Continuer avec Google » a été **retiré** lors de la
mise en stand-by : il n'y a plus AUCUN bouton Google ni séparateur « ou » dans
ce fichier. Il faut donc AJOUTER :

- Onglet **Connexion** : après le bouton « Se connecter », ajouter le
  séparateur `<div className={styles.dividerLine}>ou</div>` (la classe
  `dividerLine` existe toujours dans `frontend/src/styles/account.module.css`,
  conservée exprès) puis `<GoogleSignInButton text="signin_with" />`.
  Remettre aussi la classe `mb-3` sur le bouton « Se connecter » pour
  l'espacement (elle a été retirée avec le placeholder).
- Onglet **Inscription** : après le bouton « Créer mon compte », même
  séparateur puis `<GoogleSignInButton text="signup_with" />`.
- Ne rien changer d'autre dans ce fichier (formulaires classiques intacts).
- Mettre à jour l'en-tête de commentaire du fichier (la note « EN STAND-BY »
  ne sera plus vraie).

### Étape F6 — Vérification des en-têtes de sécurité (déjà en place)

`frontend/next.config.ts` pose un en-tête `Permissions-Policy`
(`camera=(), microphone=(), geolocation=()`).
⚠️ **NE PAS y ajouter `identity-credentials-get=()`** : cela désactiverait
FedCM et casserait le bouton Google dans Chrome. Ne pas ajouter non plus de
Content-Security-Policy dans cette tâche.

### Étape F7 — Validations frontend

```bash
npm --prefix frontend run lint
npm --prefix frontend run build
```

Zéro erreur exigé (les 6 warnings `<img>` préexistants sont tolérés).

---

## 6. Tests manuels de recette (obligatoires avant push)

Préparation locale : backend + frontend lancés, les deux variables d'env
renseignées avec le Client ID de dev, `http://localhost:3000` déclaré dans les
origines JavaScript autorisées de la console Google.

| # | Scénario | Résultat attendu |
|---|---|---|
| 1 | Onglet Connexion → bouton Google → compte Google **jamais utilisé** sur le site | Compte créé (rôle `customer`), redirection `/mon-compte`, header à jour ; en base : `googleId`, `authProvider: "google"`, `isEmailVerified: true`, pas de doublon |
| 2 | Se déconnecter puis re-connecter via Google avec le même compte | Connexion directe, AUCUN nouveau compte créé |
| 3 | Compte classique existant (email X + mot de passe), puis connexion Google avec le même email X | Connexion sur le compte EXISTANT (liaison) ; `googleId` renseigné ; rôle/statut/téléphone inchangés ; le login classique par mot de passe fonctionne TOUJOURS après |
| 4 | Compte suspendu (via admin) puis connexion Google | 403 « Ce compte est suspendu », pas de cookie posé |
| 5 | POST `/api/auth/google` avec un faux `credential` (curl) | 401 générique, pas de cookie |
| 6 | Retirer `NEXT_PUBLIC_GOOGLE_CLIENT_ID` et rebuilder | Aucun bouton Google affiché, formulaires classiques intacts |
| 7 | Login classique + inscription classique (non-régression) | Comportement strictement identique à avant |
| 8 | Utilisateur créé via Google → `/mon-compte` → ajouter un téléphone | PATCH `/api/auth/me` accepte le téléphone |

## 7. Déploiement (ordre STRICT)

1. **Backend d'abord** : déployer avec `GOOGLE_CLIENT_ID` configuré.
   Sans le frontend, l'endpoint est inerte (personne ne l'appelle) — sans
   risque.
2. Vérifier dans la console Google que les origines de PRODUCTION sont bien
   déclarées (section 2, point 3).
3. **Frontend ensuite** : ajouter `NEXT_PUBLIC_GOOGLE_CLIENT_ID` chez
   l'hébergeur, **rebuilder et déployer**.
4. Recette en production : scénarios 1, 2, 3 et 7 du tableau ci-dessus.

## 8. Rollback (si problème en production)

- **Coupure immédiate sans redéploiement de code** : retirer
  `NEXT_PUBLIC_GOOGLE_CLIENT_ID` + rebuild frontend → le bouton disparaît ;
  retirer `GOOGLE_CLIENT_ID` côté backend → l'endpoint répond 503.
- Les champs ajoutés en base (`googleId`, `authProvider`) sont inoffensifs et
  peuvent rester : ne PAS écrire de script de nettoyage.
- Revert git possible : les commits doivent rester petits et dédiés.

## 9. Interdits récapitulatifs pour l'agent exécutant

1. Ne PAS modifier le comportement des endpoints auth existants.
2. Ne PAS stocker/logger le `credential` Google ni le JWT côté navigateur.
3. Ne PAS créer d'index unique NON-sparse sur `googleId` (casserait l'insert
   de tout nouveau compte classique : doublons `null`).
4. Ne PAS écrire de migration/script touchant aux comptes existants.
5. Ne PAS utiliser l'email comme identifiant Google (utiliser `sub`).
6. Ne PAS accepter un token dont `email_verified` n'est pas `true`.
7. Ne PAS commiter `.env` / `.env.local` / le Client ID en dur dans le code.
8. Ne PAS ajouter de librairie OAuth tierce (passport, next-auth…) : la stack
   choisie est `google-auth-library` (backend) + script GIS officiel (frontend).
9. Messages de commit en français (règle AGENTS.md), par exemple :
   `Ajoute la connexion et l'inscription Google` (backend puis frontend, ou un
   commit unique si le périmètre reste propre).

## 10. Références officielles

- Vérifier l'ID token côté serveur :
  https://developers.google.com/identity/gsi/web/guides/verify-google-id-token
- Bouton « Sign in with Google » (rendu, options `text`, `locale`) :
  https://developers.google.com/identity/gsi/web/reference/js-reference
- Bonnes pratiques Sign in with Google :
  https://developers.google.com/identity/siwg/best-practices
- FedCM (contexte navigateur, rien à coder de spécial) :
  https://developers.google.com/identity/gsi/web/guides/fedcm-migration
