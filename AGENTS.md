# AGENTS.md - Marché Fooly

## Projet

Marché Fooly est une marketplace locale basée à Sangarédi, Guinée.

Objectif :
- finaliser la maquette front-end actuelle ;
- préparer ensuite une vraie application avec Next.js, Express.js et MongoDB ;
- garder une base professionnelle, maintenable, scalable et adaptée à une marketplace réelle.

## Stack actuelle

- HTML5
- CSS3
- Bootstrap 5
- Bootstrap Icons
- JavaScript léger
- Hébergement statique / GitHub Pages

## Stack cible

- Frontend : Next.js
- Backend : Express.js
- Base de données : MongoDB
- Authentification : clients, vendeurs, administrateurs
- Paiement : paiement à la livraison / retrait vendeur au début, paiement en ligne plus tard si nécessaire

## Règles de travail

- Lire ce fichier avant toute modification.
- chercher en ligne la documentation officielle avant tout changement qui merite d'aller verifier
- Comprendre la tâche avant d’agir.
- Pour toute question, problème, bug ou demande ambiguë, discuter d’abord avec l’utilisateur avant de modifier le code.
- Avant de coder, expliquer en un paragraphe simple :
  - ce qui se passe ;
  - ce qu’on va faire ;
  - pourquoi on va le faire ;
  - comment on va procéder.
- Ne jamais commencer le code tant que le plan d’action n’a pas été expliqué clairement.
- Donner les explications en deux niveaux quand c’est utile :
  - d’abord avec les termes techniques corrects ;
  - ensuite avec une analogie simple de la vie réelle.
- Ne pas explorer inutilement tout le projet.
- Demander ou lire uniquement les fichiers nécessaires à la tâche.
- Travailler étape par étape.
- Garder les changements cohérents avec les patterns existants.
- Si une modification connexe est nécessaire pour terminer proprement la tâche, l’effectuer.
- Protéger les données existantes et éviter les régressions métier.
- Ne jamais supprimer l’historique utile sans l’archiver.
- Ne jamais commiter `.env`, secrets, clés, fichiers générés ou données sensibles.
- Après modification, exécuter les validations adaptées à la tâche.
- Indiquer les tests manuels recommandés après chaque tâche.
- Les messages de commit doivent être en français.

## Règles spécifiques à Marché Fooly

- Garder la version française prioritaire.
- Mettre la version anglaise en attente tant que la version française n’est pas finalisée.
- Garder des liens réels vers les pages existantes ou futures.
- Éviter `href="#"`, liens vides, boutons sans destination ou actions inutiles.
- Ne pas afficher de texte indiquant que le site est une maquette, un prototype ou une version statique.
- Le site doit paraître final, crédible et professionnel.
- Garder le positionnement : marketplace locale à Sangarédi, Guinée.
- Préserver la cohérence de marque : Marché Fooly / FOOLY / Le marché gagnant.
- Préserver les informations de contact existantes sauf instruction contraire :
  - Téléphone : +224 624 27 38 05
  - Email : contact@marchefooly.com
  - Localisation : Sangarédi, Guinée

## État actuel connu

Pages françaises présentes :
- `index.html`
- `boutique.html`
- `categories.html`
- `produit.html`
- `panier.html`
- `checkout.html`
- `commandes.html`
- `mon-compte.html`
- `favoris.html`
- `aide.html`
- `contact.html`
- `devenir-vendeur.html`

Pages anglaises présentes mais peu avancées :
- `en/index.html`
- `en/shop.html`
- `en/contact.html`

Points déjà validés :
- repo GitHub connecté ;
- branche principale : `main` ;
- navigation interne propre ;
- aucun `href="#"` détecté ;
- aucun `href=""` détecté ;
- formulaires principaux présents ;
- parcours marketplace prévu : accueil, boutique, produit, panier, checkout, commandes ;
- CSS global présent ;
- JavaScript léger.

## Points à corriger avant finalisation de la maquette

- Retirer tous les textes visibles du type :
  - maquette
  - statique
  - prototype
  - backend plus tard
  - paiement réel ajouté plus tard
  - compte maquette
- Ajouter des images locales :
  - logo
  - produits
  - catégories
  - bannières
  - vendeurs
- Uniformiser les prix en `GNF` au lieu de `Fr`.
- Remplacer `0 Fr` par `Gratuit` quand c’est une livraison ou un service offert.
- Remplacer les liens sociaux temporaires par de vrais liens.
- Centraliser progressivement le CSS inline dans une structure plus propre.
- Garder les textes comme si le site était déjà prêt pour le public.

## Qualité attendue

Chaque modification doit respecter ces critères :

1. UX claire et intuitive
- navigation simple ;
- actions compréhensibles ;
- aucun écran confus.

2. Performance rapide
- pas de lenteur visible ;
- animations fluides et légères ;
- éviter le code inutile.

3. Robustesse
- aucun crash JavaScript ;
- gérer les erreurs ;
- prévoir des fallbacks.

4. Logique métier cohérente
- parcours client cohérent ;
- parcours vendeur cohérent ;
- panier, prix, checkout et commandes crédibles.

5. Sécurité et fiabilité
- valider les champs de formulaires ;
- éviter les valeurs incohérentes ;
- ne jamais exposer de secrets.

6. Feedback utilisateur
- informer l’utilisateur après une action ;
- utiliser messages inline, alertes, loaders ou états visuels adaptés ;
- confirmer les actions importantes.

7. Design cohérent
- respecter le thème global ;
- UI homogène ;
- sections lisibles ;
- responsive mobile/tablette/desktop.

