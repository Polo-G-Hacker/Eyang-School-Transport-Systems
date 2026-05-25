import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { AdminStudentsPage } from './students.page';

const routes: Routes = [{ path: '', component: AdminStudentsPage }];

@NgModule({
  imports: [SharedModule, RouterModule.forChild(routes)],
  declarations: [AdminStudentsPage],
})
export class AdminStudentsPageModule {}
