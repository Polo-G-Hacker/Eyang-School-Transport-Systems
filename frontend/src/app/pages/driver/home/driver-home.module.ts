import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { DriverHomePage } from './driver-home.page';

const routes: Routes = [{ path: '', component: DriverHomePage }];

@NgModule({
  imports: [SharedModule, RouterModule.forChild(routes)],
  declarations: [DriverHomePage],
})
export class DriverHomePageModule {}
