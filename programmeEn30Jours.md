# PROGRAMME.md - Marché Fooly

## Objectif global

Finaliser Marché Fooly de A à Z pour passer d’une maquette statique HTML/CSS/Bootstrap à une vraie marketplace web fonctionnelle.

Stack cible :
- Frontend : Next.js
- Backend : Express.js
- Base de données : MongoDB
- Interface : responsive desktop/mobile
- Rôles futurs : client, vendeur, administrateur

Objectif final :
- interface complète en Next.js ;
- pages principales migrées ;
- composants réutilisables ;
- backend API fonctionnel ;
- produits, catégories, utilisateurs, commandes ;
- espace vendeur minimal ;
- espace admin minimal ;
- déploiement propre.

---

## Stratégie générale

La priorité est de ne pas tout mélanger.

Ordre de travail :
1. Transformer l’interface actuelle en Next.js.
2. Stabiliser le design, les liens et le responsive.
3. Créer le backend Express.js + MongoDB.
4. Connecter progressivement le frontend au backend.
5. Tester, corriger, sécuriser et déployer.

Le backend, l’authentification réelle, le panier réel et les dashboards dynamiques seront faits après la migration complète de l’interface.

---

# Phase 1 - Stabilisation de la maquette existante

## Jour 1 - Nettoyage des textes visibles

Objectif :
Rendre la maquette plus professionnelle.

À faire :
- retirer les textes indiquant maquette, prototype, statique ;
- reformuler les textes qui donnaient une impression de site non terminé ;
- vérifier les pages principales ;
- commit/push.

Statut :
- Terminé.

---

## Jour 2 - Uniformisation des prix

Objectif :
Rendre les prix cohérents partout.

À faire :
- remplacer `Fr` par `GNF` ;
- garder les prix au format clair : `1 200 000 GNF` ;
- garder `0 GNF` quand il s’agit d’une remise nulle ;
- vérifier boutique, produit, panier, checkout, commandes, favoris ;
- commit/push.

Statut :
- Terminé.

---

## Jour 3 - Préparation des visuels permanents

Objectif :
Préparer les images permanentes du site.

À faire :
- créer les dossiers images ;
- ajouter le logo ;
- ajouter les bannières permanentes ;
- optimiser les images pour le web ;
- éviter les fichiers lourds ;
- ne pas pousser les images originales lourdes ;
- commit/push.

Statut :
- Terminé ou en cours selon intégration.

Images prévues :
- `home-hero-marketplace.jpg`
- `seller-hero.jpg`
- `local-marketplace.jpg`
- `trust-delivery.jpg`
- `local-seller.jpg`
- `marche-fooly-logo.jpeg`

---

# Phase 2 - Migration interface vers Next.js

## Jour 4 - Création de la base Next.js

Objectif :
Créer le dossier `frontend/` avec une base propre.

À faire :
- créer projet Next.js ;
- utiliser TypeScript ;
- utiliser App Router ;
- installer Bootstrap et Bootstrap Icons ;
- créer `siteConfig` ;
- créer page temporaire ;
- configurer Node avec `.nvmrc` ;
- lancer `npm run lint` ;
- lancer `npm run build` ;
- commit/push.

Statut :
- Terminé.

---

## Jour 5 - Layout global Next.js

Objectif :
Créer les composants communs.

À faire :
- créer `TopBar`;
- créer `Header`;
- créer `Footer`;
- créer `SearchBar`;
- créer `Newsletter`;
- utiliser `siteConfig`;
- centraliser téléphone, email, WhatsApp, localisation ;
- utiliser `next/link`;
- sécuriser les liens externes avec `target="_blank"` et `rel="noopener noreferrer"`;
- lancer lint/build ;
- commit/push.

Statut :
- Terminé.

---

## Jour 6 - Migration de la page d’accueil

Objectif :
Migrer `index.html` vers Next.js.

À faire :
- créer homepage Next.js ;
- migrer hero ;
- migrer catégories ;
- migrer produits populaires temporaires ;
- migrer section vendeur ;
- migrer fonctionnement ;
- migrer pourquoi FOOLY ;
- migrer témoignages ;
- migrer newsletter ;
- utiliser les images permanentes ;
- lancer lint/build ;
- commit/push.

Statut :
- Terminé ou à valider selon commit.

---

## Jour 7 - Migration Boutique + Catégories

Objectif :
Migrer `boutique.html` et `categories.html`.

