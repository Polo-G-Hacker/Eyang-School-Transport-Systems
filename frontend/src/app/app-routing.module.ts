import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/auth/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadChildren: () => import('./pages/auth/login/login.module').then(m => m.LoginPageModule),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadChildren: () => import('./pages/auth/register/register.module').then(m => m.RegisterPageModule),
  },
  {
    path: 'verify-email',
    loadChildren: () => import('./pages/auth/verify-email/verify-email.module').then(m => m.VerifyEmailPageModule),
  },
  {
    path: 'app/student',
    canActivate: [authGuard, roleGuard('student')],
    loadChildren: () => import('./pages/student/shell/student-shell.module').then(m => m.StudentShellPageModule),
  },
  {
    path: 'app/driver',
    canActivate: [authGuard, roleGuard('driver')],
    loadChildren: () => import('./pages/driver/shell/driver-shell.module').then(m => m.DriverShellPageModule),
  },
  {
    path: 'app/admin',
    canActivate: [authGuard, roleGuard('admin')],
    loadChildren: () => import('./pages/admin/shell/admin-shell.module').then(m => m.AdminShellPageModule),
  },
  { path: '**', redirectTo: 'login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
