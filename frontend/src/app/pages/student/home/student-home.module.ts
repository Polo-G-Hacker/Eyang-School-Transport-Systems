import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { StudentHomePage } from './student-home.page';

const routes: Routes = [{ path: '', component: StudentHomePage }];

@NgModule({
  imports: [SharedModule, RouterModule.forChild(routes)],
  declarations: [StudentHomePage],
})
export class StudentHomePageModule {}
