import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { AdminShellPage } from './admin-shell.page';

const routes: Routes = [
  {
    path: '',
    component: AdminShellPage,
    children: [
      { path: 'home',      loadChildren: () => import('../overview/overview.module').then(m => m.AdminOverviewPageModule) },
      { path: 'students',  loadChildren: () => import('../students/students.module').then(m => m.AdminStudentsPageModule) },
      { path: 'payments',  loadChildren: () => import('../payments/payments.module').then(m => m.AdminPaymentsPageModule) },
      { path: 'buses',     loadChildren: () => import('../buses/buses.module').then(m => m.AdminBusesPageModule) },
      { path: 'settings',  loadChildren: () => import('../settings/settings.module').then(m => m.AdminSettingsPageModule) },
      { path: '', redirectTo: 'home', pathMatch: 'full' },
    ],
  },
];

@NgModule({
  imports: [SharedModule, RouterModule.forChild(routes)],
  declarations: [AdminShellPage],
})
export class AdminShellPageModule {}
