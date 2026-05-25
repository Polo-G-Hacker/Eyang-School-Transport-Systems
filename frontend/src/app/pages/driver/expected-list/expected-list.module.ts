import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { ExpectedListPage } from './expected-list.page';

const routes: Routes = [{ path: '', component: ExpectedListPage }];

@NgModule({
  imports: [SharedModule, RouterModule.forChild(routes)],
  declarations: [ExpectedListPage],
})
export class ExpectedListPageModule {}
