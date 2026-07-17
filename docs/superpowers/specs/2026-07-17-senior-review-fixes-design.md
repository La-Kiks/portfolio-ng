# Senior Review Fixes — Design

**Date:** 2026-07-17
**Scope:** Fix all findings from the senior code review of the `portfolio/` Angular app: 6 bugs, quick wins, architecture/code quality, and Angular modernization.
**Branch strategy:** Single branch `chore/senior-review-fixes`, commits grouped in 4 themes (bugs → quick wins → tooling → modernization), merged to `main` once CI is green.

## Decisions made during brainstorming

| Question | Decision |
|---|---|
| Scope | Everything (bugs + quick wins + architecture + modernization) |
| Fonts | Lato only (Regular + Bold), converted to WOFF2; delete Inter, Raleway, Gilroy |
| Sitemap | Static, hand-maintained `sitemap.xml` |
| Tooling | angular-eslint + GitHub Actions CI (lint, build, test) |
| Tests | Fix compile errors and add meaningful coverage against final APIs |
| SEO depth | Static route titles + dynamic title/meta on project detail pages |
| Workflow | Option A: one branch, themed commit sequence |

## Theme 1 — Bug fixes

### 1.1 Fonts never load (`format('ttf')` is invalid)

- Convert `Lato-Regular.ttf` and `Lato-Bold.ttf` to WOFF2 (one-off local conversion). Keep `OFL.txt`.
- Delete `public/fonts/Inter/`, `public/fonts/Raleway/`, `public/fonts/gilroy/`, and all unused Lato weights (~25 MB → ~50 KB).
- Rewrite `@font-face` in `src/styles.scss`: `format('woff2')`, explicit `font-weight: 400` and `700` rules, `font-display: swap`. Remove the unused Inter rule.
- Add `<link rel="preload" as="font" type="font/woff2" crossorigin>` for Lato Regular in `src/index.html`.
- **Verify:** DevTools Network shows the `.woff2` files loading; rendered text uses Lato.

### 1.2 Sitemap unreachable and stale

