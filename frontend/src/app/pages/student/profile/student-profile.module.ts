import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { StudentProfilePage } from './student-profile.page';

const routes: Routes = [{ path: '', component: StudentProfilePage }];

@NgModule({
  imports: [SharedModule, RouterModule.forChild(routes)],
  declarations: [StudentProfilePage],
})
export class StudentProfilePageModule {}
