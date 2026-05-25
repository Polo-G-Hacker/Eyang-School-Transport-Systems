import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { AdminSettingsPage } from './settings.page';

const routes: Routes = [{ path: '', component: AdminSettingsPage }];

@NgModule({
  imports: [SharedModule, RouterModule.forChild(routes)],
  declarations: [AdminSettingsPage],
})
export class AdminSettingsPageModule {}
