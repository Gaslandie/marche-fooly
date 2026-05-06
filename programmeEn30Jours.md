Programme 30 jours — Marché Fooly
Objectif final à J30

Avoir une application marketplace fonctionnelle MVP avec :

frontend moderne en Next.js ;
backend en Express.js ;
base de données MongoDB ;
comptes client, vendeur et admin ;
produits, catégories, panier, favoris, commandes ;
formulaire vendeur, contact, newsletter ;
dashboard vendeur ;
dashboard admin minimal ;
déploiement frontend + backend ;
maquette statique actuelle transformée en vraie application.

Priorité : faire une version française complète, propre, fonctionnelle, avant de penser à la version anglaise.

Phase 1 — Finaliser et nettoyer la maquette actuelle
Jour 1 — Audit final + nettoyage des textes visibles

Objectif : faire disparaître tout ce qui montre que le site est une maquette.

À faire :

Lire AGENTS.md.
Chercher tous les textes contenant :
maquette ;
statique ;
prototype ;
backend plus tard ;
paiement réel ajouté plus tard ;
compte maquette.
Remplacer par des textes professionnels.
Corriger les messages dans :
index.html ;
produit.html ;
mon-compte.html ;
contact.html ;
devenir-vendeur.html ;
footers des pages.
Tester toutes les pages dans le navigateur.
Commit/push.

Résultat attendu : le site paraît déjà final et crédible, même s’il est encore statique.

Jour 2 — Uniformisation des prix et devise

Objectif : rendre les prix cohérents partout.

À faire :

Remplacer tous les prix en Fr par GNF.
Remplacer 0 Fr par Gratuit quand c’est une livraison ou un service offert.
Vérifier :
index.html ;
boutique.html ;
produit.html ;
panier.html ;
checkout.html ;
commandes.html ;
favoris.html ;
mon-compte.html.
Garder un format uniforme :
1 200 000 GNF
Tester visuellement les pages.
Commit/push.

Résultat attendu : prix professionnels et cohérents sur tout le site.

Jour 3 — Ajout des images locales

Objectif : rendre la marketplace plus réaliste.

À faire :

Créer une structure d’assets :
assets/images/logo/
assets/images/products/
assets/images/categories/
assets/images/banners/
assets/images/vendors/
Ajouter :
logo Marché Fooly ;
images produits ;
images catégories ;
bannière homepage ;
images vendeur.
Remplacer les blocs visuels purement CSS par de vraies images là où c’est pertinent.
Optimiser les images pour le web.
Vérifier l’affichage mobile.
Commit/push.

Résultat attendu : le site ressemble davantage à une vraie marketplace.

Jour 4 — Nettoyage des liens sociaux et contacts

Objectif : avoir des liens réalistes.

À faire :

Vérifier les liens Facebook, WhatsApp, Instagram.
Garder WhatsApp avec :
https://wa.me/224624273805
Remplacer les liens sociaux qui pointent vers contact.html.
Si Facebook/Instagram n’existent pas encore, retirer temporairement les icônes ou les remplacer par contact/WhatsApp.
Vérifier téléphone, email, localisation dans toutes les pages.
Commit/push.

Résultat attendu : aucun lien social trompeur ou faux.

Jour 5 — Nettoyage UX global de la maquette

Objectif : rendre la navigation fluide et professionnelle.

À faire :

Tester tout le parcours :
Accueil → Boutique → Produit → Panier → Checkout → Commandes
Tester les parcours secondaires :
favoris ;
compte ;
aide ;
contact ;
devenir vendeur.
Vérifier les boutons principaux.
Vérifier responsive mobile/tablette.
Corriger les incohérences visibles.
Commit/push.

Résultat attendu : maquette statique propre, présentable et prête pour migration.

Phase 2 — Préparer la migration Next.js
Jour 6 — Création du projet Next.js

Objectif : démarrer la vraie application frontend.

À faire :

Créer un nouveau dossier frontend :
frontend/
Initialiser Next.js avec TypeScript.
Installer les dépendances nécessaires :
Bootstrap ou Tailwind selon décision ;
Bootstrap Icons si on garde le style actuel ;
outils de lint.
Créer la structure de base :
frontend/src/app
frontend/src/components
frontend/src/lib
frontend/src/types
frontend/src/styles
frontend/src/data
Configurer le thème global.
Commit/push.

Résultat attendu : projet Next.js propre et prêt.

Jour 7 — Création du layout global Next.js

Objectif : transformer la structure répétée HTML en composants.

À faire :

Créer le composant Header.
Créer le composant TopBar.
Créer le composant Footer.
Créer le composant SearchBar.
Créer le composant Newsletter.
Créer le layout global.
Tester une première page.
Commit/push.