À faire :
- créer `/boutique`;
- créer `/categories`;
- créer ou améliorer `ProductCard`;
- créer ou améliorer `CategoryCard`;
- créer filtres visuels ;
- créer tri visuel ;
- créer données temporaires produits/catégories si nécessaire ;
- garder les prix en GNF ;
- ne pas connecter de backend ;
- lancer lint/build ;
- commit/push.

Statut :
- En cours.

---

## Jour 8 - Migration Produit + Panier + Favoris

Objectif :
Migrer les pages e-commerce principales.

À faire :
- créer `/produit/[slug]`;
- créer `/panier`;
- créer `/favoris`;
- migrer fiche produit ;
- migrer choix quantité ;
- migrer résumé panier ;
- migrer favoris ;
- garder une interface statique propre ;
- utiliser données temporaires ;
- lancer lint/build ;
- commit/push.

---

## Jour 9 - Migration Checkout + Commandes + Mon compte

Objectif :
Migrer le parcours client.

À faire :
- créer `/checkout`;
- créer `/commandes`;
- créer `/mon-compte`;
- migrer formulaires checkout ;
- migrer suivi commande ;
- migrer connexion/inscription visuelle ;
- ne pas créer encore de vraie auth ;
- ne pas créer encore de vraie commande ;
- lancer lint/build ;
- commit/push.

---

## Jour 10 - Migration Contact + Aide + Devenir vendeur

Objectif :
Migrer les pages secondaires importantes.

À faire :
- créer `/contact`;
- créer `/aide`;
- créer `/devenir-vendeur`;
- migrer formulaire contact ;
- migrer FAQ ;
- migrer demande vendeur ;
- intégrer image vendeur si utile ;
- garder les formulaires visuels ;
- lancer lint/build ;
- commit/push.

---

## Jour 11 - Nettoyage final interface Next.js

Objectif :
Stabiliser toute l’interface migrée.

À faire :
- vérifier tous les liens ;
- vérifier aucun `href="#"` ou `href=""` ;
- vérifier aucun texte maquette/prototype/statique ;
- vérifier responsive mobile/tablette/desktop ;
- vérifier images ;
- vérifier console navigateur ;
- corriger incohérences UI ;
- lancer lint/build ;
- commit/push.

---

# Phase 3 - Préparation backend Express.js + MongoDB

## Jour 12 - Création du backend Express

Objectif :
Créer la base backend.

À faire :
- créer dossier `backend/`;
- initialiser Node/Express ;
- installer dépendances ;
- créer structure :
  - `config`
  - `models`
  - `controllers`
  - `routes`
  - `middlewares`
  - `utils`
- créer route health check ;
- lancer serveur local ;
- commit/push.

---

## Jour 13 - Connexion MongoDB + configuration

Objectif :
Connecter le backend à MongoDB.

À faire :
- créer connexion MongoDB ;
- configurer `.env`;
- ajouter `.env.example`;
- protéger `.env` dans `.gitignore`;
- tester connexion ;
- gérer erreurs de connexion ;
- commit/push.

---

## Jour 14 - Modèles MongoDB principaux

Objectif :
Préparer la structure de données.

À faire :
- créer modèle `User`;
- créer modèle `SellerProfile`;
- créer modèle `Category`;
- créer modèle `Product`;
- créer modèle `Order`;
- créer modèle `ContactMessage`;
- créer modèle `NewsletterSubscriber`;
- ajouter validations de base ;
- commit/push.

---

## Jour 15 - API Auth client

Objectif :
Créer inscription/connexion client.

À faire :
- route inscription ;
- route connexion ;
- hash mot de passe ;
- JWT ;
- middleware auth ;
- validation inputs ;
- tests avec Thunder Client/Postman ;
- commit/push.

---

## Jour 16 - API vendeurs

Objectif :
Créer le parcours vendeur backend.

À faire :
- route demande vendeur ;
- statut vendeur : pending, approved, rejected ;
- profil boutique ;
- validation des champs ;
- protection routes vendeur ;
- commit/push.

---

# Phase 4 - Produits, catégories, commandes

## Jour 17 - API catégories

Objectif :
Gérer les catégories depuis MongoDB.

À faire :
- liste catégories ;
- détail catégorie ;
- création admin ;
- modification admin ;
- suppression admin ;
- seed catégories initiales ;
- commit/push.

---

## Jour 18 - API produits

Objectif :
Gérer les produits depuis MongoDB.

