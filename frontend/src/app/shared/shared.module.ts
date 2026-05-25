import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { StatusBadgeComponent } from './components/status-badge/status-badge.component';
import { StatCardComponent } from './components/stat-card/stat-card.component';
import { ProgressBarComponent } from './components/progress-bar/progress-bar.component';
import { SectionHeaderComponent } from './components/section-header/section-header.component';
import { BusCardComponent } from './components/bus-card/bus-card.component';

@NgModule({
  declarations: [
    StatusBadgeComponent,
    StatCardComponent,
    ProgressBarComponent,
    SectionHeaderComponent,
    BusCardComponent,
  ],
  imports: [CommonModule, IonicModule, FormsModule, ReactiveFormsModule],
  exports: [
    CommonModule,
    IonicModule,
    FormsModule,
    ReactiveFormsModule,
    StatusBadgeComponent,
    StatCardComponent,
    ProgressBarComponent,
    SectionHeaderComponent,
    BusCardComponent,
  ],
})
export class SharedModule {}
