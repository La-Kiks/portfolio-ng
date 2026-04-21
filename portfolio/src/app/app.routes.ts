import { Routes } from '@angular/router';
import { Landing } from './pages/landing/landing';
import { NotFound } from './pages/not-found/not-found';
import { ProjectDetail } from './pages/projects/project-detail/project-detail';

export const routes: Routes = [
    { path: '', component: Landing },
    { path: 'projects/:slug', component: ProjectDetail },
    { path: '**', component: NotFound },
];
