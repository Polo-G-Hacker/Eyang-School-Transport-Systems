import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { AdminOverviewPage } from './overview.page';

const routes: Routes = [{ path: '', component: AdminOverviewPage }];

@NgModule({
  imports: [SharedModule, RouterModule.forChild(routes)],
  declarations: [AdminOverviewPage],
})
export class AdminOverviewPageModule {}
