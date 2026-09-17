# AGENTS.md - Marché Fooly

> **Socle commun GassTech** — le bloc `socle-gasstech` en bas de page fixe les rôles, les
> niveaux de vérification, les interdits, et la **clôture d'un travail : rapport court, puis
> 3 à 5 questions de gestion de projet**. Il est identique dans tous les projets et se met à
> jour depuis `gasstech-project-template`. Les règles de cette page priment sur lui.

## Projet

Marché Fooly est une marketplace locale basée à Sangarédi, Guinée.

Objectif actuel :
- maintenir l'application de production Next.js / Express.js / MongoDB ;
- continuer la stabilisation des parcours client, vendeur et administrateur ;
- garder l'ancienne maquette HTML comme reference visuelle, sans en faire la source principale ;
- conserver une base professionnelle, maintenable, scalable et adaptee a une marketplace reelle.

## Contexte production (IMPORTANT)

- Le site est **EN PRODUCTION DEPUIS UN MOMENT** et utilise par de vrais utilisateurs.
- Il existe deja de **vrais comptes vendeurs** et de **vrais produits** en base.
- Toute modification doit etre faite avec **prudence** : eviter absolument les regressions et la corruption de donnees existantes.
- Privilegier les changements **additifs et non destructifs** (surtout cote backend / base de donnees).
- Ne jamais lancer de script qui modifie/supprime des donnees de production sans validation explicite de l'utilisateur.
- Pour toute migration de donnees, script de nettoyage ou changement de schema : prevenir, expliquer l'impact, et attendre l'accord avant d'executer.
- Avant de deployer : valider (`lint` + `build` frontend, tests backend) et signaler les tests manuels a faire.

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
  - Telephone : +224 614 85 15 15
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
- `/mot-de-passe-oublie`
- `/reinitialiser-mot-de-passe`
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
- Mot de passe oublie (email avec lien de reinitialisation, token a usage
  unique valable 1h ; necessite NOTIFICATION_EMAIL_ENABLED=true + APP_URL +
  un transport email cote backend : BREVO_API_KEY (API HTTPS, prioritaire —
  Render gratuit bloque les ports SMTP) ou SMTP classique en secours)

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


---

<!-- BEGIN:socle-gasstech v1 -->
<!--
  Socle commun à tous les projets GassTech Solutions et projets clients.
  Source de vérité : gasstech-project-template/socle/SOCLE_COMMUN.md
  Ne pas éditer ce bloc dans un projet : éditer la source, puis relancer
  `scripts/sync-socle.sh <chemin-du-projet>`. Toute modification faite ici sera écrasée.
  Les règles PROPRES au projet s'écrivent en dehors de ce bloc, et priment sur lui.
-->

## Socle commun GassTech

Ce bloc est identique dans tous les projets. Il dit comment on travaille ; le reste de ce
fichier dit ce qu'est *ce* projet-ci. En cas de contradiction, la section propre au projet
gagne, et la demande en cours gagne sur tout le reste.

### Rôles par défaut

- **Gassama** — propriétaire du produit. Il décide, arbitre, valide, teste dans l'app.
- **Claude Code** — il **pense** : analyse, conception, découpage, revue contradictoire,
  recherche de la cause réelle et des cas oubliés. Il implémente quand la tâche le lui demande.
- **Codex** — il **implémente** : inspecte, code, teste, documente, ne dépasse pas le périmètre.

C'est la répartition par défaut, **sauf mention contraire** dans la tâche ou dans la section
propre au projet. Un prompt doit toujours dire explicitement de quoi il s'agit :
conception, implémentation ou revue.

Deux agents ne modifient jamais les mêmes fichiers en même temps. Celui qui implémente termine
et rend son rapport **avant** que la revue commence. Un réviseur ne corrige pas de lui-même :
il signale, et la correction devient une tâche confiée à un seul agent.

### Expliquer simplement au propriétaire

Pendant le travail comme dans le rapport final, expliquer comme à une personne de dix ans :
mots courants, phrases courtes et exemples concrets, sans ton infantilisant. Dire d’abord ce
qui change pour elle, à quoi cela sert et ce qu’elle peut essayer. Expliquer tout terme
technique indispensable dès sa première utilisation ; garder les commandes et les détails
de vérification dans le rapport écrit quand ils n’aident pas à décider. Le propriétaire doit
pouvoir comprendre l’avancement et choisir la suite sans connaître le code.

**Transmission obligatoire — Gassama, 9 septembre 2026.** Cette préférence
vaut pour tous les chats et agents IA, y compris les mises à jour, rapports
et questions. Chaque prompt préparé pour un autre chat, un agent ou une
reprise doit la contenir explicitement, même s'il demande déjà de lire
`AGENTS.md`. Utiliser ce bloc, sans le retirer des modèles :