Résultat attendu : fin de la duplication header/footer.

Jour 8 — Migration de la page d’accueil

Objectif : migrer index.html vers Next.js.

À faire :

Créer la page /.
Découper la homepage en composants :
hero ;
catégories ;
produits populaires ;
section vendeurs ;
avantages ;
témoignages ;
newsletter.
Remplacer les données codées en dur par des fichiers temporaires dans data/.
Tester responsive.
Commit/push.

Résultat attendu : homepage Next.js fonctionnelle.

Jour 9 — Migration boutique et catégories

Objectif : créer le catalogue frontend.

À faire :

Créer /boutique.
Créer /categories.
Créer les composants :
ProductCard ;
CategoryCard ;
ProductFilters ;
ProductSort.
Utiliser des données temporaires.
Préparer la structure pour brancher l’API plus tard.
Commit/push.

Résultat attendu : catalogue Next.js propre.

Jour 10 — Migration produit, panier, favoris

Objectif : migrer les pages e-commerce principales.

À faire :

Créer /produit/[slug].
Créer /panier.
Créer /favoris.
Créer les composants :
ProductDetails ;
QuantitySelector ;
CartItem ;
WishlistItem.
Préparer les states côté frontend.
Commit/push.

Résultat attendu : parcours produit → panier prêt côté UI.

Phase 3 — Backend Express.js + MongoDB
Jour 11 — Création du backend Express

Objectif : démarrer l’API.

À faire :

Créer un dossier :
backend/
Initialiser Node.js + Express.
Configurer TypeScript si souhaité.
Installer :
express ;
mongoose ;
cors ;
dotenv ;
helmet ;
morgan ;
bcrypt ;
jsonwebtoken.
Créer la structure :
backend/src/config
backend/src/models
backend/src/controllers
backend/src/routes
backend/src/middlewares
backend/src/utils
Ajouter route health check.
Commit/push.

Résultat attendu : API Express opérationnelle.

Jour 12 — Connexion MongoDB + modèles de base

Objectif : préparer la base de données.

À faire :

Créer la connexion MongoDB.
Créer les modèles :
User;
SellerProfile;
Category;
Product;
Order;
ContactMessage;
NewsletterSubscriber.
Prévoir les rôles :
client
seller
admin
Ajouter validations Mongoose.
Commit/push.

Résultat attendu : fondation MongoDB prête.

Jour 13 — Authentification client

Objectif : permettre inscription et connexion client.

À faire :

Créer route inscription.
Créer route connexion.
Hasher les mots de passe.
Générer un token JWT.
Ajouter middleware auth.
Tester avec Postman, Insomnia ou Thunder Client.
Commit/push.

Résultat attendu : un client peut créer un compte et se connecter.

Jour 14 — Authentification vendeur et demande boutique

Objectif : gérer le parcours vendeur.

À faire :

Créer route demande vendeur.
Créer modèle SellerProfile.
Ajouter statut vendeur :
pending
approved
rejected
Connecter le formulaire devenir-vendeur.
Prévoir validation admin plus tard.
Commit/push.

Résultat attendu : un vendeur peut demander l’ouverture d’une boutique.

Phase 4 — Produits, catégories, panier, commandes
Jour 15 — API catégories

Objectif : gérer les catégories dynamiques.

À faire :

Créer routes catégories :
liste ;
détail ;
création admin ;
modification admin ;
suppression admin.
Ajouter seed de catégories de départ.
Connecter frontend catégories à l’API.
Commit/push.

Résultat attendu : les catégories viennent de MongoDB.

Jour 16 — API produits

Objectif : gérer les produits dynamiques.

À faire :

Créer routes produits :
liste ;
détail ;
produits par catégorie ;
création vendeur/admin ;
modification ;
suppression.
Ajouter champs :
nom ;
slug ;
description ;
prix ;
devise ;
stock ;
images ;
catégorie ;
vendeur.
Tester API.
Commit/push.

Résultat attendu : les produits viennent de MongoDB.

Jour 17 — Connexion frontend produits

Objectif : remplacer les produits statiques par les produits API.

À faire :

Connecter /boutique à l’API produits.
Connecter /produit/[slug].
Connecter /categories.
Gérer :
loading ;
erreur ;
aucun produit trouvé.
Commit/push.

Résultat attendu : catalogue dynamique fonctionnel.

Jour 18 — Panier frontend

Objectif : rendre le panier utilisable.

À faire :

Créer logique panier côté frontend.
Ajouter produit au panier.
Modifier quantité.
Supprimer produit.
Calculer total.
Persister temporairement avec localStorage.
Commit/push.

Résultat attendu : panier réel côté client.

Jour 19 — Checkout et création commande

Objectif : transformer checkout en vraie commande.

À faire :

