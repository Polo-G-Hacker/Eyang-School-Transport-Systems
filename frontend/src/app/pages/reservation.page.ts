import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonButton, IonContent, IonItem, IonLabel, IonSelect, IonSelectOption, IonText } from '@ionic/angular/standalone';
import { ApiService, BootstrapData } from '../core/api.service';

@Component({
  standalone: true,
  imports: [FormsModule, IonContent, IonItem, IonLabel, IonSelect, IonSelectOption, IonButton, IonText],
  template: `
    <ion-content>
      <main class="page">
        <h1 class="title">Reserve Transport</h1><p class="muted">Reserve one spot for {{ monthKey }}. No seat number is assigned.</p>
        <section class="card form">
          <ion-item><ion-label>Pickup</ion-label><ion-select [(ngModel)]="pickupPointId" (ionChange)="selectBusForPickup()">@for (point of data?.pickupPoints || []; track point.id) { @if (point.name !== 'Eyang') { <ion-select-option [value]="point.id">{{ point.name }}</ion-select-option> } }</ion-select></ion-item>
          <ion-item><ion-label>Bus</ion-label><ion-select [(ngModel)]="busId">@for (bus of busesForPickup; track bus.id) { <ion-select-option [value]="bus.id">{{ bus.plate_number }} - {{ bus.color }} - {{ bus.capacity }} seats</ion-select-option> }</ion-select></ion-item>
          <ion-button expand="block" class="primary-button" (click)="reserve()">Confirm Reservation</ion-button>
          @if (message) { <ion-text>{{ message }}</ion-text> }
        </section>
      </main>
    </ion-content>
  `,
  styles: [`.form{padding:18px;margin-top:24px} ion-item{--background:#f2f5fb;--border-radius:16px;margin:12px 0}`]
})
export class ReservationPage implements OnInit {
  data?: BootstrapData; busId = ''; pickupPointId = ''; monthKey = new Date().toISOString().slice(0, 7); message = '';
  get busesForPickup() { return (this.data?.buses || []).filter(bus => bus.pickup_point_id === this.pickupPointId); }
  constructor(private api: ApiService) {}
  ngOnInit() { this.load(); }
  load() {
    this.api.bootstrap().subscribe(data => {
      this.data = data;
      const existing = data.reservations.find(item => item.month_key === this.monthKey);
      this.pickupPointId = existing?.pickup_point_id || data.pickupPoints.find(point => point.name !== 'Eyang')?.id || '';
      this.busId = existing?.bus_id || '';
      if (!this.busId) this.selectBusForPickup();
    });
  }
  selectBusForPickup() { this.busId = this.busesForPickup[0]?.id || ''; }
  reserve() {
    if (!this.busId) { this.message = 'No bus is assigned to this pickup point.'; return; }
    const paid = (this.data?.payments || []).some(payment => payment.month_key === this.monthKey && payment.status === 'validated');
    if (!paid) {
      this.message = 'You must pay for this month before reserving a bus.';
      return;
    }
    this.api.reserve({ busId: this.busId, pickupPointId: this.pickupPointId, monthKey: this.monthKey }).subscribe({
      next: () => { this.message = 'Reservation confirmed.'; this.load(); },
      error: err => this.message = err.error?.message || 'Reservation failed.'
    });
  }
}
