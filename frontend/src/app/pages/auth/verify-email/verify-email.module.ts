import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { VerifyEmailPage } from './verify-email.page';

const routes: Routes = [{ path: '', component: VerifyEmailPage }];

@NgModule({
  imports: [SharedModule, RouterModule.forChild(routes)],
  declarations: [VerifyEmailPage],
})
export class VerifyEmailPageModule {}