- Rename `public/stiemap.xml` → `public/sitemap.xml` (robots.txt already points to `sitemap.xml`).
- Content: `/`, `/about`, and the five project pages (`/projects/sport-event`, `/projects/portfolio`, `/projects/debug-optimisation`, `/projects/antibug-solutions`, `/projects/menu-maker`). Remove the `/#work` fragment entry.
- Remove `Disallow: /admin` and `Disallow: /private` from `robots.txt` (routes don't exist).
- Maintenance note: adding a project requires manually adding its URL to `sitemap.xml`.

### 1.3 Test suite doesn't compile

- `src/app/services/projects/project.spec.ts`: inject `ProjectService` (not the `Project` interface), with HTTP testing providers.
- `src/app/app.spec.ts`: drop the stale scaffold assertion expecting `<h1>Hello, portfolio</h1>`; keep the creation test.
- Give any other scaffold spec the providers it needs (`provideRouter([])`, `provideHttpClient()` + testing) so `npm test` is fully green.
- Real coverage is added in Theme 4, after refactoring, so tests are written once against final APIs.

### 1.4 Docker healthcheck always fails

- `portfolio/Dockerfile`: replace `curl -f http://localhost/` with `wget -q --spider http://localhost/` (busybox wget ships with `nginx:stable-alpine`; curl does not).

### 1.5 `projects.json` cached 30 days

- `portfolio/nginx.conf`: remove `json` from the 30-day immutable cache block; add a dedicated `location ~* \.json$` with `Cache-Control: no-cache` so content revalidates via ETag and edits appear immediately.

### 1.6 Typos

- Landing texts: "Web developper" → "Web developer"; "les projets webs" → "les projets web".
- `bento-carousel.html`: `loading-tzext` class → `loading-text`.
- Root `README.md`: `http://localhost/UI_PORT` → `http://localhost:UI_PORT`, "dekstop-first" → "desktop-first"; re-encode as UTF-8 (currently UTF-16, which GitHub renders poorly). Same UTF-8 re-encode for `portfolio-api/README.md`.

## Theme 2 — Quick wins

### 2.1 index.html metadata

- `<meta name="author">`: "Your Name" → "Kilian Audroin".
- Remove the duplicate viewport meta tag.
- Remove the unused `--font-family-mono: 'Fira Code'` token from `src/tailwind.css`.

### 2.2 Per-route SEO

- `app.routes.ts`: add `title:` to each route — Landing: "Kilian Audroin — Web Developer"; About: "À propos — Kilian Audroin"; ProjectDetail: generic fallback; NotFound: "404 — Kilian Audroin".
- `ProjectDetail`: on successful load, set document title to "{project.title} — Kilian Audroin" and meta description from `project.description` via Angular `Title`/`Meta` services.

### 2.3 Social links become real anchors

- `bento-social`: replace button + `window.open` with `<a href>` elements — `target="_blank" rel="noopener noreferrer"` for external links, plain `mailto:` for contact. Keep current styling. Remove the `action` callback from `SocialLink`.

### 2.4 Dead code / logs

- Remove `console.log` in `landing.ts` (`onLoadingComplete`) and `about.ts` (`navigate`).
- About page "À PROPOS" nav item: replace dead placeholder with navigation to `/`.

## Theme 3 — Tooling

### 3.1 ESLint

- `ng add angular-eslint` (recommended flat config). Fix all findings (unused imports, empty lifecycle hooks, etc.). Prettier remains the formatter; ESLint covers correctness/Angular rules only.
- Add `"lint": "ng lint"` npm script.

### 3.2 CI

- `.github/workflows/ci.yml`: on push and PR to `main` — checkout, Node 22 with npm cache, `npm ci`, `npm run lint`, `npm run build`, `npm test`, all with `working-directory: portfolio`. No deploy step.

## Theme 4 — Modernization + tests

### 4.1 Angular modernization

- Constructor DI → `inject()` everywhere.
- `@Input()` → `input()` signal inputs; `@Output()`/`EventEmitter` → `output()`.
- `ChangeDetectionStrategy.OnPush` on every component; delete manual `cdr.markForCheck()` plumbing made obsolete by signals.
- `NgOptimizedImage` on carousel and profile picture images (dimensions already known; first carousel slide gets `priority`).

### 4.2 Carousel

- `currentIndex`, `isLoading`, new `hasError` become signals; `currentProject` becomes `computed()`.
- Error state renders a visible message: "Impossible de charger les projets".
- Delete `preloadFirstImage()` (fixes the `<link rel=preload>` leak in `document.head`) — `NgOptimizedImage` `priority` replaces it. Keep a small low-priority `Image()` warmup loop for the remaining slides.

### 4.3 Service and structure

- `ProjectService`: cache with `shareReplay({ bufferSize: 1, refCount: false })` — one `projects.json` fetch per session.
- Flatten `pages/about/about/` → `pages/about/`.
- `package.json`: remove `tailwindcss` from `dependencies`; keep a single `^4.2.2` entry in `devDependencies`.
- `Dockerfile`: drop the global `@angular/cli` install; build with `npm run build`.
- `loader.ts`: collapse the duplicated timeout branches.

### 4.4 Tests (written against final APIs)

- `ProjectService`: returns all projects; finds by slug; unknown slug → undefined; caching (two subscribes → one HTTP request) — via `provideHttpClientTesting`.
- `BentoCarousel`: next/previous wrap-around, `goToSlide`, error state renders the error message.
- `ProjectDetail`: found / not-found / error states; sets document title on load.
- `Loader`: 15-minute sessionStorage skip logic with fake timers.
- Existing "should create" specs kept with proper providers.

## Verification & rollout

- After each theme: `npm run build` and `npm test` green before committing.
- After Themes 1 and 4: browser check on the dev server — fonts in Network tab, route titles in the tab bar, social links, carousel navigation.
- At the end: `docker compose up` once — image builds, serves, healthcheck reports **healthy**.
- Merge `chore/senior-review-fixes` → `main` when CI is green.

## Out of scope

- `portfolio-api/` (placeholder, untouched).
- Font Awesome CDN replacement.
- Any deploy pipeline changes.
- Sitemap generation tooling (deliberately manual).
