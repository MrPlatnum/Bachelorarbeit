import { Routes } from '@angular/router';

export const routes: Routes = [
  { 
    path: '', 
    redirectTo: '/consent', 
    pathMatch: 'full' 
  },
  { 
    path: 'consent', 
    loadComponent: () => import('./components/consent/consent.component').then(c => c.ConsentComponent)
  },
  { 
    path: 'test-suite', 
    loadComponent: () => import('./components/test-suite/test-suit-usability/test-suite.component').then(c => c.TestSuiteComponent)
  },
  { 
    path: 'completion', 
    loadComponent: () => import('./components/completion/completion.component').then(c => c.CompletionComponent)
  },
  { 
    path: 'test', 
    loadComponent: () => import('./components/test-suite/assessments/preivew/ceiling-placement-demonstrator.component').then(c => c.CeilingPlacementDemonstratorComponent)
  },
  { 
    path: '**', 
    redirectTo: '/consent' 
  }
];