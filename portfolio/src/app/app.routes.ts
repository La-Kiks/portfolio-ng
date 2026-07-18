import { Routes } from '@angular/router';
import { Landing } from './pages/landing/landing';
import { NotFound } from './pages/not-found/not-found';
import { ProjectDetail } from './pages/projects/project-detail/project-detail';
import { About } from './pages/about/about';

export const routes: Routes = [
  { path: '', component: Landing, title: 'Kilian Audroin — Web Developer' },
  { path: 'about', component: About, title: 'À propos — Kilian Audroin' },
  { path: 'projects/:slug', component: ProjectDetail, title: 'Projet — Kilian Audroin' },
  { path: '**', component: NotFound, title: '404 — Kilian Audroin' },
];
