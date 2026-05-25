import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { TrackBusPage } from './track-bus.page';

const routes: Routes = [{ path: '', component: TrackBusPage }];

@NgModule({
  imports: [SharedModule, RouterModule.forChild(routes)],
  declarations: [TrackBusPage],
})
export class TrackBusPageModule {}
