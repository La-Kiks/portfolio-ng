import { Routes } from '@angular/router';
import { Landing } from './pages/landing/landing';
import { NotFound } from './pages/not-found/not-found';

export const routes: Routes = [
    { path: "", component: Landing },
    { path: '**', component: NotFound },
];
