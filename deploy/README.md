# Going live

These steps move the portfolio to `kilian-au.fr/portfolio/` behind Caddy.

## Before you start

- Order matters: reload Caddy BEFORE swapping the container. The other way round, the new `index.html` is served at `/` by the old Caddy, its `/portfolio/` requests get 404s with a 1-year immutable header, and those browsers stay blank long after the deploy.
- Run the steps on the VPS, from the repo checkout, on the merged code.

## Steps

1. Back up the live config. The Caddyfile path may differ on your server.

   ```bash
   sudo cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.pre-subpath
   diff /etc/caddy/Caddyfile deploy/Caddyfile
   ```

   Review the diff. Merge any other sites or hostnames from the live file into `deploy/Caddyfile` before validating (step 5), or they will be dropped.

2. Confirm the container publishes port 4200. The Caddyfile hardcodes 4200, so check `UI_PORT` in `.env`.

   ```bash
   docker compose ps
   ```

   If the container isn't on 4200, fix `UI_PORT` in `.env` or the Caddyfile before going further.

   Check the access logs for external callers of `/wlangage_2024_full.json`.

3. Tag the running image for rollback. Find its name first and note it, because rollback needs it.

   ```bash
   docker compose images
   docker tag <image> portfolio:pre-subpath
   ```

4. Build without restarting. The old container keeps serving.

   ```bash
   docker compose build
   ```

5. Validate the new config.

   ```bash
   caddy validate --config deploy/Caddyfile
   ```

6. Copy it over the live one and reload.

   ```bash
   sudo cp deploy/Caddyfile /etc/caddy/Caddyfile && sudo systemctl reload caddy
   ```

   Check that the reload worked before going on:

   ```bash
   curl -sI https://kilian-au.fr/about
   ```

   It must show a `302` to `/portfolio/about`. If it doesn't, stop here and do not run the next step. The old container is still running behind Caddy, so fix the reload or restore the backup.

7. Straight away, swap the container.

   ```bash
   docker compose up -d
   ```

8. Check on both `kilian-au.fr` and `www.kilian-au.fr`, including `http://` to `https://`:
   - `/` redirects to `/portfolio/`.
   - `/portfolio/`, `/portfolio/about` and a project page load with images and fonts.
   - `/about` redirects with a 302.
   - `curl -sI https://kilian-au.fr/portfolio/` shows `no-cache, no-store, must-revalidate`.
   - `/robots.txt` and `/sitemap.xml` return 200.

## Rollback

This is the reverse of the going-live order, because the old Caddy must never sit in front of the new container.

```bash
docker tag portfolio:pre-subpath <image>
docker compose up -d --no-build
sudo cp /etc/caddy/Caddyfile.pre-subpath /etc/caddy/Caddyfile && sudo systemctl reload caddy
```

## After a few stable days

Change `@moved` from 302 to 301 in `deploy/Caddyfile` and on the server, then reload Caddy.

## SaaS launch

- Replace the final `handle` block with the SaaS proxy.
- Remove `/robots.txt`, `/sitemap.xml` and `/favicon.ico` from `@rootfiles`, or let the SaaS serve them. Its robots and sitemap must then list the portfolio URLs.
- `@moved` keeps `/about`, `/projects/*`, `/images/*` and `/files/*` off the SaaS, and browsers cache those 301s.
- Same origin means shared cookies and browser storage: scope SaaS auth cookies deliberately.
