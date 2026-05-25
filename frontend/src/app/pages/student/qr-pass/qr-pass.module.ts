import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { QrPassPage } from './qr-pass.page';

const routes: Routes = [{ path: '', component: QrPassPage }];

@NgModule({
  imports: [SharedModule, RouterModule.forChild(routes)],
  declarations: [QrPassPage],
})
export class QrPassPageModule {}
