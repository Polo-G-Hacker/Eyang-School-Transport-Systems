import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { DriverShellPage } from './driver-shell.page';

const routes: Routes = [
  {
    path: '',
    component: DriverShellPage,
    children: [
      { path: 'home', loadChildren: () => import('../home/driver-home.module').then(m => m.DriverHomePageModule) },
      { path: 'scan', loadChildren: () => import('../scanner/scanner.module').then(m => m.ScannerPageModule) },
      { path: 'bus',  loadChildren: () => import('../bus-setup/bus-setup.module').then(m => m.BusSetupPageModule) },
      { path: 'round', loadChildren: () => import('../pickup-round/pickup-round.module').then(m => m.PickupRoundPageModule) },
      { path: 'expected', loadChildren: () => import('../expected-list/expected-list.module').then(m => m.ExpectedListPageModule) },
      { path: '', redirectTo: 'home', pathMatch: 'full' },
    ],
  },
];

@NgModule({
  imports: [SharedModule, RouterModule.forChild(routes)],
  declarations: [DriverShellPage],
})
export class DriverShellPageModule {}