8. Gestion des cas limites
- champs vides ;
- valeurs extrêmes ;
- actions invalides ;
- erreurs utilisateur.

9. Scalabilité
- code structuré ;
- composants réutilisables lors de la migration Next.js ;
- éviter les duplications.

10. Expérience premium
- transitions subtiles ;
- détails visuels soignés ;
- interaction agréable ;
- rendu professionnel.

## Règles pour la future version Next.js

- Créer d’abord une structure claire de dossiers et fichiers.
- Prévoir des composants réutilisables.
- Éviter la duplication.
- Prévoir une architecture maintenable :
  - `components`
  - `app`
  - `services`
  - `types`
  - `utils`
  - `styles`
- Garder les prix en nombre côté base de données :
  - `price: 1200000`
  - `currency: "GNF"`
- Ne jamais stocker un prix comme texte complet du type `"1 200 000 GNF"`.
- Prévoir les rôles :
  - client
  - vendeur
  - administrateur

## Modules futurs

- Authentification client
- Authentification vendeur
- Dashboard vendeur
- Dashboard admin
- Gestion produits
- Gestion catégories
- Gestion panier
- Gestion commandes
- Gestion favoris
- Demandes vendeur
- Support/contact
- Newsletter
- Paiement à la livraison ou retrait vendeur
- Paiement en ligne plus tard si nécessaire

## Validation

Pour la maquette actuelle :
- vérifier l’affichage dans le navigateur ;
- tester les liens principaux ;
- tester le responsive mobile ;
- vérifier la console navigateur ;
- vérifier les formulaires visuellement.

Pour la future version npm / Next.js :
- lancer les commandes adaptées au projet :
  - `npm run lint`
  - `npm run build`
  - `npm test` si des tests existent
- vérifier manuellement les parcours critiques.

Avant commit :
- lancer `git status` ;
- vérifier qu’aucun fichier sensible ou hors scope n’est inclus ;
- utiliser `git add .` seulement si le périmètre est propre ;
- écrire un message de commit court et clair en français.

Si une validation échoue :
- expliquer clairement l’erreur rencontrée ;
- indiquer la cause probable ;
- proposer une solution simple avant de continuer.

## Communication attendue

Avant chaque tâche :
- discuter d’abord avec l’utilisateur s’il y a une question, un problème, un bug ou une ambiguïté ;
- expliquer clairement ce qui se passe ;
- expliquer le plan d’action avant de modifier le code ;
- utiliser si possible une explication technique puis une analogie simple de la vie réelle.

Après chaque tâche, l’agent doit fournir :
- résumé de ce qui a été fait ;
- résumé des fichiers modifiés ;
- résumé des validations lancées ;
- résultat des validations ;
- tests manuels recommandés ;
- message de commit proposé ;
- signalement clair de toute modification connexe importante.

À la fin d’une tâche :
- proposer éventuellement des pistes pour aller plus loin ;
- ne pas appliquer ces améliorations automatiquement ;
- laisser l’utilisateur décider s’il veut continuer ou non.

## Règle globale

Toute modification doit améliorer ou préserver :
- UX ;
- performance ;
- robustesse ;
- logique métier ;
- sécurité ;
- design ;
- maintenabilité ;
- expérience premium.

Si une modification dégrade un de ces points, elle doit être corrigée.

## État récent du projet

Travaux déjà réalisés :
- les textes visibles indiquant “maquette”, “statique”, “prototype” ou équivalents ont été retirés des pages HTML ;
- les prix visibles ont été uniformisés en `GNF` ;
- les images permanentes du site ont été ajoutées dans `assets/images/` ;
- les images permanentes ont été optimisées pour le web ;
- les images originales lourdes ne doivent pas être commitées.

Images permanentes disponibles :
- `assets/images/banners/home-hero-marketplace.jpg`
- `assets/images/banners/local-marketplace.jpg`
- `assets/images/banners/seller-hero.jpg`
- `assets/images/banners/trust-delivery.jpg`
- `assets/images/logo/marche-fooly-logo.jpeg`
- `assets/images/vendors/local-seller.jpg`

## Stratégie de migration Next.js

- Garder la maquette HTML actuelle comme référence visuelle.
- Créer la nouvelle application dans un dossier `frontend/`.
- Ne pas modifier massivement les anciens fichiers HTML sauf nécessité.
- Garder Bootstrap au début de la migration pour éviter de casser le design.
- Ne pas migrer tout le site en une seule tâche.
- Migrer étape par étape :
  1. structure Next.js ;
  2. layout global ;
  3. page accueil ;
  4. données statiques temporaires ;
  5. boutique et catégories ;
  6. produit, panier, favoris ;
  7. checkout, commandes, compte ;
  8. contact, aide, devenir vendeur ;
  9. nettoyage global ;
  10. backend Express/MongoDB.
- Centraliser les informations répétées dans une configuration, par exemple :
  - nom du site ;
  - slogan ;
  - téléphone ;
  - email ;
  - WhatsApp ;
  - localisation ;
  - liens sociaux.
- Le nettoyage complet des liens sociaux doit être fait pendant la création des composants Next.js `Header`, `Footer` et `TopBar`, pas en modifiant toutes les anciennes pages HTML.
- Utiliser des composants réutilisables pour éviter les duplications.
- Préparer les données temporaires dans `src/data/` avant la connexion MongoDB.
- Ne connecter le backend Express/MongoDB qu’après stabilisation du frontend Next.js.