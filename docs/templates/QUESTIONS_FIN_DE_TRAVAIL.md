# Banque de questions de fin de travail

Support de la règle « Clôture d'un travail » du socle commun (`AGENTS.md`).

À la fin de chaque travail, l'agent pose **3 à 5 questions de gestion de projet** au
propriétaire. Ce fichier sert à **varier les angles** — il ne se recopie pas tel quel.

## Comment s'en servir

1. Choisir **2 ou 3 catégories** différentes de la fois précédente.
2. **Réécrire** la question pour qu'elle parle du travail qui vient d'être livré : le
   formulaire générique ne sert qu'à trouver l'angle. Une question qui pourrait être posée à
   n'importe quel projet n'a pas sa place.
3. Poser, puis se taire. On ne répond pas à la place du propriétaire.
4. Si une réponse tranche quelque chose, la consigner dans `docs/PROJECT_CONTEXT.md`.

Test rapide avant de poser : **est-ce qu'un client non technique pourrait poser cette
question ?** Si non, c'est une question technique — elle ne compte pas.

---

## 1. Valeur et utilisateurs

- Quel problème concret ce qu'on vient de livrer résout, pour qui, et comment tu sauras dans
  deux semaines que ça a marché ?
- Combien d'utilisateurs sont réellement concernés par ce changement ?
- Qu'est-ce qui se serait passé si on ne l'avait pas fait ce mois-ci ?
- Si un utilisateur te demande « à quoi ça sert ? », tu réponds quoi en une phrase ?
- Qu'est-ce que les utilisateurs demandent le plus souvent, et où se place ce qu'on vient de
  faire dans cette liste ?
- Est-ce que quelqu'un en dehors de toi a validé que c'était bien ce qu'il fallait faire ?

## 2. Périmètre et priorités

- Qu'est-ce que tu as volontairement laissé de côté sur ce lot, et jusqu'à quand ça peut
  attendre ?
- Si tu devais couper une fonctionnalité de ce projet demain matin pour livrer plus vite,
  laquelle et pourquoi ?
- Est-ce que ce chantier a grossi en cours de route par rapport à ce que tu avais prévu ?
- Quelles sont les trois prochaines choses par ordre de priorité, et qu'est-ce qui justifie cet
  ordre ?
- Qu'est-ce qui est « nice to have » dans ce qui reste, et qu'est-ce qui est bloquant ?
- Tu fais quoi si une demande urgente arrive demain sur un autre sujet ?

## 3. Délais et jalons

- Quelle est ta prochaine date de livraison visible, et par qui elle sera constatée ?
- Ce qu'on vient de faire, ça t'a pris plus ou moins de temps que ce que tu pensais ? Pourquoi ?
- Qu'est-ce qui reste entre aujourd'hui et la prochaine version publiée ?
- Si on te demande une démo dans 10 jours, qu'est-ce que tu montres et qu'est-ce que tu caches ?
- Il reste combien d'heures de travail réel avant que ce module soit fini, à ton estimation ?
- Est-ce que ce projet a une échéance externe (client, saison, concurrent) qui contraint la
  suite ?

## 4. Risques et dépendances

- Qu'est-ce qui peut casser en production à cause de ce changement, et comment tu le détectes ?
- De quoi ce projet dépend qui ne t'appartient pas (API tierce, hébergeur, compte Google, un
  prestataire) ?
- Si ce service tiers ferme ou double ses prix le mois prochain, tu fais quoi ?
- Qu'est-ce qui arriverait si tu étais indisponible deux semaines — quelqu'un peut reprendre ?
- Quel est le point du projet où tu es le moins serein aujourd'hui ?
- Est-ce qu'il y a un plan de retour arrière si cette version se passe mal ?

## 5. Coût et ressources

- Ce projet coûte combien par mois aujourd'hui, tout compris ?
- Ce qu'on vient d'ajouter change-t-il ce coût, maintenant ou à l'échelle ?
- À combien d'utilisateurs l'infrastructure actuelle commence à coûter cher ?
- Est-ce que ce projet est censé rapporter de l'argent, et par quel mécanisme ?
- Sur quoi tu es prêt à payer plutôt qu'à passer du temps ?
- Combien de temps par semaine tu peux réellement consacrer à ce projet dans les deux mois qui
  viennent ?

