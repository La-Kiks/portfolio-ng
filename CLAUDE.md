# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This repo contains two sibling projects, but only one is currently active:

- `portfolio/` — the Angular frontend. **All active development happens here.** All commands below assume this directory as the working directory.
- `portfolio-api/` — placeholder for a future .NET backend. It contains only a README; there is no code to build or run yet. Don't add speculative backend code here unless asked.

There is no root-level package.json — always `cd portfolio` before running npm scripts.

## Commands

Run from `portfolio/`:

```bash
npm start              # ng serve — dev server
npm run build          # ng build (production config by default)
npm run watch           # ng build --watch --configuration development
npm test               # ng test — runs Vitest via @angular/build:unit-test
npm run lint           # ng lint (angular-eslint)
```

To run a single spec file, pass a filter to the underlying test runner, e.g.:

```bash
npx vitest run src/app/components/bentos/bento-carousel/bento-carousel.spec.ts
```

### Docker (from repo root)

```bash
docker-compose up          # requires a root .env with UI_PORT set (see .env.sample)
```

This builds `portfolio/Dockerfile` (multi-stage: `npm ci` + `npm run build`, then served by nginx using `portfolio/nginx.conf`) and serves on `UI_PORT`.

### CI

GitHub Actions (`.github/workflows/ci.yml`) runs lint + build + test on push/PR to main.

## Architecture

### Angular 21, standalone components only

There are no NgModules — every component declares its own `imports: [...]` array. Routing (`src/app/app.routes.ts`) maps directly to standalone page components:

- `/` → `Landing`
- `/about` → `About` (lives at `pages/about/`)
- `/projects/:slug` → `ProjectDetail`
- `**` → `NotFound`

Components use signals (`input()`, `output()`, `signal`/`computed`) with `OnPush` change detection throughout.

### Data source: static JSON, no real backend

`ProjectService` (`src/app/services/projects/project.ts`) fetches project data via `HttpClient` from `/files/projects.json`, a static file served from `public/files/projects.json`. There is no API server behind this — `portfolio-api/` is unimplemented. When adding/editing project content, edit that JSON file directly; the `Project` interface in the same file is the schema. `ProjectService` caches the JSON with `shareReplay` — one fetch per session.

### Component structure

- `src/app/components/bentos/*` — the bento-grid building blocks used to compose pages (`bento-navbar`, `bento-carousel`, `bento-title`, `bento-description`, `bento-title-description`, `bento-profile-picture`, `bento-social`). Pages assemble these rather than owning bento markup directly.
- `src/app/components/loader` and `src/app/components/project-loader` — page-load/progress UI, driven by signals under `OnPush` (see `project-loader.ts` for the timed-progress pattern; `loader.ts` skips the animation via a 15-minute `sessionStorage` stamp).
- `src/app/pages/*` — route-level components (`landing`, `about`, `projects/project-detail`, `not-found`).

Each component follows the same 4-file layout: `.ts`, `.html`, `.scss`, `.spec.ts`.

### Styling: Tailwind CSS v4 via CSS-first theming

No `tailwind.config.js` — theming is done through Tailwind v4's CSS-based `@theme` directive in `src/tailwind.css`, which defines the color/font design tokens as CSS custom properties (`--color-primary`, `--color-background`, `--font-family-primary`, etc.). Dark mode overrides these same custom properties under `[data-theme='dark']` in `src/theme.scss`. When touching colors or fonts, edit the tokens in these two files rather than hardcoding values in component styles.

The only self-hosted font is Lato (Regular + Bold, WOFF2) under `public/fonts/Lato/`. Font Awesome is loaded from a CDN with preload hints in `src/index.html`.

### SEO / meta tags are hand-authored in index.html

`src/index.html` contains manually maintained meta tags, Twitter/OG cards, and a JSON-LD `Person` schema block. Route titles are set via `title:` in `app.routes.ts`; `ProjectDetail` sets per-project title/meta description via the `Title`/`Meta` services. `public/sitemap.xml` is hand-maintained — adding a project requires adding its URL there.

### Deployment

`portfolio/Dockerfile` builds with the Angular CLI and serves the output through nginx (`portfolio/nginx.conf`), which falls back all unmatched routes to `index.html` for Angular client-side routing and disables caching on `index.html` itself while caching static assets for 30 days.

## Conventions

- TypeScript `strict` mode plus `strictTemplates`, `strictInjectionParameters`, `strictInputAccessModifiers` are all on (`tsconfig.json`) — respect these rather than loosening types to work around errors.
- Prettier: 100-char print width, single quotes, `angular` parser for `.html` files (`.prettierrc`).
- 2-space indentation, single quotes in `.ts` files (`.editorconfig`).
