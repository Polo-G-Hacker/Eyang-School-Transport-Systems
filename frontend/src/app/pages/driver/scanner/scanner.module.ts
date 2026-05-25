import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { ScannerPage } from './scanner.page';

const routes: Routes = [{ path: '', component: ScannerPage }];

@NgModule({
  imports: [SharedModule, RouterModule.forChild(routes)],
  declarations: [ScannerPage],
})
export class ScannerPageModule {}