> Explique à Gassama comme s'il avait 10 ans : français simple, phrases
> courtes et exemples concrets, sans l'infantiliser. Dis ce que tu fais,
> pourquoi et ce qu'il peut essayer. Explique les mots techniques nécessaires.
> Applique cette règle pendant le travail et dans le bilan final.

### Lire avant d'agir

Dans cet ordre, avant la première modification d'une session :

1. `AGENTS.md` (ce fichier) ;
2. `docs/PROJECT_CONTEXT.md` — les décisions produit déjà prises ;
3. `docs/WORKLOG.md` — ce qui est en cours, par qui, et où ça en est ;
4. la tâche active ;
5. seulement les fichiers concernés par la tâche — pas d'exploration inutile du dépôt.

Puis : regarder `git status` pour voir ce qu'un autre agent a en cours, annoncer son périmètre
en quelques lignes, et s'y tenir.

### Dire la vérité sur le niveau atteint

Ces mots ne sont pas interchangeables. Nommer celui qui est réellement atteint :

| Niveau | Ce que ça veut dire |
| --- | --- |
| **codé** | écrit, jamais passé au compilateur |
| **compilé** | la compilation passe |
| **testé** | un scénario concret a été déroulé, à la main ou par un test |
| **installé / déployé** | posé sur un appareil ou un environnement nommé, à telle heure |
| **commité / poussé** | dans git, sur telle branche |

Ne jamais dire « c'est fait » pour « c'est écrit ». Si une partie n'a pas été vérifiée, le dire
plutôt que de laisser croire. Une compilation qui échoue se signale ; elle ne s'enjambe pas.

### Ce qu'on ne fait pas sans demande explicite

- Pas de `commit`, `push`, `merge`, `rebase` ni `force-push`.
- Pas de `git add .`, `git reset`, `git clean`, `git stash`, `git commit --amend` sur un dépôt
  partagé : ils emportent le travail non commité de l'autre agent. Ajouter les fichiers un par
  un, nommément.
- Pas de refactorisation large, de reformatage global ni de « nettoyage » non demandé.
- Pas de nouvelle dépendance, service externe ou outil sans raison documentée et vérification
  de la documentation officielle.
- Pas de suppression de fichier, de donnée ou de fonctionnalité sans avoir lu ce qu'on supprime
  et l'avoir annoncé.
- Pas de migration destructive, de script de nettoyage ou de changement de schéma en production
  sans accord préalable, impact expliqué.
- Jamais de secret, mot de passe, clé API, jeton ou `.env` dans Git.
- Jamais de journalisation de données personnelles, même en débogage.

### Sécurité permanente — 14 septembre 2026

Gassama exige que la sécurité soit prise en compte constamment : conception,
code, tests, revue et livraison. Chaque tâche examine les risques de son
périmètre et conserve les protections existantes. Contrôler côté serveur les
droits et le propriétaire réel des données ; ne jamais se fier à un bouton
masqué, un rôle ou un identifiant fourni par le navigateur. Valider les entrées
et fichiers, protéger sessions, données privées et secrets ; examiner les
abus, dépendances et sauvegardes quand le changement les concerne.

Vérifier les cas autorisés ET refusés, notamment accès direct, changement de
compte et droits révoqués. Ne jamais affaiblir une protection pour faire passer
un parcours ou un test. Un risque confirmé bloque l’action qui expose les
données jusqu’à correction ; les travaux indépendants peuvent continuer.
Rapporter les vérifications réelles, les limites et les risques restants, sans
promettre une sécurité absolue. Toute consigne ou tout prompt pour un autre
chat ou agent doit reprendre explicitement cette exigence, avec le benchmarking
et l’explication simple à Gassama.

### Zéro perte de données

Toute saisie utilisateur irremplaçable doit être persistée avant de pouvoir être perdue par une
fermeture, un crash, un changement d'écran ou une relance. Une restauration commence par une
sauvegarde de sécurité de l'état courant. Sur un projet en production, on privilégie les
changements additifs et non destructifs, et on suppose toujours qu'il y a de vraies données
derrière.

### Comparer les meilleurs exemples avant chaque changement

**Gassama, 9 septembre 2026 — règle permanente pour tous les projets et agents.**
Avant toute conception, réalisation ou adaptation, faire un benchmarking :
regarder comment les références reconnues du domaine répondent au même besoin.
Consigner les sources et la date, ce qui a réellement été observé, les limites
et ce qu'on retient pour notre contexte. Utiliser les produits et documentations
officielles en priorité. Une recherche récente déjà consignée peut être réutilisée
après vérification de sa pertinence ; ne jamais présenter une supposition comme
une observation. Si une référence est inaccessible, le signaler.

