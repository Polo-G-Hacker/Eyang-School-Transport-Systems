import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { BusSetupPage } from './bus-setup.page';

const routes: Routes = [{ path: '', component: BusSetupPage }];

@NgModule({
  imports: [SharedModule, RouterModule.forChild(routes)],
  declarations: [BusSetupPage],
})
export class BusSetupPageModule {}