## 6. Qualité et recette

- Comment tu valides que ce lot est bon — qui teste, sur quoi, en combien de temps ?
- Quel est le scénario que tu dois absolument dérouler à la main avant de publier ?
- Qu'est-ce qui n'est pas couvert par des tests aujourd'hui et qui t'inquiète ?
- Quel niveau de bug tu tolères sur cette partie : zéro, gênant mais acceptable, ou peu
  importe ?
- Si un utilisateur trouve un bug, comment il te le fait savoir, et en combien de temps tu
  réponds ?
- Est-ce que tu as un moyen de savoir ce qui plante chez les utilisateurs sans qu'ils te le
  disent ?

## 7. Parties prenantes et communication

- Qui doit être au courant de ce changement en dehors de toi ?
- Comment tu annonces cette nouveauté aux utilisateurs — et est-ce que tu l'annonces ?
- Si un client te demande où en est le projet aujourd'hui, tu résumes ça comment en trois
  phrases ?
- Est-ce qu'il y a une attente exprimée par quelqu'un qui n'est pas encore satisfaite ?
- Qu'est-ce que tu montrerais en premier à un investisseur qui découvre ce projet ?
- Est-ce que quelqu'un attend une réponse de toi en ce moment sur ce projet ?

## 8. Mise en production et exploitation

- Qui appuie sur le bouton de mise en production, et à quel moment de la semaine ?
- Qu'est-ce que tu surveilles dans les 24 h qui suivent une publication ?
- Combien de temps il faut pour corriger et republier si un problème apparaît ?
- Est-ce que les utilisateurs actuels doivent faire quelque chose (mise à jour, migration,
  réinstallation) ?
- Qu'est-ce qui se passe pour ceux qui restent sur l'ancienne version ?
- Est-ce que tu as une sauvegarde récente, et est-ce que tu as déjà testé de la restaurer ?

## 9. Données et conformité

- Quelles données personnelles ce projet manipule, et où elles sont stockées physiquement ?
- Qu'est-ce que tu réponds à un utilisateur qui demande la suppression de ses données ?
- Qui a accès aux données de production aujourd'hui ?
- Est-ce qu'une perte de données est possible sur ce chemin, et qu'est-ce qui l'empêche ?
- Est-ce que ce projet a besoin de conditions d'utilisation ou d'une politique de
  confidentialité à jour ?
- Est-ce qu'il y a une contrainte légale ou de plateforme (Play Store, App Store, RGPD) qui
  s'applique à ce qu'on vient de faire ?

## 10. Suite et arbitrages

- Quelle est la seule décision que tu dois prendre avant qu'on reprenne le travail ?
- Sur quoi tu hésites en ce moment, et qu'est-ce qui te débloquerait ?
- Ce projet, dans six mois, il ressemble à quoi si tout va bien ? Et si rien n'avance ?
- Qu'est-ce que tu arrêterais aujourd'hui si tu devais te concentrer sur un seul projet ?
- Est-ce que ce projet est encore aligné avec ce que tu veux en faire quand tu l'as commencé ?
- Qu'est-ce que ce chantier t'a appris qui change ta façon de prévoir le suivant ?

## 11. Dette et maintenance

- Qu'est-ce qu'on s'est permis de bâcler ici et qu'il faudra reprendre ?
- Quelle partie du projet tu redoutes de rouvrir dans six mois ?
- Si quelqu'un d'autre reprenait ce dépôt demain, qu'est-ce qui lui manquerait pour comprendre ?
- Combien de temps par mois tu es prêt à consacrer à la maintenance de l'existant plutôt qu'au
  neuf ?
- Est-ce qu'il y a des choses en place « en attendant » qui sont devenues permanentes ?

## 12. Concurrence et positionnement

- Qui fait déjà ce que tu fais, et pourquoi quelqu'un te choisirait toi ?
- Ce qu'on vient d'ajouter, c'est un rattrapage sur la concurrence ou un vrai différenciateur ?
- Qu'est-ce que tes utilisateurs utilisent aujourd'hui à la place de ton produit ?
- Sur quoi tu ne veux surtout pas te battre parce que c'est perdu d'avance ?
