import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { PickupRoundPage } from './pickup-round.page';

const routes: Routes = [{ path: '', component: PickupRoundPage }];

@NgModule({
  imports: [SharedModule, RouterModule.forChild(routes)],
  declarations: [PickupRoundPage],
})
export class PickupRoundPageModule {}
