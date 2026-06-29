# AGENTS.md - Marché Fooly

## Projet

Marché Fooly est une marketplace locale basée à Sangarédi, Guinée.

Objectif actuel :
- maintenir l'application de production Next.js / Express.js / MongoDB ;
- continuer la stabilisation des parcours client, vendeur et administrateur ;
- garder l'ancienne maquette HTML comme reference visuelle, sans en faire la source principale ;
- conserver une base professionnelle, maintenable, scalable et adaptee a une marketplace reelle.

## Stack actuelle

- Frontend : Next.js dans `frontend/`
- Backend : Express.js dans `backend/`
- Base de donnees : MongoDB
- UI : Bootstrap 5, Bootstrap Icons, CSS modules et styles globaux
- Authentification : clients, vendeurs, staff, administrateurs, proprietaire
- Paiement actuel : paiement a la livraison / retrait vendeur
- Depot GitHub : branche principale `main`
- Deploiement production : frontend et backend deja connectes a la production

## Ancienne maquette HTML

- L'ancienne maquette est conservee dans `maquette-html/`.
- Elle sert de reference visuelle et d'archive.
- Ne pas modifier massivement les anciens fichiers HTML sauf demande explicite.
- Les nouveaux travaux doivent se faire en priorite dans `frontend/` et `backend/`.

## Regles de travail

- Lire ce fichier avant toute modification.
- Comprendre la tache avant d'agir.
- Pour toute question, probleme, bug ou demande ambigue, discuter d'abord avec l'utilisateur avant de modifier le code.
- Avant de coder, expliquer en un paragraphe simple :
  - ce qui se passe ;
  - ce qu'on va faire ;
  - pourquoi on va le faire ;
  - comment on va proceder.
- Ne jamais commencer le code tant que le plan d'action n'a pas ete explique clairement.
- Donner les explications en deux niveaux quand c'est utile :
  - d'abord avec les termes techniques corrects ;
  - ensuite avec une analogie simple de la vie reelle.
- Ne pas explorer inutilement tout le projet.
- Lire uniquement les fichiers necessaires a la tache.
- Travailler et valider etape par etape.
- Garder les changements coherents avec les patterns existants.
- Si une modification connexe est necessaire pour terminer proprement la tache, l'effectuer.
- Proteger les donnees existantes et eviter les regressions metier.
- Ne jamais supprimer l'historique utile sans l'archiver.
- Ne jamais commiter `.env`, secrets, cles, fichiers generes ou donnees sensibles.
- Apres modification, executer les validations adaptees a la tache.
- Indiquer les tests manuels recommandes apres chaque tache.
- Les messages de commit doivent etre en francais.
- Chercher la documentation officielle en ligne avant tout changement qui merite une verification recente.

## Regles specifiques à Marché Fooly

- Garder la version francaise prioritaire.
- Mettre la version anglaise en attente tant que la version francaise n'est pas finalisee.
- Garder des liens reels vers les pages existantes ou futures.
- Eviter `href="#"`, liens vides, boutons sans destination ou actions inutiles.
- Ne pas afficher de texte indiquant que le site est une maquette, un prototype ou une version statique.
- Le site doit paraitre final, credible et professionnel.
- Garder le positionnement : marketplace locale à Sangarédi, Guinée.
- Preserver la coherence de marque : Marché Fooly / FOOLY / Le marché gagnant.
- Preserver les informations de contact existantes sauf instruction contraire :
  - Telephone : +224 624 27 38 05
  - Email : contact@marchefooly.com
  - Localisation : Sangarédi, Guinée
- Ne pas inventer de chiffres cote frontend.
- Les compteurs produits/categories doivent venir du backend.
- Les prix doivent rester en `GNF`.
- Les montants doivent etre stockes comme nombres cote base de donnees :
  - `price: 1200000`
  - `currency: "GNF"`
- Ne jamais stocker un prix comme texte complet du type `"1 200 000 GNF"`.

## Architecture actuelle

### Frontend Next.js

Emplacement : `frontend/`

Structure principale :
- `src/app/` : routes App Router
- `src/components/` : composants reutilisables
- `src/config/` : configuration site
- `src/data/` : donnees temporaires restantes
- `src/lib/` : helpers API, auth, panier, commandes, admin
- `src/styles/` : CSS modules
- `src/types/` : types TypeScript
- `public/images/` : images permanentes utilisees par Next.js

