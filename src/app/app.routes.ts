import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then(m => m.HomePage),
  },
  {
    path: 'training',
    loadComponent: () => import('./pages/training/training.page').then(m => m.TrainingPage),
  },
  {
    path: '',
    redirectTo: 'training',
    pathMatch: 'full',
  },
  {
    path: '**',  // всё, что не совпало — тоже на тренировку
    redirectTo: 'training',
  },
];
