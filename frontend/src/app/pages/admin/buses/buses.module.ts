import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { AdminBusesPage } from './buses.page';

const routes: Routes = [{ path: '', component: AdminBusesPage }];

@NgModule({
  imports: [SharedModule, RouterModule.forChild(routes)],
  declarations: [AdminBusesPage],
})
export class AdminBusesPageModule {}
