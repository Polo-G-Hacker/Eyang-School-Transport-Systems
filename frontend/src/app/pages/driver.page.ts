import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Geolocation } from '@capacitor/geolocation';
import { IonButton, IonContent, IonInput, IonItem, IonText, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { carOutline, qrCodeOutline, locationOutline, checkmarkCircleOutline, alertCircleOutline, shieldCheckmarkOutline } from 'ionicons/icons';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { ApiService, BootstrapData, PickupRound } from '../core/api.service';
import { OfflineService } from '../core/offline.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonButton, IonInput, IonItem, IonText, IonIcon],
  template: `
    <ion-content>
      <main class="page driver-page">
        <header class="topbar">
          <div class="user-info">
            <div class="avatar-container">
              <div class="avatar-fallback">{{ initials(driverName) }}</div>
              <div class="status-indicator"></div>
            </div>
            <div class="welcome-text">
              <p class="greeting">Welcome,</p>
              <h2 class="user-name">{{ driverName }}</h2>
            </div>
          </div>
          <div class="role-badge">Driver</div>
        </header>

        <section class="info-card">
          <div class="info-icon">
            <ion-icon name="shield-checkmark-outline"></ion-icon>
          </div>
          <div class="info-text">
            <h3>Security Boarding</h3>
            <p>Scan student QR passes to verify payment and reservation.</p>
          </div>
        </section>

        <section class="bus-config">
          <div class="section-header">
            <h3><ion-icon name="car-outline"></ion-icon> Bus Details</h3>
          </div>
          <div class="card config-card">
            <div class="input-grid">
              <ion-item lines="none" class="custom-item">
                <ion-input label="Plate Number" labelPlacement="stacked" [(ngModel)]="plate" placeholder="LT 0000 X" />
              </ion-item>
              <ion-item lines="none" class="custom-item">
                <ion-input label="Color" labelPlacement="stacked" [(ngModel)]="color" placeholder="Blue" />
              </ion-item>
              <ion-item lines="none" class="custom-item">
                <ion-input label="Capacity" labelPlacement="stacked" type="number" [(ngModel)]="capacity" placeholder="30" />
              </ion-item>
            </div>
          </div>
        </section>

        <div class="main-actions">
          <button class="btn-primary" (click)='startRound()'>
            <ion-icon name="qr-code-outline"></ion-icon>
            Start Pickup Round
          </button>
          <button class="btn-secondary" (click)="sendGps()">
            <ion-icon name="location-outline"></ion-icon>
            Send GPS
          </button>
        </div>

        <section class="scanner-section">
          <div class="section-header">
            <h3><ion-icon name="qr-code-outline"></ion-icon> QR Scanner</h3>
          </div>
          <div class="scanner-container">
            <div id="reader"></div>
            <div class="scanner-overlay"></div>
          </div>
        </section>

        @if (message) {
          <div class="scan-result" [class.granted]="lastScanValid === true" [class.denied]="lastScanValid === false">
            <ion-icon [name]="lastScanValid ? 'checkmark-circle-outline' : 'alert-circle-outline'"></ion-icon>
            <div class="result-text">
              <h4>{{ lastScanValid === true ? 'Access Granted' : (lastScanValid === false ? 'Access Denied' : 'Notice') }}</h4>
              <p>{{ message }}</p>
            </div>
          </div>
        }
      </main>
    </ion-content>
  `,
  styles: [`
    .driver-page {
      padding: 20px;
      background: #f8fafc;
      min-height: 100%;
    }

    .topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .avatar-fallback {
      width: 50px;
      height: 50px;
      border-radius: 16px;
      background: #0f172a;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 18px;
    }

    .status-indicator {
      position: absolute;
      bottom: -2px;
      right: -2px;
      width: 14px;
      height: 14px;
      background: #22c55e;
      border: 3px solid #f8fafc;
      border-radius: 50%;
    }

    .welcome-text .greeting {
      margin: 0;
      font-size: 13px;
      color: #64748b;
      font-weight: 500;
    }

    .user-name {
      margin: 0;
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
    }

    .role-badge {
      background: #edf2ff;
      color: #3b82f6;
      padding: 6px 14px;
      border-radius: 99px;
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-card {
      background: #0f172a;
      color: white;
      padding: 20px;
      border-radius: 24px;
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.2);
    }

    .info-icon {
      width: 44px;
      height: 44px;
      background: rgba(255,255,255,0.1);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      color: #3b82f6;
    }

    .info-text h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 800;
    }

    .info-text p {
      margin: 4px 0 0;
      font-size: 13px;
      color: #94a3b8;
      font-weight: 500;
    }

    .section-header {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
    }

    .section-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .config-card {
      background: white;
      border-radius: 20px;
      padding: 16px;
      border: 1px solid #e2e8f0;
      margin-bottom: 24px;
    }

    .input-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .input-grid .custom-item:first-child {
      grid-column: 1 / -1;
    }

    .custom-item {
      --background: #f8fafc;
      --border-radius: 12px;
      --padding-start: 12px;
      --highlight-height: 0;
      border: 1px solid #f1f5f9;
    }

    .main-actions {
      display: grid;
      grid-template-columns: 1.5fr 1fr;
      gap: 12px;
      margin-bottom: 24px;
    }

    .main-actions button {
      padding: 16px;
      border-radius: 16px;
      font-weight: 800;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
      box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
    }

    .btn-secondary {
      background: white;
      color: #0f172a;
      border: 1px solid #e2e8f0 !important;
    }

    .scanner-section {
      margin-bottom: 24px;
    }

    .scanner-container {
      position: relative;
      background: white;
      border-radius: 24px;
      padding: 12px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
    }

    #reader {
      border: none !important;
      border-radius: 16px;
      overflow: hidden;
    }

    .scan-result {
      background: white;
      border-radius: 20px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 16px;
      border: 1px solid #e2e8f0;
      animation: slideUp 0.3s ease-out;
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .scan-result ion-icon {
      font-size: 32px;
      color: #64748b;
    }

    .result-text h4 {
      margin: 0;
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
    }

    .result-text p {
      margin: 2px 0 0;
      font-size: 13px;
      color: #64748b;
      font-weight: 500;
    }

    .scan-result.granted {
      background: #f0fdf4;
      border-color: #bcf2ce;
    }

    .scan-result.granted ion-icon, .scan-result.granted h4 {
      color: #22c55e;
    }

    .scan-result.denied {
      background: #fef2f2;
      border-color: #fecaca;
    }

    .scan-result.denied ion-icon, .scan-result.denied h4 {
      color: #ef4444;
    }
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

  constructor(private api: ApiService, private offline: OfflineService) {
    addIcons({ carOutline, qrCodeOutline, locationOutline, checkmarkCircleOutline, alertCircleOutline, shieldCheckmarkOutline });
  }

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
      this.message = `Pickup round started. ${round.notifiedStudents || 0} students notified.`;
    });
  }

  async sendGps() {
    if (!this.busId) return;
    const pos = await Geolocation.getCurrentPosition();
    this.api.gps(this.busId, pos.coords.latitude, pos.coords.longitude).subscribe(() => {
      this.lastScanValid = undefined;
      this.message = 'GPS location sent successfully.';
    });
  }

  private initScanner() {
    const scanner = new Html5QrcodeScanner('reader', { fps: 10, qrbox: { width: 240, height: 240 } }, false);
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
      this.message = 'Offline scan saved. Will sync when online.';
      this.scanning = false;
      return;
    }

    this.api.validateBoarding({ token, roundId, busId: this.busId }).subscribe(result => {
      this.lastScanValid = result.valid;
      this.message = result.valid
        ? `Access granted for ${result.studentName || 'Student'}.`
        : `Access denied: ${result.reason}`;
      setTimeout(() => this.scanning = false, 1200);
    }, err => {
      this.lastScanValid = false;
      this.message = err.error?.message || 'Scan failed.';
      this.scanning = false;
    });
  }

  initials(name = '?') {
    return name.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase();
  }
}