Routes client principales :
- `/`
- `/boutique`
- `/categories`
- `/produit/[slug]`
- `/panier`
- `/checkout`
- `/commandes`
- `/commande/[reference]`
- `/mon-compte`
- `/favoris`
- `/aide`
- `/contact`
- `/devenir-vendeur`

Routes vendeur :
- `/vendeur`
- `/vendeur/produits/nouveau`
- `/vendeur/produits/[id]/modifier`
- `/vendeur/commandes`
- `/vendeur/commandes/[reference]`

Routes administrateur :
- `/admin`
- `/admin/utilisateurs`
- `/admin/vendeurs`
- `/admin/produits`
- `/admin/commandes`

### Backend Express

Emplacement : `backend/`

Structure principale :
- `src/app.js` : configuration Express
- `src/server.js` : demarrage serveur
- `src/config/` : environnement et MongoDB
- `src/models/` : modeles Mongoose
- `src/controllers/` : logique metier API
- `src/routes/` : routes Express
- `src/middlewares/` : auth, roles, validation, rate limit
- `src/validators/` : validations express-validator
- `src/utils/` : helpers backend
- `tests/` : scripts smoke tests

Endpoints importants :
- `/api/auth/*`
- `/api/products/*`
- `/api/categories/*`
- `/api/orders/*`
- `/api/seller/*`
- `/api/admin/*`
- `/api/contact`
- `/api/newsletter`

## Authentification et roles

Roles applicatifs :
- `customer`
- `seller`
- `staff`
- `admin`
- `owner`

Regles :
- L'inscription publique cree un compte client.
- Le role vendeur depend du parcours vendeur et de l'approbation.
- Le compte proprietaire utilise le role `owner`.
- Les roles `owner`, `admin` et `staff` sont geres cote back office/backend, jamais depuis un formulaire public.
- Les routes admin backend sont protegees par `authenticate` + des roles explicites.
- Le frontend peut masquer/afficher des liens selon le role, mais la vraie securite reste cote backend.

Back office :
- `/admin` est reserve aux comptes `owner`, `admin` et `staff`.
- Le lien `Administration` apparait dans le header uniquement pour ces roles connectes.
- Un utilisateur non connecte est redirige vers `/mon-compte`.
- Un utilisateur hors back office est redirige vers `/`.
- `owner` peut gerer les roles d'equipe.
- `admin` gere l'operationnel : vendeurs, produits, commandes.
- `staff` a un acces limite : lecture produits/vendeurs/commandes, sans actions sensibles.

## Donnees catalogue

Regles produit :
- Les produits publics sont ceux avec statut :
  - `active`
  - `out_of_stock`
- Les produits `draft` et `archived` ne doivent pas apparaitre dans la boutique publique.
- Les compteurs publics par categorie doivent compter uniquement les produits publics.
- Le backend expose `productCount` dans `/api/categories`.
- Le frontend ne doit pas utiliser d'anciens compteurs statiques pour la boutique de production.
- Les filtres boutique doivent rester coherents avec les donnees API.

Regles categories :
- Les categories sont globales.
- Les routes publiques ne doivent exposer que les categories actives.
- Les modifications de categories sont reservees aux administrateurs.

## Modules deja en place

- Frontend Next.js avec layout global
- Backend Express avec MongoDB
- Authentification client
- Session via cookie httpOnly cote frontend
- Roles client / vendeur / staff / administrateur / proprietaire
- Boutique connectee a l'API produits
- Categories connectees a l'API
- Compteurs reels de produits par categorie
- Panier frontend
- Checkout
- Commandes
- Espace vendeur
- Creation et gestion de produits vendeur
- Gestion des commandes vendeur
- Back office admin
- Listes admin utilisateurs, vendeurs, produits, commandes
- Approbation/rejet/suspension vendeur
- Contact
- Newsletter

## Modules a finaliser ou renforcer

- Edition complete du profil client
- Changement de mot de passe
- Verification email / telephone
- Images produits reelles dans le parcours vendeur
- Gestion avancee des favoris
- Notifications
- Recherche plus complete
- Pagination reelle cote boutique
- Gestion admin plus complete des produits et categories
- Support/contact cote admin
- Tests automatises plus solides
- Paiement en ligne plus tard si necessaire

