import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { RegisterPage } from './register.page';

const routes: Routes = [{ path: '', component: RegisterPage }];

@NgModule({
  imports: [SharedModule, RouterModule.forChild(routes)],
  declarations: [RegisterPage],
})
export class RegisterPageModule {}