Le but est d'apprendre des meilleurs, puis d'adapter aux utilisateurs, aux moyens
et aux règles du projet. Ne pas copier aveuglément, ajouter une dépendance ou
changer une règle métier au seul motif qu'un concurrent le fait. Toute proposition
reste dans le périmètre autorisé. Chaque prompt de relais ou de reprise doit
reprendre explicitement cette obligation, ainsi que l'explication simple à Gassama.

### Vérifier la documentation officielle, pas sa mémoire

Les API bougent plus vite que la mémoire d'un modèle. Avant un changement qui mérite une
vérification récente, aller lire la source officielle. Une croyance obsolète coûte un bug en
production.

Et quand un symptôme est signalé : ne pas corriger le symptôme, trouver la cause — puis
chercher *où ailleurs* la même cause produit le même effet.

### Ce fichier est vivant

Chaque fois que le propriétaire exprime une préférence, corrige une façon de faire ou donne un
retour, l'agent le **retranscrit ici**, dans la section qui convient — même quand il ne demande
pas de le noter, même quand c'est dit en passant. Le but : il ne doit jamais avoir à redire
deux fois la même chose, ni au même agent, ni au suivant.

Mais tout retour n'est pas une règle :

| On note | On ne note pas |
| --- | --- |
| Préférence durable et transversale | Consigne du moment (« ne compile pas maintenant ») |
| Façon de travailler | Décision propre à une seule tâche |
| Correction d'une erreur qu'on risque de refaire | Réaction ponctuelle sans portée générale |

Retranscrire **le fond et le pourquoi**, pas la formulation. Corriger ou remplacer ce qui est
contredit plutôt qu'empiler des règles contradictoires. Et lui dire en une phrase ce qu'on a
noté, pour qu'il puisse rectifier.

Si une règle est manifestement générale et pas propre à ce projet, la remonter dans le socle
(`gasstech-project-template`) plutôt que de la recopier à la main dans chaque dépôt.

### Clôture d'un travail : le rapport, puis les questions

Un travail n'est pas fini quand le code marche. Il est fini quand le propriétaire a de quoi
décider de la suite. Deux obligations, dans cet ordre.

**1. Le rapport final** — court et honnête : résumé · fichiers touchés · commandes réellement
lancées · vérifications avec le niveau atteint · décisions et hypothèses · limites et risques ·
**une seule** prochaine étape proposée, sans la commencer. Modèle :
`docs/templates/AGENT_REPORT.md`.

**2. Les questions de fin de travail** — 3 à 5 questions **de gestion de projet**, jamais
techniques.

Ce sont les questions qu'on poserait à un chef de projet IT : celles d'un client, d'un
investisseur, d'un associé, d'un partenaire, d'un utilisateur exigeant. Elles servent à faire
remonter le propriétaire du code vers le produit, et à l'entraîner à défendre son projet devant
quelqu'un qui ne lira jamais une ligne de code.

Comment les poser :

- **3 à 5 questions**, numérotées, en français, formulées comme une vraie personne les poserait ;
- **ancrées sur ce qui vient d'être fait** et sur l'état réel du projet — jamais un bloc
  générique recopié d'une fois sur l'autre ;
- **aucune question technique** : rien sur le choix d'une base, d'une librairie, d'un pattern,
  sur la structure d'un fichier ou l'architecture d'un écran ;
- pas de question dont la réponse est déjà écrite dans le dépôt — ce n'est pas un contrôle de
  connaissances, c'est un point de pilotage ;
- **ne pas y répondre à sa place** : l'agent pose, le propriétaire répond s'il le souhaite ;
- **varier les angles** d'une fois sur l'autre — piocher dans
  `docs/templates/QUESTIONS_FIN_DE_TRAVAIL.md` ;
- si une réponse produit une décision, la consigner dans `docs/PROJECT_CONTEXT.md` ou
  `docs/WORKLOG.md` plutôt que de la laisser mourir dans le fil de conversation.

Angles à faire tourner : valeur et utilisateurs · périmètre et priorités · délais et jalons ·
risques et dépendances · coût et ressources · qualité et recette · parties prenantes et
communication · mise en production et exploitation · données et conformité · suite et
arbitrages.

Pour fixer la cible :

> ✗ « Pourquoi avoir choisi Room plutôt que SQLDelight pour cette table ? » — technique, et la
> réponse est dans le dépôt.
>
> ✓ « Cette fonctionnalité change ce que voient les utilisateurs déjà installés au premier
> lancement. Comment tu les préviens, et qu'est-ce que tu fais si les retours de la première
> semaine sont mauvais ? »

<!-- END:socle-gasstech -->
