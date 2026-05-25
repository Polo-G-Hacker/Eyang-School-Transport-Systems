import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { AdminPaymentsPage } from './payments.page';

const routes: Routes = [{ path: '', component: AdminPaymentsPage }];

@NgModule({
  imports: [SharedModule, RouterModule.forChild(routes)],
  declarations: [AdminPaymentsPage],
})
export class AdminPaymentsPageModule {}