À faire :
- liste produits ;
- détail produit par slug ;
- produits par catégorie ;
- création produit vendeur/admin ;
- modification produit ;
- suppression produit ;
- champs : nom, slug, prix, devise, stock, vendeur, catégorie, images ;
- commit/push.

---

## Jour 19 - API commandes

Objectif :
Créer les commandes.

À faire :
- créer commande ;
- générer référence commande ;
- calculer total côté backend ;
- stocker client, produits, quantités, livraison, paiement ;
- créer statuts commande ;
- commit/push.

---

## Jour 20 - API contact + newsletter

Objectif :
Connecter les formulaires simples.

À faire :
- route contact ;
- route newsletter ;
- validation email ;
- éviter doublons newsletter ;
- feedback clair ;
- commit/push.

---

# Phase 5 - Connexion frontend/backend

## Jour 21 - Connexion produits et catégories

Objectif :
Remplacer les données temporaires par l’API.

À faire :
- connecter `/boutique` à l’API produits ;
- connecter `/categories`;
- connecter `/produit/[slug]`;
- gérer loading ;
- gérer erreur ;
- gérer aucun résultat ;
- commit/push.

---

## Jour 22 - Connexion auth frontend

Objectif :
Brancher inscription/connexion.

À faire :
- connecter formulaires ;
- stocker token proprement ;
- gérer utilisateur connecté ;
- protéger pages nécessaires ;
- ajouter déconnexion ;
- commit/push.

---

## Jour 23 - Connexion panier et checkout

Objectif :
Rendre le parcours achat utilisable.

À faire :
- panier côté frontend ;
- ajout produit ;
- modification quantité ;
- suppression produit ;
- checkout connecté ;
- création commande backend ;
- page confirmation ;
- commit/push.

---

## Jour 24 - Connexion commandes client

Objectif :
Afficher l’historique client.

À faire :
- connecter `/commandes`;
- afficher commandes utilisateur ;
- afficher statuts ;
- recherche par référence ;
- gérer aucun résultat ;
- commit/push.

---

# Phase 6 - Espaces vendeur et admin MVP

## Jour 25 - Dashboard vendeur MVP

Objectif :
Permettre au vendeur de gérer ses produits.

À faire :
- page dashboard vendeur ;
- liste produits vendeur ;
- formulaire ajout produit ;
- formulaire modification produit ;
- suppression produit ;
- statistiques simples ;
- commit/push.

---

## Jour 26 - Commandes vendeur

Objectif :
Permettre au vendeur de suivre ses commandes.

À faire :
- liste commandes vendeur ;
- détail commande ;
- changement statut ;
- feedback utilisateur ;
- commit/push.

---

## Jour 27 - Dashboard admin MVP

Objectif :
Créer une supervision minimale.

À faire :
- page admin ;
- liste utilisateurs ;
- liste vendeurs ;
- validation/rejet vendeur ;
- liste produits ;
- liste commandes ;
- protection rôle admin ;
- commit/push.

---

# Phase 7 - Finalisation, sécurité, déploiement

## Jour 28 - Sécurité et robustesse

Objectif :
Sécuriser le MVP.

À faire :
- vérifier validation backend ;
- vérifier routes protégées ;
- vérifier rôles client/vendeur/admin ;
- vérifier CORS ;
- vérifier `.env`;
- ajouter gestion erreurs propre ;
- vérifier aucun secret commit ;
- commit/push.

---

## Jour 29 - Déploiement

Objectif :
Mettre en ligne.

À faire :
- préparer build frontend ;
- déployer Next.js ;
- déployer backend ;
- connecter MongoDB production ;
- configurer variables d’environnement ;
- tester site en ligne ;
- commit/push si ajustements.

---

## Jour 30 - Tests finaux et livraison MVP

Objectif :
Valider le projet complet.

À faire :
- tester parcours visiteur ;
- tester parcours client ;
- tester parcours vendeur ;
- tester parcours admin ;
- tester responsive ;
- tester liens ;
- tester formulaires ;
- corriger bugs critiques ;
- mettre à jour README ;
- préparer note de livraison ;
- commit/push final.

---

# Règles quotidiennes

Chaque jour :
1. Lire `AGENTS.md`.
2. Vérifier `git status`.
3. Définir une seule tâche claire.
4. Choisir l’agent et le modèle adaptés.
5. Modifier uniquement le périmètre prévu.
6. Lancer validations.
7. Tester manuellement.
8. Commit/push si tout est OK.

---

# Règle importante

Ne pas commencer le backend tant que l’interface Next.js n’est pas entièrement migrée et stable.