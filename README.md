# Portfolio

Mon portfolio de développeur full-stack : une grille bento sur desktop et tablette, un fil de projets plein écran sur mobile.

**Démonstration en direct :** [kilian-au.fr/portfolio](https://kilian-au.fr/portfolio/)

## 🎨 Fonctionnalités

- **Grille bento** : la page d'accueil est composée de cartes (navigation, titre, description, photo, carrousel de projets, réseaux sociaux)
- **Fil mobile** : sous 600px, l'accueil devient un fil à défilement magnétique (une intro, un écran par projet, un écran contact) avec un indicateur de position
- **Projets en vidéo** : le carrousel desktop joue une boucle muette au survol, le fil mobile lance des reels verticaux en lecture automatique (avec un bouton de son, muet au départ comme l'exigent les navigateurs)
- **Pages de projets** : une liste de tous les projets et une page détaillée par projet (vidéo en tête, galerie de captures, données structurées `VideoObject`), avec titre et description propres à chaque page
- **Animations** : entrée en cascade des cartes sur tablette et desktop, chargeur sur mobile, effets au survol du carrousel et de la navigation
- **S'adapte à l'écran** : la taille de base suit la largeur de l'écran, du portable à la 4K
- **SEO** : balises meta, cartes Open Graph et Twitter, données structurées JSON-LD et sitemap
- **Accessibilité** : navigation au clavier, focus visibles et textes alternatifs

## 🚀 Stack technique

### Frontend

- **Angular 21** : composants standalone, signals et détection de changements `OnPush`
- **TypeScript** en mode strict
- **Tailwind CSS v4** : thème défini en CSS via `@theme`, sans fichier de configuration
- **Bricolage Grotesque** (police auto-hébergée) et **Font Awesome**
- **Vitest** pour les tests unitaires, **ESLint** et **Prettier** pour la qualité du code

### Déploiement

- **Docker & Docker Compose** : build multi-étapes
- **Nginx** : sert l'application dans le conteneur
- **Caddy** : reverse proxy et HTTPS sur le VPS, sert le site sous `/portfolio/`
- **GitHub Actions** : lint, build et tests à chaque push et pull request sur `main`

## 📁 Structure

```
portfolio/          Application Angular (tout le code actif)
  src/app/
    components/     Cartes bento, fil mobile, chargeurs
    pages/          Accueil, À propos, Projets, Détail projet, 404
    services/       Chargement des projets
  public/files/     projects.json : le contenu des projets
  public/videos/    Vidéos et affiches par projet (landscape, landscape-loop, vertical)
  public/images/    Captures d'écran par projet (.webp)
  scripts/          encode-media.sh : encodage des vidéos
portfolio-api/      Emplacement réservé pour une future API .NET
deploy/             Configuration Caddy et procédure de mise en ligne
```

Les projets viennent d'un fichier JSON statique (`portfolio/public/files/projects.json`), il n'y a pas d'API. Pour ajouter un projet, il suffit de l'ajouter dans ce fichier (le champ `video` référence ses médias) et d'ajouter son URL dans `portfolio/public/sitemap.xml`.

Les médias de chaque projet vivent dans `portfolio/public/videos/<slug>/` (`landscape.mp4`, `landscape-loop.mp4`, `vertical.mp4`, `landscape.webp`, `vertical.webp`) et `portfolio/public/images/<slug>/`. `portfolio/scripts/encode-media.sh` les a générés, mais c'est un script ponctuel : il lit les sources d'origine (`brag*`), qui ne sont plus dans le dépôt, donc il ne se relance pas tel quel.

## 💻 Développement local

```bash
cd portfolio
npm install
npm start          # serveur de développement sur http://localhost:4200
npm test           # tests unitaires (Vitest)
npm run lint       # ESLint
npm run build      # build de production
```

## 🐳 Docker

1. **Créer le fichier `.env` à la racine** (voir `.env.sample`)

   ```bash
   UI_PORT=4200
   ```

2. **Construire et lancer avec Docker Compose** _(Docker Desktop requis sur Windows)_

   ```bash
   docker-compose up
   ```

> L'image de production sert l'application sous `/portfolio/` et a besoin de Caddy devant elle. Le conteneur seul n'est donc pas navigable à `/` : pour le développement, utilisez `npm start`, qui sert l'application à `/`.

La mise en ligne sur le VPS (Caddy, ordre des étapes, retour arrière) est décrite dans [`deploy/README.md`](deploy/README.md).

## 📄 Licence

Ce projet est sous licence MIT, voir [LICENSE](LICENSE).
