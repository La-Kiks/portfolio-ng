import { DOCUMENT, inject, Injectable } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { Project } from '../projects/project';

/** Public root of the deployed app; relative asset paths are resolved against it. */
export const SITE_URL = 'https://kilian-au.fr/portfolio/';

const SCRIPT_ID = 'project-video-ld';
const UPLOAD_DATE = '2026-11-20';
/** Same image as the default card in index.html. */
const DEFAULT_IMAGE = SITE_URL + 'images/paris-stage-wide.webp';

/** Per-project VideoObject JSON-LD, social image and page URL, set client-side on the detail page. */
@Injectable({ providedIn: 'root' })
export class VideoSeo {
  private readonly document = inject(DOCUMENT);
  private readonly meta = inject(Meta);

  apply(project: Project): void {
    const thumbnailUrl = SITE_URL + project.video.posterLandscape;
    const videoObject = {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: project.title,
      description: project.description,
      thumbnailUrl,
      contentUrl: SITE_URL + project.video.landscape,
      uploadDate: UPLOAD_DATE,
      duration: project.video.duration,
    };

    let script = this.document.getElementById(SCRIPT_ID);
    if (!script) {
      script = this.document.createElement('script');
      script.id = SCRIPT_ID;
      script.setAttribute('type', 'application/ld+json');
      this.document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(videoObject);
    this.setImage(thumbnailUrl);
    this.setPageUrl(SITE_URL + 'projects/' + project.slug);
  }

  clear(): void {
    this.document.getElementById(SCRIPT_ID)?.remove();
    this.setImage(DEFAULT_IMAGE);
    this.setPageUrl(SITE_URL);
  }

  private setImage(url: string): void {
    this.meta.updateTag({ property: 'og:image', content: url });
    this.meta.updateTag({ name: 'twitter:image', content: url });
  }

  /** Without this, every project page would declare itself a duplicate of the landing page. */
  private setPageUrl(url: string): void {
    let canonical = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = this.document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      this.document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);
    this.meta.updateTag({ property: 'og:url', content: url });
  }
}
