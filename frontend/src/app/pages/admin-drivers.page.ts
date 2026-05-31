import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlertController, IonButton, IonContent, IonInput, IonItem, IonLabel, IonSelect, IonSelectOption, IonText } from '@ionic/angular/standalone';
import { AdminDashboard, ApiService } from '../core/api.service';

@Component({
  standalone: true,
  imports: [FormsModule, IonContent, IonButton, IonInput, IonItem, IonLabel, IonSelect, IonSelectOption, IonText],
  template: `
    <ion-content>
      <main class="page">
        <header class="topbar">
          <div><p class="muted">Admin only</p><h1 class="title">Drivers</h1></div>
          <span class="status">{{ data?.drivers?.length || 0 }} drivers</span>
        </header>

        <section class="card form">
          <h2>Add Driver</h2>
          <ion-item><ion-input label="Full name" labelPlacement="stacked" [(ngModel)]="fullName" /></ion-item>
          <ion-item><ion-input label="Email" labelPlacement="stacked" type="email" [(ngModel)]="email" /></ion-item>
          <ion-item><ion-input label="Temporary password" labelPlacement="stacked" type="password" [(ngModel)]="password" /></ion-item>
          <ion-item>
            <ion-label>Pickup point</ion-label>
            <ion-select [(ngModel)]="pickupPointId">
              @for (point of data?.pickupPoints || []; track point.id) {
                @if (point.name !== 'Eyang') {
                  <ion-select-option [value]="point.id">{{ point.name }}</ion-select-option>
                }
              }
            </ion-select>
          </ion-item>
          <div class="bus-grid">
            <ion-item><ion-input label="Plate number" labelPlacement="stacked" [(ngModel)]="plateNumber" /></ion-item>
            <ion-item><ion-input label="Color" labelPlacement="stacked" [(ngModel)]="color" /></ion-item>
            <ion-item><ion-input label="Capacity" labelPlacement="stacked" type="number" [(ngModel)]="capacity" /></ion-item>
          </div>
          <ion-button expand="block" class="primary-button" (click)="create()">Create Driver</ion-button>
          @if (message) { <ion-text>{{ message }}</ion-text> }
        </section>

        <h2 class="section-title">Current Drivers</h2>
        <section class="card list-card">
          @for (driver of data?.drivers || []; track driver.id) {
            <div class="row">
              <div class="avatar">{{ initials(driver.full_name) }}</div>
              <div class="row-main"><h3>{{ driver.full_name }}</h3><p>{{ driver.email }} · {{ driver.plate_number || 'No bus assigned' }}</p></div>
              <ion-button size="small" color="danger" fill="clear" (click)="deleteDriver(driver.id)">Delete</ion-button>
            </div>
          }
        </section>
      </main>
    </ion-content>
  `,
  styles: [`
    .form{padding:18px}.form h2{margin:0 0 12px}.bus-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.bus-grid ion-item:last-child{grid-column:1/-1}
    ion-item{--background:#f2f5fb;--border-radius:16px;margin:10px 0}
    .row ion-button{--border-radius:14px;font-weight:800}
  `]
})
export class AdminDriversPage implements OnInit {
  data?: AdminDashboard;
  fullName = '';
  email = '';
  password = 'driver123';
  pickupPointId = '';
  plateNumber = '';
  color = '';
  capacity = 30;
  message = '';

  constructor(private api: ApiService, private alerts: AlertController) {}

  ngOnInit() { this.load(); }

  load() {
    this.api.adminDashboard().subscribe(data => {
      this.data = data;
      this.pickupPointId ||= data.pickupPoints.find(point => point.name !== 'Eyang')?.id || '';
    });
  }

  create() {
    this.message = '';
    const missing = [
      [this.fullName.trim(), 'full name'],
      [this.email.trim(), 'email'],
      [this.password.trim(), 'temporary password'],
      [this.pickupPointId, 'pickup point'],
      [this.plateNumber.trim(), 'plate number'],
      [this.color.trim(), 'bus color']
    ].filter(([value]) => !value).map(([, label]) => label);
    if (missing.length) {
      this.message = `Please fill: ${missing.join(', ')}.`;
      return;
    }
    if (!this.email.includes('@')) {
      this.message = 'Please enter a valid email address.';
      return;
    }
    this.api.createDriver({
      fullName: this.fullName,
      email: this.email,
      password: this.password,
      pickupPointId: this.pickupPointId,
      plateNumber: this.plateNumber,
      color: this.color,
      capacity: Number(this.capacity)
    }).subscribe({
      next: () => {
        this.message = 'Driver created and bus assigned.';
        this.fullName = '';
        this.email = '';
        this.pickupPointId = this.data?.pickupPoints.find(point => point.name !== 'Eyang')?.id || '';
        this.plateNumber = '';
        this.color = '';
        this.capacity = 30;
        this.load();
      },
      error: err => this.message = err.error?.message || 'Could not create driver.'
    });
  }

  initials(name = '?') {
    return name.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase();
  }

  async deleteDriver(driverId: string) {
    this.message = '';
    const alert = await this.alerts.create({
      header: 'Delete driver?',
      message: 'This will disable the driver account and unassign the driver from their bus.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.api.deleteDriver(driverId).subscribe({
              next: () => {
                this.message = 'Driver deleted.';
                this.load();
              },
              error: err => this.message = err.error?.message || 'Could not delete driver.'
            });
          }
        }
      ]
    });
    await alert.present();
  }
}
