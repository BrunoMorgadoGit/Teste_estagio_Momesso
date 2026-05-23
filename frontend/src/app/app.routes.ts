import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { CompaniesComponent } from './pages/companies/companies.component';
import { LoginComponent } from './pages/login/login.component';
import { MachinesComponent } from './pages/machines/machines.component';
import { UsersComponent } from './pages/users/users.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'companies' },
      { path: 'companies', component: CompaniesComponent },
      { path: 'users', component: UsersComponent },
      { path: 'machines', component: MachinesComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];
