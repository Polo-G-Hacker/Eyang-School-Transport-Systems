import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { StudentShellPage } from './student-shell.page';

const routes: Routes = [
  {
    path: '',
    component: StudentShellPage,
    children: [
      { path: 'home',     loadChildren: () => import('../home/student-home.module').then(m => m.StudentHomePageModule) },
      { path: 'qr',       loadChildren: () => import('../qr-pass/qr-pass.module').then(m => m.QrPassPageModule) },
      { path: 'track',    loadChildren: () => import('../track-bus/track-bus.module').then(m => m.TrackBusPageModule) },
      { path: 'profile',  loadChildren: () => import('../profile/student-profile.module').then(m => m.StudentProfilePageModule) },
      { path: '', redirectTo: 'home', pathMatch: 'full' },
    ],
  },
];

@NgModule({
  imports: [SharedModule, RouterModule.forChild(routes)],
  declarations: [StudentShellPage],
})
export class StudentShellPageModule {}
