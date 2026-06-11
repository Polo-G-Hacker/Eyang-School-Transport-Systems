import { Routes } from '@angular/router';
import { TabsPage } from './tabs/tabs.page';

export const routes: Routes = [
  { path: '', redirectTo: 'splash', pathMatch: 'full' },
  { path: 'splash', loadComponent: () => import('./pages/splash.page').then(m => m.SplashPage) },
  { path: 'login', loadComponent: () => import('./pages/login.page').then(m => m.LoginPage) },
  { path: 'signup', loadComponent: () => import('./pages/signup.page').then(m => m.SignupPage) },
  { path: 'reset-password', loadComponent: () => import('./pages/reset-password.page').then(m => m.ResetPasswordPage) },
  { path: 'verify-email', loadComponent: () => import('./pages/verify-email.page').then(m => m.VerifyEmailPage) },
  {
    path: 'app',
    component: TabsPage,
    children: [
      { path: 'student', loadComponent: () => import('./pages/student-dashboard.page').then(m => m.StudentDashboardPage) },
      { path: 'qr', loadComponent: () => import('./pages/qr-pass.page').then(m => m.QrPassPage) },
      { path: 'track', loadComponent: () => import('./pages/track-map.page').then(m => m.TrackMapPage) },
      { path: 'reservation', loadComponent: () => import('./pages/reservation.page').then(m => m.ReservationPage) },
      { path: 'profile', loadComponent: () => import('./pages/profile.page').then(m => m.ProfilePage) },
      { path: 'notifications', loadComponent: () => import('./pages/notifications.page').then(m => m.NotificationsPage) },
      { path: 'driver', loadComponent: () => import('./pages/driver.page').then(m => m.DriverPage) },
      { path: 'admin', loadComponent: () => import('./pages/admin-dashboard.page').then(m => m.AdminDashboardPage) },
      { path: 'students', loadComponent: () => import('./pages/admin-students.page').then(m => m.AdminStudentsPage) },
      { path: 'payments', loadComponent: () => import('./pages/admin-payments.page').then(m => m.AdminPaymentsPage) },
      { path: 'drivers', loadComponent: () => import('./pages/admin-drivers.page').then(m => m.AdminDriversPage) },
      { path: 'admin-profile', loadComponent: () => import('./pages/admin-profile.page').then(m => m.AdminProfilePage) },
      { path: '', redirectTo: 'student', pathMatch: 'full' }
    ]
  }
];
