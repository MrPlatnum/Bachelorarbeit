import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConsentComponent } from './components/consent/consent.component';
import { TestSuiteComponent } from './components/test-suite/test-suit-usability/test-suite.component';
import { CompletionComponent } from './components/completion/completion.component';

const routes: Routes = [
  { path: '', redirectTo: '/consent', pathMatch: 'full' },
  { path: 'consent', component: ConsentComponent },
  { path: 'test-suite', component: TestSuiteComponent },
  { path: 'completion', component: CompletionComponent },
  { path: '**', redirectTo: '/consent' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }