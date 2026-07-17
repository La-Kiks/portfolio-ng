# Senior Review Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all findings from the senior code review of the Angular portfolio: 6 bugs, quick wins, tooling (ESLint + CI), and Angular modernization.

**Architecture:** Single branch `chore/senior-review-fixes` (already created, spec committed). Four commit themes in order: bugs → quick wins → tooling → modernization. Push to GitHub after each theme. The app is a static Angular 21 standalone-component SPA (`portfolio/`), data from `public/files/projects.json`, deployed via Docker/nginx.

**Tech Stack:** Angular 21 (standalone, signals), Tailwind CSS v4 (CSS-first `@theme`), Vitest via `@angular/build:unit-test`, Docker + nginx, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-07-17-senior-review-fixes-design.md`

## Global Constraints

- All npm/ng commands run from `portfolio/` (repo root has no package.json).
- Angular 21 standalone components only — no NgModules. New code uses `inject()`, `input()`/`output()`, signals, `ChangeDetectionStrategy.OnPush`.
- UI copy is French; document titles use "Kilian Audroin" em-dash pattern: `X — Kilian Audroin`.
- Prettier: 100-char width, single quotes, angular parser for HTML. 2-space indent.
- TypeScript strict mode + strictTemplates are on — never loosen compiler options.
- Only fonts kept: Lato Regular (400) + Bold (700) as WOFF2. Font family token stays `'Lato', -apple-system, ...`.
- Verification gate after every theme: `npm run build` AND `npm test` green before committing/pushing.
- Push after each theme: `git push origin chore/senior-review-fixes` (first push: `-u`).
- Commit messages end with: `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`

---

# THEME 1 — BUG FIXES

### Task 1: Fix font loading (Lato WOFF2)

The `@font-face` rules use `format('ttf')` which is invalid — browsers reject the source and never load Lato. Also: 25 MB of unused fonts (Inter, Raleway, Gilroy, extra Lato weights) ship with the app.

**Files:**
- Create: `portfolio/public/fonts/Lato/Lato-Regular.woff2`, `portfolio/public/fonts/Lato/Lato-Bold.woff2`
- Delete: `portfolio/public/fonts/Inter/`, `portfolio/public/fonts/Raleway/`, `portfolio/public/fonts/gilroy/`, all `portfolio/public/fonts/Lato/*.ttf`
- Modify: `portfolio/src/styles.scss`, `portfolio/src/index.html`

**Interfaces:**
- Produces: `/fonts/Lato/Lato-Regular.woff2` and `/fonts/Lato/Lato-Bold.woff2` URLs used by styles.scss and index.html preload.

- [ ] **Step 1: Convert Lato TTF → WOFF2**

From `portfolio/public/fonts/Lato/` (bash):

```bash
cd portfolio/public/fonts/Lato
npx --yes ttf2woff2 < Lato-Regular.ttf > Lato-Regular.woff2
npx --yes ttf2woff2 < Lato-Bold.ttf > Lato-Bold.woff2
ls -la *.woff2   # each should be roughly 20-40 KB, definitely > 0 bytes
```

Fallback if `ttf2woff2` fails to build on Windows (it compiles native code):

```bash
pip install fonttools brotli
fonttools ttLib.woff2 compress -o Lato-Regular.woff2 Lato-Regular.ttf
fonttools ttLib.woff2 compress -o Lato-Bold.woff2 Lato-Bold.ttf
```

- [ ] **Step 2: Delete unused fonts**

```bash
cd portfolio/public/fonts
rm -rf Inter Raleway gilroy
rm Lato/*.ttf          # keeps OFL.txt and the two new .woff2
ls -R .                # expect: only Lato/ containing OFL.txt, Lato-Regular.woff2, Lato-Bold.woff2
```

- [ ] **Step 3: Rewrite @font-face in styles.scss**

Replace the entire contents of `portfolio/src/styles.scss` with:

```scss
@use './theme.scss' as *;

body {
  font-family: var(--font-family-primary);
  background-color: var(--color-background);
  height: 100vh;
}

@font-face {
  font-family: 'Lato';
  src: url('/fonts/Lato/Lato-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Lato';
  src: url('/fonts/Lato/Lato-Bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
```

(This removes the invalid `format('ttf')`, removes the unused Inter rule, and adds proper weight mapping.)

- [ ] **Step 4: Add font preload in index.html**

In `portfolio/src/index.html`, directly BEFORE the `<!-- Preload Font Awesome CSS (non-blocking) -->` comment, add:

```html
  <!-- Preload primary font -->
  <link rel="preload" as="font" type="font/woff2" href="/fonts/Lato/Lato-Regular.woff2" crossorigin>
```

- [ ] **Step 5: Build and verify in browser**

```bash
cd portfolio
npm run build
```
Expected: build succeeds; `dist/portfolio/browser/fonts/Lato/` contains only OFL.txt + 2 woff2 files.

Start the dev server (`npm start`), open `http://localhost:4200`, DevTools → Network → filter "font": both `Lato-Regular.woff2` (and `Lato-Bold.woff2` where bold text renders) load with status 200. Rendered body text is Lato (check computed style on a paragraph).

- [ ] **Step 6: Commit**

```bash
git add -A portfolio/public/fonts portfolio/src/styles.scss portfolio/src/index.html
git commit -m "fix: correct @font-face format so Lato actually loads; drop 25MB unused fonts"
```

---

### Task 2: Fix sitemap and robots.txt

The sitemap file is named `stiemap.xml` (typo) so the URL robots.txt advertises 404s. Content is stale: lists a useless `/#work` fragment, missing `/about` and all project pages.

**Files:**
- Rename: `portfolio/public/stiemap.xml` → `portfolio/public/sitemap.xml`
- Modify: `portfolio/public/sitemap.xml`, `portfolio/public/robots.txt`

- [ ] **Step 1: Rename and rewrite the sitemap**

```bash
git mv portfolio/public/stiemap.xml portfolio/public/sitemap.xml
```

Replace the contents of `portfolio/public/sitemap.xml` with:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://kilian-au.fr/</loc>
    <lastmod>2026-07-17</lastmod>
  </url>
  <url>
    <loc>https://kilian-au.fr/about</loc>
    <lastmod>2026-07-17</lastmod>
  </url>
  <url>
    <loc>https://kilian-au.fr/projects/sport-event</loc>
    <lastmod>2026-07-17</lastmod>
  </url>
  <url>
    <loc>https://kilian-au.fr/projects/portfolio</loc>
    <lastmod>2026-07-17</lastmod>
  </url>
  <url>
    <loc>https://kilian-au.fr/projects/debug-optimisation</loc>
    <lastmod>2026-07-17</lastmod>
  </url>
  <url>
    <loc>https://kilian-au.fr/projects/antibug-solutions</loc>
    <lastmod>2026-07-17</lastmod>
  </url>
  <url>
    <loc>https://kilian-au.fr/projects/menu-maker</loc>
    <lastmod>2026-07-17</lastmod>
  </url>
</urlset>
```

(Slugs come from `portfolio/public/files/projects.json`. Maintenance rule: adding a project = adding a `<url>` entry here.)

- [ ] **Step 2: Clean robots.txt**

Replace the contents of `portfolio/public/robots.txt` with (the `/admin` and `/private` routes don't exist):

```
User-agent: *
Allow: /

Sitemap: https://kilian-au.fr/sitemap.xml
```

- [ ] **Step 3: Commit**

```bash
git add -A portfolio/public
git commit -m "fix: rename stiemap.xml to sitemap.xml, list all real routes"
```

---

### Task 3: Make the test suite compile and pass

`npm test` fails at compile: `project.spec.ts` injects the `Project` interface as if it were a service. `app.spec.ts` asserts scaffold content that no longer exists. Several specs lack Router/HttpClient providers.

**Files:**
- Modify: `portfolio/src/app/services/projects/project.spec.ts`
- Modify: `portfolio/src/app/app.spec.ts`
- Modify: `portfolio/src/app/pages/landing/landing.spec.ts`
- Modify: `portfolio/src/app/pages/projects/project-detail/project-detail.spec.ts`
- Modify: `portfolio/src/app/components/bentos/bento-carousel/bento-carousel.spec.ts`

**Interfaces:**
- Consumes: `ProjectService` from `./project` (class name is `ProjectService`, NOT `Project` — `Project` is the data interface).
- Produces: a green `npm test` baseline. Real coverage is added in Theme 4.

- [ ] **Step 1: Fix project.spec.ts**

Replace the contents of `portfolio/src/app/services/projects/project.spec.ts` with:

```typescript
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ProjectService } from './project';

describe('ProjectService', () => {
  let service: ProjectService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProjectService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
```

- [ ] **Step 2: Fix app.spec.ts**

Replace the contents of `portfolio/src/app/app.spec.ts` with (drops the stale "Hello, portfolio" h1 assertion; RouterOutlet needs router providers):

```typescript
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
```

- [ ] **Step 3: Add providers to landing.spec.ts**

In `portfolio/src/app/pages/landing/landing.spec.ts`, the component injects `Router` and renders `BentoCarousel` (which uses `HttpClient`). Make the `configureTestingModule` call look like:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Landing } from './landing';

describe('Landing', () => {
  let component: Landing;
  let fixture: ComponentFixture<Landing>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Landing],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Landing);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

- [ ] **Step 4: Add providers to project-detail.spec.ts**

Replace the contents of `portfolio/src/app/pages/projects/project-detail/project-detail.spec.ts` with:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ProjectDetail } from './project-detail';

describe('ProjectDetail', () => {
  let component: ProjectDetail;
  let fixture: ComponentFixture<ProjectDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectDetail],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { params: of({ slug: 'sport-event' }) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

- [ ] **Step 5: Add providers to bento-carousel.spec.ts**

Replace the contents of `portfolio/src/app/components/bentos/bento-carousel/bento-carousel.spec.ts` with:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { BentoCarousel } from './bento-carousel';

describe('BentoCarousel', () => {
  let component: BentoCarousel;
  let fixture: ComponentFixture<BentoCarousel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BentoCarousel],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(BentoCarousel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

- [ ] **Step 6: Run the suite; fix any remaining provider errors with the same pattern**

```bash
cd portfolio
npm test
```
Expected: ALL specs pass. If another spec fails with `NullInjectorError: No provider for Router/HttpClient`, add `provideRouter([])` and/or `provideHttpClient(), provideHttpClientTesting()` to its `providers` array exactly as in Steps 3–5.

- [ ] **Step 7: Commit**

```bash
git add portfolio/src
git commit -m "fix: repair test suite - inject ProjectService, drop stale scaffold assertions, add missing providers"
```

---

### Task 4: Fix Docker healthcheck and nginx JSON caching

`nginx:stable-alpine` has no `curl`, so the healthcheck always fails and the container reports unhealthy. And nginx caches `.json` for 30 days immutable — `projects.json` edits won't reach returning visitors for a month.

**Files:**
- Modify: `portfolio/Dockerfile:34-35`
- Modify: `portfolio/nginx.conf`

- [ ] **Step 1: Swap curl for wget in the healthcheck**

In `portfolio/Dockerfile`, replace:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1
```

with:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://localhost/ || exit 1
```

- [ ] **Step 2: Give JSON its own no-cache location in nginx**

Replace the contents of `portfolio/nginx.conf` with:

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Cache static files (hashed bundles, images, fonts)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|webp|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # JSON data (projects.json) must revalidate so content updates appear immediately
    location ~* \.json$ {
        add_header Cache-Control "no-cache";
    }

    # Route all requests to index.html for Angular routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Disable caching for index.html
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}
```

(Note: `json` is removed from the 30-day block; `webp` is added — the project images are .webp and previously missed the cache list.)

- [ ] **Step 3: Commit**

```bash
git add portfolio/Dockerfile portfolio/nginx.conf
git commit -m "fix: healthcheck uses wget (curl absent from alpine); stop 30-day caching of projects.json"
```

Docker-level verification happens once at the end (Task 20) to avoid rebuilding the image repeatedly.

---

### Task 5: Fix typos and README encoding

**Files:**
- Modify: `portfolio/src/app/pages/landing/landing.html:10,15` ("Web developper", "projets webs")
- Modify: `portfolio/src/app/components/bentos/bento-carousel/bento-carousel.html:5` (`loading-tzext`)
- Rewrite: `README.md` (repo root — UTF-16 → UTF-8 + content fixes)
- Rewrite: `portfolio-api/README.md` (UTF-16 → UTF-8)

- [ ] **Step 1: Fix landing texts**

In `portfolio/src/app/pages/landing/landing.html` there are TWO occurrences of each (the title-description bento and the separate title/description bentos). Replace in both places:
- `title="Web developper"` → `title="Web developer"`
- `J'accompagne les projets webs en tant que` → `J'accompagne les projets web en tant que`

- [ ] **Step 2: Fix carousel class typo**

In `portfolio/src/app/components/bentos/bento-carousel/bento-carousel.html` line 5: `loading-tzext` → `loading-text`.

- [ ] **Step 3: Rewrite root README.md as UTF-8**

The file is UTF-16 (GitHub renders it poorly). Use the Write tool (which writes UTF-8) to replace `README.md` with the same content plus fixes: "dekstop-first" → "desktop-first", and `http://localhost/UI_PORT` → `http://localhost:UI_PORT`. Full replacement content:

```markdown
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

3. **Construire l'image Docker manuellement**

```bash
   cd portfolio
   docker build -t portfolio:latest .
   docker run -p 80:80 portfolio:latest
```
```

- [ ] **Step 4: Rewrite portfolio-api/README.md as UTF-8**

Replace `portfolio-api/README.md` (also UTF-16) with:

```markdown
# portfolio-api

At the moment this project is not using an API.
This is a placeholder for a future API.
```

- [ ] **Step 5: Verify build+tests, commit, push Theme 1**

```bash
cd portfolio && npm run build && npm test
```
Expected: both green.

```bash
git add -A
git commit -m "fix: typos (developper, webs, tzext) and re-encode READMEs as UTF-8"
git push -u origin chore/senior-review-fixes
```

---

# THEME 2 — QUICK WINS

### Task 6: Clean index.html metadata and dead font token

**Files:**
- Modify: `portfolio/src/index.html:11,15`
- Modify: `portfolio/src/tailwind.css:10`

- [ ] **Step 1: Fix meta tags**

In `portfolio/src/index.html`:
- Line 15: `<meta name="author" content="Your Name">` → `<meta name="author" content="Kilian Audroin">`
- Delete line 11 (the SECOND `<meta name="viewport" ...>` — it duplicates line 8). Keep the one at line 8.

- [ ] **Step 2: Remove dead Fira Code token**

In `portfolio/src/tailwind.css`, delete the line:

```css
  --font-family-mono: 'Fira Code', monospace;
```

(Fira Code is not shipped and nothing uses the token.)

- [ ] **Step 3: Build, commit**

```bash
cd portfolio && npm run build
git add portfolio/src/index.html portfolio/src/tailwind.css
git commit -m "chore: real author meta, drop duplicate viewport and unused font token"
```

---

### Task 7: Per-route titles + dynamic project meta

**Files:**
- Modify: `portfolio/src/app/app.routes.ts`
- Modify: `portfolio/src/app/pages/projects/project-detail/project-detail.ts`

**Interfaces:**
- Produces: document title pattern `${project.title} — Kilian Audroin` and meta description = `project.description`, set when a project loads. Task 17's tests assert exactly this.

- [ ] **Step 1: Add route titles**

Replace the contents of `portfolio/src/app/app.routes.ts` with:

```typescript
import { Routes } from '@angular/router';
import { Landing } from './pages/landing/landing';
import { NotFound } from './pages/not-found/not-found';
import { ProjectDetail } from './pages/projects/project-detail/project-detail';
import { About } from './pages/about/about/about';

export const routes: Routes = [
  { path: '', component: Landing, title: 'Kilian Audroin — Web Developer' },
  { path: 'about', component: About, title: 'À propos — Kilian Audroin' },
  { path: 'projects/:slug', component: ProjectDetail, title: 'Projet — Kilian Audroin' },
  { path: '**', component: NotFound, title: '404 — Kilian Audroin' },
];
```

(The `About` import path still has the double `about/about/` — Task 13 flattens it.)

- [ ] **Step 2: Set title/meta from loaded project data**

In `portfolio/src/app/pages/projects/project-detail/project-detail.ts`:

Add to the imports at the top:

```typescript
import { Title, Meta } from '@angular/platform-browser';
import { Observable, switchMap, map, startWith, catchError, of, tap } from 'rxjs';
```

(`tap` is the only addition to the existing rxjs import line.)

Add the two services to the constructor parameters:

```typescript
  constructor(
    private route: ActivatedRoute,
    private projectService: ProjectService,
    private titleService: Title,
    private metaService: Meta
  ) {
```

Insert a `tap` between the existing `map` and `startWith` in the pipe:

```typescript
          map(project => ({
            project: project || null,
            isLoading: false,
            error: project ? null : 'Project not found'
          })),
          tap(state => {
            if (state.project) {
              this.titleService.setTitle(`${state.project.title} — Kilian Audroin`);
              this.metaService.updateTag({
                name: 'description',
                content: state.project.description,
              });
            }
          }),
          startWith({ project: null, isLoading: true, error: null }),
```

(Full modernization of this file — `inject()`, OnPush, signals — happens in Task 17. Keep constructor style for now.)

- [ ] **Step 3: Verify in browser, commit**

`npm start`, then check the browser tab title on: `/` ("Kilian Audroin — Web Developer"), `/about`, a project page (should switch to "Sport Event — Kilian Audroin" once loaded), and a bogus URL (404 title).

```bash
git add portfolio/src/app/app.routes.ts portfolio/src/app/pages/projects/project-detail/project-detail.ts
git commit -m "feat: per-route titles and dynamic project title/meta description"
```

---

### Task 8: Social links become real anchors

Buttons + `window.open` hide the links from crawlers and break middle-click/keyboard semantics.

**Files:**
- Modify: `portfolio/src/app/components/bentos/bento-social/bento-social.ts`
- Modify: `portfolio/src/app/components/bentos/bento-social/bento-social.html`

**Interfaces:**
- Produces: `SocialLink { label: string; icon: string; url: string }` (the `action?` callback is removed), `isExternal(link): boolean`. Task 14 modernizes this component but keeps these names.

- [ ] **Step 1: Rewrite bento-social.ts**

Replace the contents of `portfolio/src/app/components/bentos/bento-social/bento-social.ts` with:

```typescript
import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

export interface SocialLink {
  label: string;
  icon: string;
  url: string;
}

@Component({
  selector: 'app-bento-social',
  imports: [NgClass],
  templateUrl: './bento-social.html',
  styleUrl: './bento-social.scss',
})
export class BentoSocial {
  @Input() socialLinks: SocialLink[] = [
    {
      label: 'Contact',
      icon: 'fas fa-envelope',
      url: 'mailto:kilian.audroin@gmail.com',
    },
    {
      label: 'LinkedIn',
      icon: 'fab fa-linkedin',
      url: 'https://www.linkedin.com/in/kilian-audroin/',
    },
    {
      label: 'X',
      icon: 'fab fa-x-twitter',
      url: 'https://x.com/Kiki_coaching',
    },
    {
      label: 'GitHub',
      icon: 'fab fa-github',
      url: 'https://github.com/La-Kiks',
    },
  ];

  isExternal(link: SocialLink): boolean {
    return !link.url.startsWith('mailto:');
  }
}
```

- [ ] **Step 2: Rewrite bento-social.html with anchors**

Replace the contents of `portfolio/src/app/components/bentos/bento-social/bento-social.html` with (same classes as the old buttons, so styling is unchanged):

```html
<footer
    class="w-full h-full rounded-3xl bg-primary border border-secondary shadow-sm hover:shadow-md transition-shadow duration-300 p-4 md:p-6 flex items-center justify-center">
    <div class="flex gap-4 md:gap-6 lg:gap-8 flex-wrap justify-center w-full">
        @for (link of socialLinks; track link.label) {
        <a [href]="link.url" [attr.target]="isExternal(link) ? '_blank' : null"
            [attr.rel]="isExternal(link) ? 'noopener noreferrer' : null"
            class="social-button flex flex-col items-center gap-2 p-4 md:p-6 bg-secondary rounded-2xl text-text font-medium transition-all duration-300 hover:bg-text hover:text-primary hover:scale-110 focus:outline-none focus:ring-2 focus:ring-text focus:ring-offset-2 cursor-pointer"
            [attr.aria-label]="link.label">
            <i [ngClass]="link.icon" class="text-2xl md:text-3xl lg:text-4xl" aria-hidden="true"></i>
            <span class="social-label text-sm md:text-base lg:text-lg">{{ link.label }}</span>
        </a>
        }
    </div>
</footer>
```

- [ ] **Step 3: Verify in browser, commit**

`npm start` → landing page: the four tiles render identically; LinkedIn/X/GitHub open in a new tab; Contact opens the mail client; middle-click works.

```bash
git add portfolio/src/app/components/bentos/bento-social
git commit -m "feat: social links are real anchors with rel=noopener"
```

---

### Task 9: Remove dead code, logs, and full-reload links

**Files:**
- Modify: `portfolio/src/app/pages/landing/landing.ts` (console.log + unused handler)
- Modify: `portfolio/src/app/pages/landing/landing.html:1`
- Modify: `portfolio/src/app/pages/about/about/about.ts` (dead navItems/navigate)
- Modify: `portfolio/src/app/pages/about/about/about.html:9` (`<a href="/">` → routerLink)
- Modify: `portfolio/src/app/pages/projects/project-detail/project-detail.html:27` (same)
- Modify: `portfolio/src/app/pages/not-found/not-found.html:18` (same)
- Modify: `portfolio/src/app/pages/not-found/not-found.ts` (import RouterLink)

- [ ] **Step 1: Clean landing.ts**

Replace the contents of `portfolio/src/app/pages/landing/landing.ts` with (drops `onLoadingComplete` console.log and its method — nothing consumed the event):

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Loader } from '../../components/loader/loader';
import { BentoNavbar } from '../../components/bentos/bento-navbar/bento-navbar';
import { BentoCarousel, CarouselProject } from '../../components/bentos/bento-carousel/bento-carousel';
import { BentoTitleDescription } from '../../components/bentos/bento-title-description/bento-title-description';
import { BentoTitle } from '../../components/bentos/bento-title/bento-title';
import { BentoDescription } from '../../components/bentos/bento-description/bento-description';
import { BentoProfilePicture } from '../../components/bentos/bento-profile-picture/bento-profile-picture';
import { BentoSocial } from '../../components/bentos/bento-social/bento-social';

@Component({
  selector: 'app-landing',
  imports: [
    CommonModule,
    Loader,
    BentoNavbar,
    BentoCarousel,
    BentoTitleDescription,
    BentoTitle,
    BentoDescription,
    BentoProfilePicture,
    BentoSocial,
  ],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class Landing {
  navItems = [{ id: 1, label: 'À PROPOS', action: () => this.router.navigate(['/about']) }];

  constructor(private router: Router) {}

  projects: CarouselProject[] = [];
}
```

In `portfolio/src/app/pages/landing/landing.html` line 1, remove the event binding:

```html
<app-loader></app-loader>
```

- [ ] **Step 2: Clean about.ts**

Replace the contents of `portfolio/src/app/pages/about/about/about.ts` with (removes `navItems`/`navigate` — the template never referenced them):

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProjectLoader } from '../../../components/project-loader/project-loader';

@Component({
  selector: 'app-about',
  imports: [CommonModule, RouterLink, ProjectLoader],
  templateUrl: './about.html',
  styleUrl: './about.scss',
})
export class About {
  showProjectLoader: boolean = true;

  onProjectLoaderComplete(): void {
    this.showProjectLoader = false;
  }
}
```

- [ ] **Step 3: Convert full-reload home links to routerLink**

These `<a href="/">` links trigger a full app reload; `routerLink` keeps SPA navigation.

`portfolio/src/app/pages/about/about/about.html` line 9:

```html
<a routerLink="/" class="text-primary hover:underline w-fit">← Back to home</a>
```

`portfolio/src/app/pages/projects/project-detail/project-detail.html` line 27 (and add `RouterLink` to the `imports` array in `project-detail.ts`, importing it from `@angular/router`):

```html
<a routerLink="/" class="text-primary hover:underline mb-6 md:text-xl cursor-pointer inline-block">← Retour page
    d'accueil</a>
```

`portfolio/src/app/pages/not-found/not-found.html` line 18:

```html
<a routerLink="/"
```

And `portfolio/src/app/pages/not-found/not-found.ts` becomes:

```typescript
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  templateUrl: './not-found.html',
  styleUrl: './not-found.scss',
})
export class NotFound {}
```

- [ ] **Step 4: Verify build+tests, commit, push Theme 2**

```bash
cd portfolio && npm run build && npm test
```
Expected: green. Then browser-check: back-links on /about, a project page, and 404 page navigate without full reload.

```bash
git add -A portfolio/src
git commit -m "chore: remove console.logs and dead nav code; SPA routerLink for home links"
git push origin chore/senior-review-fixes
```

---

# THEME 3 — TOOLING

### Task 10: Add ESLint

**Files:**
- Create (via schematic): `portfolio/eslint.config.js`, `lint` target in `portfolio/angular.json`, devDependencies in `portfolio/package.json`
- Modify: whatever `npm run lint` flags

- [ ] **Step 1: Add angular-eslint**

```bash
cd portfolio
npx ng add angular-eslint --skip-confirmation
```

Expected: creates `eslint.config.js`, adds `lint` architect target and devDependencies (`angular-eslint`, `eslint`, `typescript-eslint`).

- [ ] **Step 2: Add npm script**

In `portfolio/package.json` `scripts`, add:

```json
    "lint": "ng lint",
```

- [ ] **Step 3: Run lint and fix all findings**

```bash
npm run lint
```

Known findings to expect and their fixes:
- `project-detail.ts`: `ngOnInit(): void { }` is empty → remove the method AND the `OnInit` import/`implements OnInit`.
- `bento-carousel.ts`: unused `err` parameter in the error handler → change `error: (err) => {` to `error: () => {`.
- Unused imports flagged by the Angular compiler as warnings (e.g. `CommonModule` in components whose templates use no CommonModule feature) → remove them from both the `imports:` array and the TS import line.

Re-run `npm run lint` until: `All files pass linting.`

- [ ] **Step 4: Verify build+tests, commit**

```bash
npm run build && npm test
```

```bash
git add -A
git commit -m "chore: add angular-eslint and fix all findings"
```

---

### Task 11: Add GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml` (repo root)

- [ ] **Step 1: Write the workflow**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: portfolio
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: portfolio/package-lock.json
      - run: npm ci
      - run: npm run lint
      - run: npm run build
      - run: npm test
```

- [ ] **Step 2: Commit and push Theme 3**

```bash
git add .github
git commit -m "ci: lint, build and test on push/PR to main"
git push origin chore/senior-review-fixes
```

- [ ] **Step 3: Verify the workflow runs**

The workflow triggers on PRs to main — open a draft PR from `chore/senior-review-fixes` to `main` now so CI runs on every subsequent push (`gh pr create --draft --title "Senior review fixes" --fill`), or verify at the end when the PR is opened. Check: `gh run list --limit 3` shows the run; `gh run watch` until green.

---

# THEME 4 — MODERNIZATION + TESTS

### Task 12: ProjectService — inject(), caching, real tests (TDD)

**Files:**
- Modify: `portfolio/src/app/services/projects/project.ts`
- Modify: `portfolio/src/app/services/projects/project.spec.ts`

**Interfaces:**
- Produces (consumed by carousel + project-detail): `ProjectService.getAllProjects(): Observable<Project[]>`, `ProjectService.getProjectBySlug(slug: string): Observable<Project | undefined>` — same signatures as today, but a single HTTP request per service instance (session). `Project` interface unchanged.

- [ ] **Step 1: Write failing tests**

Replace the contents of `portfolio/src/app/services/projects/project.spec.ts` with:

```typescript
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Project, ProjectService } from './project';

const PROJECTS: Project[] = [
  { id: '1', slug: 'sport-event', title: 'Sport Event', description: 'Desc 1', images: ['/img/1.webp'] },
  { id: '2', slug: 'menu-maker', title: 'Menu Maker', description: 'Desc 2', images: ['/img/2.webp'] },
];

describe('ProjectService', () => {
  let service: ProjectService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProjectService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('returns all projects', () => {
    let result: Project[] | undefined;
    service.getAllProjects().subscribe(p => (result = p));
    httpMock.expectOne('/files/projects.json').flush(PROJECTS);
    expect(result).toEqual(PROJECTS);
  });

  it('finds a project by slug', () => {
    let result: Project | undefined;
    service.getProjectBySlug('menu-maker').subscribe(p => (result = p));
    httpMock.expectOne('/files/projects.json').flush(PROJECTS);
    expect(result?.title).toBe('Menu Maker');
  });

  it('returns undefined for an unknown slug', () => {
    let result: Project | undefined = PROJECTS[0];
    service.getProjectBySlug('nope').subscribe(p => (result = p));
    httpMock.expectOne('/files/projects.json').flush(PROJECTS);
    expect(result).toBeUndefined();
  });

  it('caches: two consumers trigger a single HTTP request', () => {
    service.getAllProjects().subscribe();
    service.getProjectBySlug('sport-event').subscribe();
    const requests = httpMock.match('/files/projects.json');
    expect(requests.length).toBe(1);
    requests[0].flush(PROJECTS);
  });
});
```

- [ ] **Step 2: Run to verify the caching test fails**

```bash
cd portfolio && npm test
```
Expected: "caches: two consumers trigger a single HTTP request" FAILS (2 requests found); the httpMock.verify() in afterEach may also flag an unflushed second request. Others pass.

- [ ] **Step 3: Implement caching with shareReplay + inject()**

Replace the contents of `portfolio/src/app/services/projects/project.ts` with:

```typescript
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, shareReplay } from 'rxjs';

export interface Project {
  id: string;
  slug: string;
  title: string;
  description: string;
  longDescription?: string;
  context?: string;
  objectives?: string;
  stack?: string[];
  skills?: string[];
  results?: string;
  improvements?: string[];
  images: string[];
  link?: string;
  github?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private readonly http = inject(HttpClient);

  private readonly projects$: Observable<Project[]> = this.http
    .get<Project[]>('/files/projects.json')
    .pipe(shareReplay({ bufferSize: 1, refCount: false }));

  getAllProjects(): Observable<Project[]> {
    return this.projects$;
  }

  getProjectBySlug(slug: string): Observable<Project | undefined> {
    return this.projects$.pipe(map(projects => projects.find(p => p.slug === slug)));
  }
}
```

- [ ] **Step 4: Run tests to verify all pass**

```bash
npm test
```
Expected: all ProjectService tests PASS. (If the carousel/project-detail "should create" specs now complain about an unexpected open request, they won't — they don't call `httpMock.verify()`.)

- [ ] **Step 5: Commit**

```bash
git add portfolio/src/app/services
git commit -m "refactor: ProjectService caches projects.json with shareReplay; real tests"
```

---

### Task 13: Flatten the about folder

**Files:**
- Move: `portfolio/src/app/pages/about/about/*` → `portfolio/src/app/pages/about/`
- Modify: `portfolio/src/app/app.routes.ts` (import path), `portfolio/src/app/pages/about/about.ts` (relative import depth)

- [ ] **Step 1: Move files**

```bash
cd portfolio/src/app/pages/about
git mv about/about.ts about.ts
git mv about/about.html about.html
git mv about/about.scss about.scss
git mv about/about.spec.ts about.spec.ts
rmdir about
```

- [ ] **Step 2: Fix import paths**

In `portfolio/src/app/app.routes.ts`:

```typescript
import { About } from './pages/about/about';
```

In `portfolio/src/app/pages/about/about.ts`, the ProjectLoader import loses one level:

```typescript
import { ProjectLoader } from '../../components/project-loader/project-loader';
```

- [ ] **Step 3: Build, test, commit**

```bash
cd portfolio && npm run build && npm test
```

```bash
git add -A portfolio/src
git commit -m "refactor: flatten pages/about/about into pages/about"
```

---

### Task 14: Modernize presentational bento components

`input()` signals + OnPush + drop unneeded `CommonModule`. Templates change `{{ x }}` → `{{ x() }}`.

**Files:**
- Modify: `bento-navbar.ts/.html`, `bento-title.ts/.html`, `bento-description.ts/.html`, `bento-title-description.ts/.html`, `bento-profile-picture.ts/.html`, `bento-social.ts/.html` (all under `portfolio/src/app/components/bentos/`)

**Interfaces:**
- Produces: same selectors and input NAMES as today (`title`, `navItems`, `description`, `imageUrl`, `altText`, `socialLinks`) — parent templates' bindings keep working. `NavItem` is now exported from bento-navbar.

- [ ] **Step 1: bento-navbar**

`bento-navbar.ts`:

```typescript
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface NavItem {
  id: number;
  label: string;
  action?: () => void;
}

@Component({
  selector: 'app-bento-navbar',
  imports: [],
  templateUrl: './bento-navbar.html',
  styleUrl: './bento-navbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BentoNavbar {
  readonly title = input('My Portfolio');
  readonly navItems = input<NavItem[]>([]);
}
```

`bento-navbar.html` — change the two bindings to call signals (`{{ title() }}`, `navItems()`):

```html
<nav class="w-full rounded-3xl p-4 md:p-6 bg-primary border border-secondary">
    <div class="flex items-center justify-between">
        <h1 class="navbar-title text-text font-family-primary">
            {{ title() }}
        </h1>
        <div class="flex gap-3 md:gap-4 sm:gap-5 items-center">
            @for (item of navItems(); track item.id) {
            <button (click)="item.action?.()"
                class="navbar-button bg-text text-secondary rounded-xl  hover:scale-110 hover:text-text hover:bg-secondary transition-all duration-300 font-medium cursor-pointer">
                {{ item.label }}
            </button>
            }
        </div>
    </div>
</nav>
```

- [ ] **Step 2: bento-title**

`bento-title.ts`:

```typescript
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-bento-title',
  imports: [],
  templateUrl: './bento-title.html',
  styleUrl: './bento-title.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BentoTitle {
  readonly title = input('Title');
}
```

`bento-title.html` line 3: `{{ title }}` → `{{ title() }}`.

- [ ] **Step 3: bento-description**

`bento-description.ts`:

```typescript
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-bento-description',
  imports: [],
  templateUrl: './bento-description.html',
  styleUrl: './bento-description.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BentoDescription {
  readonly description = input('Description');
}
```

`bento-description.html` line 3: `{{ description }}` → `{{ description() }}`.

- [ ] **Step 4: bento-title-description**

`bento-title-description.ts`:

```typescript
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-bento-title-description',
  imports: [],
  templateUrl: './bento-title-description.html',
  styleUrl: './bento-title-description.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BentoTitleDescription {
  readonly title = input('Title');
  readonly description = input('Add your description here');
}
```

`bento-title-description.html`: `{{ title }}` → `{{ title() }}` and `{{ description }}` → `{{ description() }}`.

- [ ] **Step 5: bento-profile-picture (with NgOptimizedImage)**

`bento-profile-picture.ts`:

```typescript
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-bento-profile-picture',
  imports: [NgOptimizedImage],
  templateUrl: './bento-profile-picture.html',
  styleUrl: './bento-profile-picture.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BentoProfilePicture {
  readonly imageUrl = input('/images/profile.jpg');
  readonly altText = input('Profile picture');
}
```

`bento-profile-picture.html` (above the fold on landing → `priority`):

```html
<section
    class="w-full h-full rounded-3xl bg-primary border border-secondary shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
    <img [ngSrc]="imageUrl()" [alt]="altText()" width="300" height="400" priority class="w-full h-full object-cover" />
</section>
```

- [ ] **Step 6: bento-social**

`bento-social.ts` (Task 8 already made links anchors; now signals + OnPush):

```typescript
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgClass } from '@angular/common';

export interface SocialLink {
  label: string;
  icon: string;
  url: string;
}

@Component({
  selector: 'app-bento-social',
  imports: [NgClass],
  templateUrl: './bento-social.html',
  styleUrl: './bento-social.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BentoSocial {
  readonly socialLinks = input<SocialLink[]>([
    {
      label: 'Contact',
      icon: 'fas fa-envelope',
      url: 'mailto:kilian.audroin@gmail.com',
    },
    {
      label: 'LinkedIn',
      icon: 'fab fa-linkedin',
      url: 'https://www.linkedin.com/in/kilian-audroin/',
    },
    {
      label: 'X',
      icon: 'fab fa-x-twitter',
      url: 'https://x.com/Kiki_coaching',
    },
    {
      label: 'GitHub',
      icon: 'fab fa-github',
      url: 'https://github.com/La-Kiks',
    },
  ]);

  isExternal(link: SocialLink): boolean {
    return !link.url.startsWith('mailto:');
  }
}
```

`bento-social.html` line 4: `@for (link of socialLinks; ...)` → `@for (link of socialLinks(); ...)`.

- [ ] **Step 7: Build, test, browser-check, commit**

```bash
cd portfolio && npm run build && npm test
```
Expected: green (default-value inputs mean existing specs need no changes). Browser: landing renders identically; profile image still loads eagerly.

```bash
git add portfolio/src/app/components/bentos
git commit -m "refactor: signal inputs + OnPush for presentational bento components"
```

---

### Task 15: Loaders — signals, OnPush, tests

**Files:**
- Modify: `portfolio/src/app/components/loader/loader.ts/.html/.spec.ts`
- Modify: `portfolio/src/app/components/project-loader/project-loader.ts/.html`

**Interfaces:**
- Produces: `Loader.showLoader: Signal<boolean>`, `Loader.loadingComplete: OutputEmitterRef<void>`; `ProjectLoader.showLoader`, `ProjectLoader.loadingProgress: Signal<number>`, `ProjectLoader.loadingComplete`. Parent bindings `(loadingComplete)="..."` unchanged.

- [ ] **Step 1: Write failing Loader tests**

Replace the contents of `portfolio/src/app/components/loader/loader.spec.ts` with:

```typescript
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { Loader } from './loader';

describe('Loader', () => {
  beforeEach(async () => {
    sessionStorage.clear();
    vi.useFakeTimers();
    await TestBed.configureTestingModule({ imports: [Loader] }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the loader for 1s on first visit, then completes and stamps the time', () => {
    const fixture = TestBed.createComponent(Loader);
    const component = fixture.componentInstance;
    let completed = false;
    component.loadingComplete.subscribe(() => (completed = true));

    fixture.detectChanges(); // triggers ngOnInit
    expect(component.showLoader()).toBe(true);
    expect(completed).toBe(false);

    vi.advanceTimersByTime(1000);
    expect(component.showLoader()).toBe(false);
    expect(completed).toBe(true);
    expect(sessionStorage.getItem('loaderTimestamp')).not.toBeNull();
  });

  it('skips the loader when shown within the last 15 minutes', () => {
    sessionStorage.setItem('loaderTimestamp', Date.now().toString());
    const fixture = TestBed.createComponent(Loader);
    const component = fixture.componentInstance;
    let completed = false;
    component.loadingComplete.subscribe(() => (completed = true));

    fixture.detectChanges();
    expect(component.showLoader()).toBe(false);
    expect(completed).toBe(true);
  });

  it('shows the loader again when the last visit was over 15 minutes ago', () => {
    sessionStorage.setItem('loaderTimestamp', (Date.now() - 16 * 60 * 1000).toString());
    const fixture = TestBed.createComponent(Loader);
    const component = fixture.componentInstance;

    fixture.detectChanges();
    expect(component.showLoader()).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify failures**

```bash
cd portfolio && npm test
```
Expected: FAIL — `component.showLoader is not a function` (it's currently a plain boolean).

- [ ] **Step 3: Rewrite Loader with signals**

Replace the contents of `portfolio/src/app/components/loader/loader.ts` with:

```typescript
import { ChangeDetectionStrategy, Component, OnInit, output, signal } from '@angular/core';

const LOADER_TTL_MS = 15 * 60 * 1000;
const LOADER_DURATION_MS = 1000;

@Component({
  selector: 'app-loader',
  imports: [],
  templateUrl: './loader.html',
  styleUrl: './loader.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Loader implements OnInit {
  readonly loadingComplete = output<void>();
  readonly showLoader = signal(true);

  ngOnInit(): void {
    const lastShown = Number(sessionStorage.getItem('loaderTimestamp') ?? 0);
    const now = Date.now();

    if (now - lastShown < LOADER_TTL_MS) {
      this.showLoader.set(false);
      this.loadingComplete.emit();
      return;
    }

    setTimeout(() => {
      this.showLoader.set(false);
      this.loadingComplete.emit();
      sessionStorage.setItem('loaderTimestamp', now.toString());
    }, LOADER_DURATION_MS);
  }
}
```

Replace the contents of `portfolio/src/app/components/loader/loader.html` with:

```html
<div class="loader" [class.hidden]="!showLoader()">
    <div class="loader-content">
        <h1 class="loader-text">kilian-au</h1>
    </div>
</div>
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test
```
Expected: all 3 Loader tests PASS.

- [ ] **Step 5: Rewrite ProjectLoader with signals**

Replace the contents of `portfolio/src/app/components/project-loader/project-loader.ts` with:

```typescript
import { ChangeDetectionStrategy, Component, OnInit, output, signal } from '@angular/core';

const DURATION_MS = 800;
const TICK_MS = 20;

@Component({
  selector: 'app-project-loader',
  imports: [],
  templateUrl: './project-loader.html',
  styleUrl: './project-loader.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectLoader implements OnInit {
  readonly loadingComplete = output<void>();
  readonly showLoader = signal(true);
  readonly loadingProgress = signal(0);

  ngOnInit(): void {
    const step = 100 / (DURATION_MS / TICK_MS);

    const progressInterval = setInterval(() => {
      this.loadingProgress.update(progress => Math.min(progress + step, 100));

      if (this.loadingProgress() >= 100) {
        clearInterval(progressInterval);
        setTimeout(() => {
          this.showLoader.set(false);
          this.loadingComplete.emit();
        }, 100);
      }
    }, TICK_MS);
  }
}
```

Replace the contents of `portfolio/src/app/components/project-loader/project-loader.html` with:

```html
<div class="project-loader" [class.hidden]="!showLoader()">
    <div class="loader-content">
        <div class="loading-bar-container">
            <div class="loading-bar" [style.width.%]="loadingProgress()"></div>
        </div>
    </div>
</div>
```

- [ ] **Step 6: Build, test, commit**

```bash
npm run build && npm test
```

```bash
git add portfolio/src/app/components/loader portfolio/src/app/components/project-loader
git commit -m "refactor: loaders use signals and OnPush; test loader session logic"
```

---

### Task 16: Carousel — signals, NgOptimizedImage, visible error state, tests

Also removes: the `@Input() projects` (Landing only ever passed `[]` — dead), the `<link rel=preload>` head-tag leak, and the manual `cdr.markForCheck()` plumbing.

**Files:**
- Modify: `portfolio/src/app/components/bentos/bento-carousel/bento-carousel.ts/.html/.spec.ts`
- Modify: `portfolio/src/app/pages/landing/landing.ts` (drop `projects` field), `portfolio/src/app/pages/landing/landing.html` (drop `[projects]` binding)

**Interfaces:**
- Consumes: `ProjectService.getAllProjects()` from Task 12.
- Produces: `BentoCarousel` public API — `projects: Signal<CarouselProject[]>`, `currentIndex: Signal<number>`, `isLoading: Signal<boolean>`, `hasError: Signal<boolean>`, `currentProject: Signal<CarouselProject | undefined>`, methods `previousProject()`, `nextProject()`, `goToSlide(index)`, `goToProject()`. `CarouselProject` interface unchanged. Error copy: `Impossible de charger les projets`.

- [ ] **Step 1: Write failing tests**

Replace the contents of `portfolio/src/app/components/bentos/bento-carousel/bento-carousel.spec.ts` with:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { BentoCarousel } from './bento-carousel';

const PROJECTS = [
  { id: '1', slug: 'one', title: 'One', description: 'First', images: ['/img/1.webp'] },
  { id: '2', slug: 'two', title: 'Two', description: 'Second', images: ['/img/2.webp'] },
  { id: '3', slug: 'three', title: 'Three', description: 'Third', images: ['/img/3.webp'] },
];

describe('BentoCarousel', () => {
  let component: BentoCarousel;
  let fixture: ComponentFixture<BentoCarousel>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BentoCarousel],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(BentoCarousel);
    component = fixture.componentInstance;
    fixture.detectChanges(); // ngOnInit -> load
  });

  function flushProjects(): void {
    httpMock.expectOne('/files/projects.json').flush(PROJECTS);
    fixture.detectChanges();
  }

  it('should create', () => {
    flushProjects();
    expect(component).toBeTruthy();
  });

  it('maps loaded projects and starts at slide 0', () => {
    flushProjects();
    expect(component.projects().length).toBe(3);
    expect(component.currentIndex()).toBe(0);
    expect(component.currentProject()?.route).toBe('/projects/one');
  });

  it('next wraps forward past the last slide', () => {
    flushProjects();
    component.nextProject();
    component.nextProject();
    component.nextProject();
    expect(component.currentIndex()).toBe(0);
  });

  it('previous wraps back from the first slide', () => {
    flushProjects();
    component.previousProject();
    expect(component.currentIndex()).toBe(2);
  });

  it('goToSlide jumps to the given slide', () => {
    flushProjects();
    component.goToSlide(1);
    expect(component.currentProject()?.title).toBe('Two');
  });

  it('shows a visible error message when loading fails', () => {
    httpMock.expectOne('/files/projects.json').error(new ProgressEvent('error'));
    fixture.detectChanges();
    expect(component.hasError()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Impossible de charger les projets');
  });
});
```

- [ ] **Step 2: Run to verify failures**

```bash
cd portfolio && npm test
```
Expected: FAIL — `component.projects is not a function` / `hasError` undefined.

- [ ] **Step 3: Rewrite the component**

Replace the contents of `portfolio/src/app/components/bentos/bento-carousel/bento-carousel.ts` with:

```typescript
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { Router } from '@angular/router';
import { Project, ProjectService } from '../../../services/projects/project';

export interface CarouselProject {
  id: string;
  title: string;
  description: string;
  image: string;
  route: string;
}

@Component({
  selector: 'app-bento-carousel',
  imports: [NgOptimizedImage],
  templateUrl: './bento-carousel.html',
  styleUrl: './bento-carousel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BentoCarousel implements OnInit {
  private readonly router = inject(Router);
  private readonly projectService = inject(ProjectService);

  readonly projects = signal<CarouselProject[]>([]);
  readonly currentIndex = signal(0);
  readonly isLoading = signal(true);
  readonly hasError = signal(false);

  readonly currentProject = computed<CarouselProject | undefined>(
    () => this.projects()[this.currentIndex()],
  );

  ngOnInit(): void {
    this.projectService.getAllProjects().subscribe({
      next: (projects: Project[]) => {
        this.projects.set(
          projects.map(project => ({
            id: project.id,
            title: project.title,
            description: project.description,
            image: project.images[0],
            route: `/projects/${project.slug}`,
          })),
        );
        this.isLoading.set(false);
        this.warmUpImages();
      },
      error: () => {
        this.isLoading.set(false);
        this.hasError.set(true);
      },
    });
  }

  // Browser pre-fetches the non-visible slides at low priority so swapping feels instant.
  private warmUpImages(): void {
    this.projects()
      .slice(1)
      .forEach(project => {
        const img = new Image();
        img.fetchPriority = 'low';
        img.src = project.image;
      });
  }

  previousProject(): void {
    const count = this.projects().length;
    if (count === 0) return;
    this.currentIndex.update(index => (index - 1 + count) % count);
  }

  nextProject(): void {
    const count = this.projects().length;
    if (count === 0) return;
    this.currentIndex.update(index => (index + 1) % count);
  }

  goToProject(): void {
    const project = this.currentProject();
    if (project) {
      this.router.navigate([project.route]);
    }
  }

  goToSlide(index: number): void {
    this.currentIndex.set(index);
  }
}
```

- [ ] **Step 4: Rewrite the template**

Replace the contents of `portfolio/src/app/components/bentos/bento-carousel/bento-carousel.html` with:

```html
<!-- Loading State -->
@if (isLoading()) {
<main
    class="carousel-wrapper w-full h-full rounded-3xl bg-primary border border-secondary shadow-sm flex items-center justify-center">
    <p class="loading-text text-text text-lg">Chargement...</p>
</main>
} @else if (hasError()) {
<!-- Error State -->
<main
    class="carousel-wrapper w-full h-full rounded-3xl bg-primary border border-secondary shadow-sm flex items-center justify-center">
    <p class="text-text text-lg">Impossible de charger les projets</p>
</main>
} @else if (currentProject(); as project) {
<!-- Carousel Content -->
<main
    class="carousel-wrapper w-full h-full min-h-90 rounded-3xl bg-primary border border-secondary shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col overflow-hidden">
    <!-- Projects-->
    <h2 class="w-full p-2 my-2 ml-4 text-2xl text-center font-bold">Projets</h2>

    <!-- Image Container -->
    <div class="flex-1 w-full p-2 relative cursor-pointer overflow-hidden group bg-background" (click)="goToProject()"
        role="button" tabindex="0" (keyup.enter)="goToProject()">
        <img [ngSrc]="project.image" width="720" height="720" [alt]="project.title"
            [priority]="currentIndex() === 0"
            class="w-full h-full object-cover rounded-t-2xl transition-transform duration-300 group-hover:scale-105" />
        <!-- Overlay on hover -->
        <div
            class="absolute inset-0 bg-transparent hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
            <span
                class="text-primary bg-background px-4 py-2 rounded-xl font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Cliquer pour voir le projet
            </span>
        </div>
    </div>

    <!-- Title Section -->
    <div class="p-4 bg-primary border-t border-secondary">
        <h3 class="text-lg font-semibold text-text m-0">{{ project.title }}</h3>
        <p class="text-text">{{ project.description }}</p>
    </div>

    <!-- Navigation Arrows -->
    <button (click)="previousProject()" class="carousel-arrow carousel-arrow-left" aria-label="Previous project">
        <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
    </button>

    <button (click)="nextProject()" class="carousel-arrow carousel-arrow-right" aria-label="Next project">
        <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
    </button>

    <!-- Slide Indicators -->
    <div class="absolute top-18 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        @for (item of projects(); track item.id; let i = $index) {
        <button (click)="goToSlide(i)" [class.active]="i === currentIndex()" class="carousel-indicator"
            [attr.aria-label]="'Go to project ' + (i + 1)"></button>
        }
    </div>
</main>
}
```

- [ ] **Step 5: Drop the dead projects input from Landing**

In `portfolio/src/app/pages/landing/landing.ts`: delete the line `projects: CarouselProject[] = [];` and remove `CarouselProject` from the import (keep `BentoCarousel`):

```typescript
import { BentoCarousel } from '../../components/bentos/bento-carousel/bento-carousel';
```

In `portfolio/src/app/pages/landing/landing.html` line 19:

```html
        <app-bento-carousel class="grid-carousel"></app-bento-carousel>
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
npm test
```
Expected: all BentoCarousel tests PASS.

- [ ] **Step 7: Build, browser-check, commit**

```bash
npm run build
```
Browser: carousel loads, arrows/indicators/click-through work, first image loads with high priority (Network tab), no `<link rel="preload">` tags accumulate in `<head>` when navigating away and back to `/`.

```bash
git add portfolio/src/app/components/bentos/bento-carousel portfolio/src/app/pages/landing
git commit -m "refactor: carousel on signals with NgOptimizedImage, visible error state; drop dead projects input"
```

---

### Task 17: ProjectDetail — inject(), OnPush, signals, tests

**Files:**
- Modify: `portfolio/src/app/pages/projects/project-detail/project-detail.ts/.html/.spec.ts`

**Interfaces:**
- Consumes: `ProjectService.getProjectBySlug(slug)` (Task 12); title/meta pattern from Task 7.
- Produces: `projectState$: Observable<ProjectState>` (unchanged shape `{ project, isLoading, error }`), `showProjectLoader: Signal<boolean>`.

- [ ] **Step 1: Write failing tests**

Replace the contents of `portfolio/src/app/pages/projects/project-detail/project-detail.spec.ts` with:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { of } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProjectDetail } from './project-detail';

const PROJECTS = [
  { id: '1', slug: 'sport-event', title: 'Sport Event', description: 'Une plateforme sportive', images: ['/a.webp', '/b.webp'] },
];

describe('ProjectDetail', () => {
  let fixture: ComponentFixture<ProjectDetail>;
  let httpMock: HttpTestingController;

  function setup(slug: string): void {
    TestBed.configureTestingModule({
      imports: [ProjectDetail],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { params: of({ slug }) } },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ProjectDetail);
    fixture.detectChanges();
  }

  it('renders the project and sets title and meta description', () => {
    setup('sport-event');
    httpMock.expectOne('/files/projects.json').flush(PROJECTS);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Sport Event');
    expect(TestBed.inject(Title).getTitle()).toBe('Sport Event — Kilian Audroin');
    const description = document.querySelector('meta[name="description"]');
    expect(description?.getAttribute('content')).toBe('Une plateforme sportive');
  });

  it('shows the not-found error for an unknown slug', () => {
    setup('does-not-exist');
    httpMock.expectOne('/files/projects.json').flush(PROJECTS);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Project not found');
  });

  it('shows the error state when the request fails', () => {
    setup('sport-event');
    httpMock.expectOne('/files/projects.json').error(new ProgressEvent('error'));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Error loading project');
  });
});
```

- [ ] **Step 2: Run to verify failures**

```bash
cd portfolio && npm test
```
Expected: the title/meta test may already pass (Task 7 added that); the rewrite in Step 3 must keep everything green. Note any failures here (e.g. `showProjectLoader` template overlay hiding content is fine — the text is still in `textContent`).

- [ ] **Step 3: Rewrite the component**

Replace the contents of `portfolio/src/app/pages/projects/project-detail/project-detail.ts` with:

```typescript
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { catchError, map, Observable, of, startWith, switchMap, tap } from 'rxjs';
import { Project, ProjectService } from '../../../services/projects/project';
import { ProjectLoader } from '../../../components/project-loader/project-loader';

interface ProjectState {
  project: Project | null;
  isLoading: boolean;
  error: string | null;
}

@Component({
  selector: 'app-project-detail',
  imports: [AsyncPipe, RouterLink, ProjectLoader],
  templateUrl: './project-detail.html',
  styleUrl: './project-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly projectService = inject(ProjectService);
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);

  readonly showProjectLoader = signal(true);

  readonly projectState$: Observable<ProjectState> = this.route.params.pipe(
    switchMap(params =>
      this.projectService.getProjectBySlug(params['slug']).pipe(
        map(project => ({
          project: project ?? null,
          isLoading: false,
          error: project ? null : 'Project not found',
        })),
        tap(state => {
          if (state.project) {
            this.titleService.setTitle(`${state.project.title} — Kilian Audroin`);
            this.metaService.updateTag({
              name: 'description',
              content: state.project.description,
            });
          }
        }),
        startWith({ project: null, isLoading: true, error: null }),
        catchError(() =>
          of({ project: null, isLoading: false, error: 'Error loading project' }),
        ),
      ),
    ),
  );

  onProjectLoaderComplete(): void {
    this.showProjectLoader.set(false);
  }
}
```

- [ ] **Step 4: Update the template**

In `portfolio/src/app/pages/projects/project-detail/project-detail.html`:

Line 1: `@if (showProjectLoader) {` → `@if (showProjectLoader()) {`

Lines 6 and 144: replace the `*ngIf`/`ng-container` wrapper with `@if` control flow:

```html
    @if (projectState$ | async; as state) {
```
…and the matching closing line 144 `</ng-container>` becomes `}`.

(The rest of the template already uses `@if`/`@for` and needs no changes. The `routerLink` back-link was done in Task 9.)

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm test
```
Expected: all 3 ProjectDetail tests PASS.

- [ ] **Step 6: Build, commit**

```bash
npm run build
```

```bash
git add portfolio/src/app/pages/projects
git commit -m "refactor: ProjectDetail on inject/OnPush with state tests"
```

---

### Task 18: Modernize remaining pages and app shell

**Files:**
- Modify: `portfolio/src/app/pages/landing/landing.ts`
- Modify: `portfolio/src/app/pages/about/about.ts` (+ `.html` for the signal call)
- Modify: `portfolio/src/app/pages/not-found/not-found.ts`
- Modify: `portfolio/src/app/app.ts`

- [ ] **Step 1: Landing — inject(), OnPush, typed NavItem, drop CommonModule**

Replace the contents of `portfolio/src/app/pages/landing/landing.ts` with:

```typescript
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Loader } from '../../components/loader/loader';
import { BentoNavbar, NavItem } from '../../components/bentos/bento-navbar/bento-navbar';
import { BentoCarousel } from '../../components/bentos/bento-carousel/bento-carousel';
import { BentoTitleDescription } from '../../components/bentos/bento-title-description/bento-title-description';
import { BentoTitle } from '../../components/bentos/bento-title/bento-title';
import { BentoDescription } from '../../components/bentos/bento-description/bento-description';
import { BentoProfilePicture } from '../../components/bentos/bento-profile-picture/bento-profile-picture';
import { BentoSocial } from '../../components/bentos/bento-social/bento-social';

@Component({
  selector: 'app-landing',
  imports: [
    Loader,
    BentoNavbar,
    BentoCarousel,
    BentoTitleDescription,
    BentoTitle,
    BentoDescription,
    BentoProfilePicture,
    BentoSocial,
  ],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Landing {
  private readonly router = inject(Router);

  readonly navItems: NavItem[] = [
    { id: 1, label: 'À PROPOS', action: () => this.router.navigate(['/about']) },
  ];
}
```

- [ ] **Step 2: About — signal + OnPush, drop CommonModule**

Replace the contents of `portfolio/src/app/pages/about/about.ts` with:

```typescript
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProjectLoader } from '../../components/project-loader/project-loader';

@Component({
  selector: 'app-about',
  imports: [RouterLink, ProjectLoader],
  templateUrl: './about.html',
  styleUrl: './about.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class About {
  readonly showProjectLoader = signal(true);

  onProjectLoaderComplete(): void {
    this.showProjectLoader.set(false);
  }
}
```

In `portfolio/src/app/pages/about/about.html` line 1: `@if (showProjectLoader) {` → `@if (showProjectLoader()) {`

- [ ] **Step 3: NotFound and App — OnPush**

`portfolio/src/app/pages/not-found/not-found.ts`:

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  templateUrl: './not-found.html',
  styleUrl: './not-found.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFound {}
```

`portfolio/src/app/app.ts` (drops the unused `title` signal):

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
```

- [ ] **Step 4: Build, test, lint, commit**

```bash
cd portfolio && npm run build && npm test && npm run lint
```
Expected: all green.

```bash
git add portfolio/src
git commit -m "refactor: pages and app shell on inject/signals/OnPush"
```

---

### Task 19: Dependency and Dockerfile cleanup

**Files:**
- Modify: `portfolio/package.json`
- Modify: `portfolio/Dockerfile`

- [ ] **Step 1: Deduplicate tailwindcss**

In `portfolio/package.json`: delete `"tailwindcss": "^4.2.2"` from `dependencies`, and set the `devDependencies` entry to `"tailwindcss": "^4.2.2"` (it currently reads `^4.1.12`). Then:

```bash
cd portfolio && npm install
```
Expected: lockfile updates; `npm ls tailwindcss` shows a single version.

- [ ] **Step 2: Drop the global CLI from the Dockerfile**

In `portfolio/Dockerfile`, delete these lines:

```dockerfile
# Install Angular CLI
RUN npm install -g @angular/cli
```

and change the build line from `RUN ng build --configuration=production` to:

```dockerfile
RUN npm run build
```

(`npm ci` installs the local `@angular/cli`; the build script resolves it — the global install only added image build time.)

- [ ] **Step 3: Build, test, commit**

```bash
npm run build && npm test
```

```bash
git add portfolio/package.json portfolio/package-lock.json portfolio/Dockerfile
git commit -m "chore: dedupe tailwindcss, drop global CLI from Docker build"
```

---

### Task 20: Update CLAUDE.md, final verification, push

**Files:**
- Modify: `CLAUDE.md` (repo root)

- [ ] **Step 1: Update CLAUDE.md**

Apply these content updates (keep everything else):

1. In **Commands**, add to the npm block: `npm run lint          # ng lint (angular-eslint)`
2. Route map line: `/about` → `About` now lives at `pages/about/` (not `about/about/`).
3. In the **Data source** section, add: "`ProjectService` caches the JSON with `shareReplay` — one fetch per session."
4. Replace the fonts sentence with: "The only self-hosted font is Lato (Regular + Bold, WOFF2) under `public/fonts/Lato/`. Font Awesome is loaded from a CDN with preload hints in `src/index.html`."
5. In **Architecture**, note: "Components use signals (`input()`, `output()`, `signal`/`computed`) with `OnPush` change detection throughout."
6. In the SEO section, replace "There's no dynamic meta-tag service..." with: "Route titles are set via `title:` in `app.routes.ts`; `ProjectDetail` sets per-project title/meta description via the `Title`/`Meta` services. `public/sitemap.xml` is hand-maintained — adding a project requires adding its URL there."
7. Add a **CI** line: "GitHub Actions (`.github/workflows/ci.yml`) runs lint + build + test on push/PR to main."

- [ ] **Step 2: Full local verification**

```bash
cd portfolio && npm run lint && npm run build && npm test
```
Expected: all three green.

Browser sweep (`npm start`): landing (fonts, carousel, socials), /about, a project page (title/meta), 404 page, keyboard navigation on the carousel.

- [ ] **Step 3: Docker verification**

Requires Docker Desktop running:

```bash
cd <repo root>
docker-compose up --build -d
docker inspect --format='{{.State.Health.Status}}' kilian-au-front   # after ~40s: healthy
curl -s -D - -o /dev/null http://localhost:4200/files/projects.json | grep -i cache-control   # expect: no-cache (port = UI_PORT from .env)
docker-compose down
```

If Docker Desktop isn't available, note it and ask the user to run this check.

- [ ] **Step 4: Commit and push**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for review fixes"
git push origin chore/senior-review-fixes
```

- [ ] **Step 5: Finish the branch**

Use the **superpowers:finishing-a-development-branch** skill: verify CI is green on GitHub (`gh run list`), then present merge options (merge to main / PR review) to the user.