Créer API POST /orders.
Connecter le formulaire checkout.
Envoyer :
client ;
produits ;
quantités ;
livraison ;
paiement ;
note vendeur.
Calculer total côté backend.
Créer référence commande.
Commit/push.

Résultat attendu : une commande peut être créée.

Jour 20 — Page commandes client

Objectif : permettre au client de voir ses commandes.

À faire :

Créer API GET /orders/me.
Connecter page /commandes.
Afficher :
numéro commande ;
statut ;
produits ;
total ;
date.
Ajouter recherche par numéro de commande.
Commit/push.

Résultat attendu : historique commandes fonctionnel.

Phase 5 — Espaces client, vendeur et admin
Jour 21 — Espace client

Objectif : rendre mon-compte utile.

À faire :

Connecter connexion/inscription Next.js.
Afficher infos utilisateur.
Ajouter routes protégées.
Ajouter déconnexion.
Ajouter page profil.
Commit/push.

Résultat attendu : espace client fonctionnel.

Jour 22 — Favoris dynamiques

Objectif : connecter les favoris.

À faire :

Créer API favoris.
Ajouter/retrait favoris depuis produit/boutique.
Afficher favoris du client.
Gérer utilisateur non connecté.
Commit/push.

Résultat attendu : favoris réels.

Jour 23 — Dashboard vendeur minimal

Objectif : permettre au vendeur de gérer ses produits.

À faire :

Créer /vendeur/dashboard.
Afficher statistiques simples :
produits ;
commandes ;
ventes.
Ajouter page produits vendeur.
Ajouter création produit.
Ajouter modification produit.
Commit/push.

Résultat attendu : vendeur peut gérer ses produits.

Jour 24 — Commandes vendeur

Objectif : permettre au vendeur de suivre ses commandes.

À faire :

Créer API commandes vendeur.
Afficher commandes contenant ses produits.
Permettre changement de statut :
en attente
confirmée
en préparation
livrée
annulée
Ajouter feedback utilisateur.
Commit/push.

Résultat attendu : vendeur peut suivre ses ventes.

Jour 25 — Dashboard admin minimal

Objectif : permettre la gestion globale.

À faire :

Créer /admin.
Protéger par rôle admin.
Afficher :
utilisateurs ;
vendeurs ;
produits ;
commandes ;
demandes vendeur.
Ajouter validation/rejet vendeur.
Commit/push.

Résultat attendu : admin peut superviser la marketplace.

Phase 6 — Support, recherche, sécurité, qualité
Jour 26 — Contact, aide, newsletter

Objectif : connecter les formulaires secondaires.

À faire :

API contact.
API newsletter.
Connecter formulaire contact.
Connecter formulaire newsletter.
Créer page aide propre.
Gérer feedback utilisateur après envoi.
Commit/push.

Résultat attendu : support et newsletter fonctionnels.

Jour 27 — Recherche, filtres et tri

Objectif : rendre la boutique agréable à utiliser.

À faire :

Recherche produit par texte.
Filtre catégorie.
Filtre prix.
Filtre stock.
Tri :
récent ;
prix croissant ;
prix décroissant ;
populaire.
Connecter frontend/backend.
Commit/push.

Résultat attendu : catalogue utilisable comme vraie marketplace.

Jour 28 — Sécurité et robustesse

Objectif : solidifier l’application.

À faire :

Vérifier validation backend.
Vérifier routes protégées.
Vérifier rôles :
client ;
vendeur ;
admin.
Ajouter gestion erreurs API.
Ajouter rate limit si nécessaire.
Vérifier CORS.
Vérifier variables .env.
Commit/push.

Résultat attendu : application plus fiable et sécurisée.

Jour 29 — SEO, performance et déploiement

Objectif : préparer la mise en ligne.

À faire :

Optimiser titles et meta descriptions.
Ajouter Open Graph.
Optimiser images.
Vérifier responsive.
Vérifier performance.
Déployer frontend.
Déployer backend.
Connecter MongoDB production.
Commit/push.

Résultat attendu : app accessible en ligne.

Jour 30 — Tests finaux et livraison MVP

Objectif : valider toute l’application.

À faire :

Tester parcours visiteur :
accueil ;
boutique ;
produit ;
recherche.
Tester parcours client :
inscription ;
connexion ;
panier ;
checkout ;
commandes ;
favoris.
Tester parcours vendeur :
demande vendeur ;
dashboard ;
ajout produit ;
commandes.
Tester parcours admin :
validation vendeur ;
gestion produits ;
gestion commandes.
Corriger les bugs critiques.
Mettre à jour README.
Préparer note de livraison.
Commit/push final.

Résultat attendu : Marché Fooly MVP fonctionnel, présentable et exploitable.