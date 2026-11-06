# Portfolio

Un site de portfolio moderne et entièrement responsive mettant en avant mes projets et compétences en tant que développeur full-stack.

**Démonstration en direct :** [kilian-au.fr](https://kilian-au.fr)

## 🎨 Fonctionnalités

- **Design Bento Moderne** - Mise en page épurée basée sur une grille modulaire
- **Vitrine de Projets Dynamique** - Projets chargés depuis JSON avec pages de projets détaillées
- **Design Responsive** - Approche desktop-first avec Tailwind CSS
- **Performance Optimisée** - Chargement rapide avec lazy loading et optimisation des images
- **Optimisé pour le SEO** - Données structurées, balises meta et sitemap inclus
- **Animations Fluides** - Transitions de pages et éléments interactifs avec animations fluides

## 🚀 Stack Technologique

### Frontend

- **Angular 21** - Framework web moderne
- **TypeScript** - JavaScript type-safe
- **Tailwind CSS** - Framework CSS utilitaire
- **Font Awesome** - Bibliothèque d'icônes

### Déploiement

- **Docker & Docker Compose** - Containerisation
- **Nginx** - Serveur web
- **Caddy** (optionnel) - Reverse proxy et SSL

### Docker

1. **Créer le fichier .env à la root**

```bash
   UI_PORT=4000
```

2. **Construire et exécuter avec Docker Compose** _(A besoin de Docker Desktop sur Windows)_

```bash
   docker-compose up
```

L'application sera disponible à `http://localhost:UI_PORT`

> L'image de production sert l'application sous `/portfolio/` et a besoin de Caddy devant elle (voir `deploy/README.md`). Le conteneur seul n'est donc pas navigable à `/`. `npm start` sert l'application à `/`.

3. **Construire l'image Docker manuellement**

```bash
   cd portfolio
   docker build -t portfolio:latest .
   docker run -p 80:80 portfolio:latest
```