## Qualite attendue

Chaque modification doit respecter ces criteres :

1. UX claire et intuitive
- navigation simple ;
- actions comprehensibles ;
- aucun ecran confus.

2. Performance rapide
- pas de lenteur visible ;
- animations fluides et legeres ;
- eviter le code inutile.

3. Robustesse
- aucun crash JavaScript ;
- gerer les erreurs ;
- prevoir des fallbacks.

4. Logique metier coherente
- parcours client coherent ;
- parcours vendeur coherent ;
- panier, prix, checkout et commandes credibles.

5. Securite et fiabilite
- valider les champs de formulaires ;
- eviter les valeurs incoherentes ;
- ne jamais exposer de secrets ;
- ne jamais faire confiance uniquement au frontend pour les droits.

6. Feedback utilisateur
- informer l'utilisateur apres une action ;
- utiliser messages inline, alertes, loaders ou etats visuels adaptes ;
- confirmer les actions importantes.

7. Design coherent
- respecter le theme global ;
- UI homogene ;
- sections lisibles ;
- responsive mobile/tablette/desktop.

8. Gestion des cas limites
- champs vides ;
- valeurs extremes ;
- actions invalides ;
- erreurs utilisateur.

9. Scalabilite
- code structure ;
- composants reutilisables ;
- eviter les duplications.

10. Experience premium
- transitions subtiles ;
- details visuels soignes ;
- interaction agreable ;
- rendu professionnel.

## Validation

Pour le frontend Next.js :
- lancer selon le perimetre :
  - `npm --prefix frontend run lint`
  - `npm --prefix frontend run build`
  - `npm exec tsc -- --noEmit` depuis `frontend/` si une verification TypeScript ciblee est utile
- verifier manuellement les routes concernees.

Pour le backend Express :
- lancer selon le perimetre :
  - `npm --prefix backend test`
  - `node --check backend/src/controllers/xxx.js`
  - `node --check backend/src/routes/xxx.js`
  - `node --check backend/src/validators/xxx.js`
- verifier les endpoints critiques si la tache touche l'API.

Pour l'ancienne maquette HTML :
- verifier l'affichage dans le navigateur ;
- tester les liens principaux ;
- tester le responsive mobile ;
- verifier la console navigateur ;
- verifier les formulaires visuellement.

Si une validation echoue :
- expliquer clairement l'erreur rencontree ;
- indiquer la cause probable ;
- proposer une solution simple avant de continuer.

## Git et deploiement

Avant commit :
- lancer `git status` ;
- verifier le perimetre avec `git diff --name-only` ;
- verifier qu'aucun fichier sensible ou hors scope n'est inclus ;
- eviter `git add .` sauf si le perimetre est totalement propre ;
- ne pas inclure `backend/package-lock.json` s'il est modifie hors scope ;
- ecrire un message de commit court et clair en francais.

Apres push :
- signaler le hash du commit ;
- signaler la branche poussee ;
- signaler les fichiers locaux restes modifies hors commit.

## Communication attendue

Avant chaque tache :
- discuter d'abord avec l'utilisateur s'il y a une question, un probleme, un bug ou une ambiguite ;
- expliquer clairement ce qui se passe ;
- expliquer le plan d'action avant de modifier le code ;
- utiliser si possible une explication technique puis une analogie simple de la vie reelle.

Apres chaque tache, l'agent doit fournir :
- resume de ce qui a ete fait ;
- resume des fichiers modifies ;
- resume des validations lancees ;
- resultat des validations ;
- tests manuels recommandes ;
- message de commit propose ;
- signalement clair de toute modification connexe importante.

A la fin d'une tache :
- proposer eventuellement des pistes pour aller plus loin ;
- ne pas appliquer ces ameliorations automatiquement ;
- laisser l'utilisateur decider s'il veut continuer ou non.

## Regle globale

Toute modification doit ameliorer ou preserver :
- UX ;
- performance ;
- robustesse ;
- logique metier ;
- securite ;
- design ;
- maintenabilite ;
- experience premium.

Si une modification degrade un de ces points, elle doit etre corrigee.
