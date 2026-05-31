import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Geolocation } from '@capacitor/geolocation';
import { IonButton, IonContent, IonInput, IonItem, IonText } from '@ionic/angular/standalone';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { ApiService, BootstrapData, PickupRound } from '../core/api.service';
import { OfflineService } from '../core/offline.service';

@Component({
  standalone: true,
  imports: [FormsModule, IonContent, IonButton, IonInput, IonItem, IonText],
  template: `
    <ion-content>
      <main class="page">
        <header class="driver-head">
          <div class="driver-brand">
            <img class="school-logo" src="assets/st jean logo.png" alt="Saint Jean Ingenieur logo">
            <div>
              <p class="muted">Welcome</p>
              <h1 class="title">{{ driverName }}</h1>
            </div>
          </div>
          <span class="driver-badge">Driver</span>
        </header>
        <p class="muted intro">Scan student QR passes. Access is granted only when the student has paid and reserved a place on this bus.</p>
        <section class="card bus-form">
          <h2>Bus Details</h2>
          <ion-item><ion-input label="Plate number" labelPlacement="stacked" [(ngModel)]="plate" /></ion-item>
          <ion-item><ion-input label="Color" labelPlacement="stacked" [(ngModel)]="color" /></ion-item>
          <ion-item><ion-input label="Capacity" labelPlacement="stacked" type="number" [(ngModel)]="capacity" /></ion-item>
        </section>
        <div class="actions"><ion-button class="primary-button" (click)="startRound()">Start Pickup Round</ion-button><ion-button class="ghost-button" (click)="sendGps()">Send GPS</ion-button></div>
        <h2 class="section-title">QR Scanner</h2>
        <section class="card scanner"><div id="reader"></div></section>
        @if (message) { <div class="scan-result" [class.granted]="lastScanValid === true" [class.denied]="lastScanValid === false">{{ message }}</div> }
      </main>
    </ion-content>
  `,
  styles: [`
    .driver-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:8px}.driver-brand{display:flex;align-items:center;gap:12px}.driver-head .title{margin:0}.intro{margin-bottom:22px}.driver-badge{border-radius:999px;background:#edf1f7;color:#215be6;padding:8px 12px;font-weight:850;font-size:13px}.school-logo{width:46px;height:46px;border-radius:14px;object-fit:contain;background:#fff;padding:5px;box-shadow:0 8px 18px rgba(18,28,45,.08)}
    .bus-form{padding:18px}.bus-form h2{margin-top:0}.actions{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0}.scanner{padding:12px;overflow:hidden}ion-item{--background:#f2f5fb;--border-radius:16px;margin:10px 0}
    .scan-result{margin-top:14px;border-radius:18px;padding:16px;font-weight:850;background:#edf1f7;color:#171b26}
    .scan-result.granted{background:#d9f9e5;color:#18a650;border:1px solid #24c564}
    .scan-result.denied{background:#ffe2e2;color:#ef4444;border:1px solid #ffb4b4}
  `]
})
export class DriverPage implements OnInit {
  data?: BootstrapData; round?: PickupRound; message = '';
  lastScanValid?: boolean;
  scanning = false;
  lastToken = '';
  lastScanAt = 0;
  driverName = 'Driver';
  plate = 'LT 4892 A'; color = 'Blue'; capacity = 30;
  get currentUser() { return JSON.parse(localStorage.getItem('ests_user') || '{}'); }
  get assignedBus() { return this.data?.buses.find(bus => bus.driver_id === this.currentUser.id) || this.data?.buses[0]; }
  get busId() { return this.assignedBus?.id || ''; }

  constructor(private api: ApiService, private offline: OfflineService) {}

  ngOnInit() {
    this.api.bootstrap().subscribe(data => {
      this.data = data;
      this.driverName = data.profile?.full_name || this.currentUser.fullName || 'Driver';
      this.plate = this.assignedBus?.plate_number || this.plate;
      this.color = this.assignedBus?.color || this.color;
      this.capacity = this.assignedBus?.capacity || this.capacity;
    });
    setTimeout(() => this.initScanner(), 300);
    window.addEventListener('online', () => this.offline.syncQueuedScans());
  }

  startRound() {
    if (!this.busId) return;
    this.api.startRound(this.busId).subscribe(round => {
      this.round = round;
      localStorage.setItem('active_round', round.id);
      this.message = `Pickup round started. ${round.notifiedStudents || 0} student${round.notifiedStudents === 1 ? '' : 's'} notified.`;
    });
  }

  async sendGps() {
    if (!this.busId) return;
    const pos = await Geolocation.getCurrentPosition();
    this.api.gps(this.busId, pos.coords.latitude, pos.coords.longitude).subscribe(() => this.message = 'GPS location sent.');
  }

  private initScanner() {
    const scanner = new Html5QrcodeScanner('reader', { fps: 8, qrbox: { width: 240, height: 240 } }, false);
    scanner.render(token => this.handleScan(token), () => undefined);
  }

  private async handleScan(token: string) {
    const roundId = this.round?.id || localStorage.getItem('active_round') || '';
    const now = Date.now();
    if (this.scanning || (token === this.lastToken && now - this.lastScanAt < 3500)) return;
    this.scanning = true;
    this.lastToken = token;
    this.lastScanAt = now;
    this.lastScanValid = undefined;
    this.message = 'Checking QR pass...';
    if (!roundId || !this.busId) {
      this.lastScanValid = false;
      this.message = 'Start a pickup round before scanning.';
      this.scanning = false;
      return;
    }
    if (!navigator.onLine) {
      await this.offline.queueScan({ token, roundId, busId: this.busId });
      this.lastScanValid = undefined;
      this.message = 'Offline scan saved. It will sync when internet returns.';
      this.scanning = false;
      return;
    }
    this.api.validateBoarding({ token, roundId, busId: this.busId }).subscribe(result => {
      this.lastScanValid = result.valid;
      this.message = result.valid
        ? `Access granted. ${result.studentName || 'Student'} matches bus ${result.busPlate || this.plate}.`
        : `Access denied. ${result.reason}`;
      setTimeout(() => this.scanning = false, 1200);
    }, err => {
      this.lastScanValid = false;
      this.message = err.error?.message || 'Scan failed. Try again.';
      this.scanning = false;
    });
  }
}
