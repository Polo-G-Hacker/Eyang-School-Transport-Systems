import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent, IonIcon, IonSkeletonText } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { notificationsOutline, busOutline, walletOutline, calendarOutline, chevronForwardOutline, locationOutline } from 'ionicons/icons';
import { ApiService, AppNotification, BootstrapData } from '../core/api.service';
import { OfflineService } from '../core/offline.service';

@Component({
  standalone: true,
  imports: [CommonModule, IonContent, IonButton, IonIcon, RouterLink, IonSkeletonText],
  template: `
    <ion-content>
      <main class="page student-dashboard">
        <header class="topbar">
          <div class="user-info">
            <div class="avatar-container">
              @if (profilePhoto) {
                <img class="profile-photo" [src]="profilePhoto" alt="Profile photo">
              } @else {
                <div class="avatar-fallback">{{ initials(profileName) }}</div>
              }
              <div class="status-indicator"></div>
            </div>
            <div class="welcome-text">
              <p class="greeting">Welcome back,</p>
              <h2 class="user-name">{{ profileName }}</h2>
            </div>
          </div>
          <button class="notif-btn" routerLink="/app/notifications">
            <ion-icon name="notifications-outline"></ion-icon>
            <span class="badge" *ngIf="unreadCount > 0">{{ unreadCount }}</span>
          </button>
        </header>

        <section class="summary-card">
          <div class="summary-content">
            <div class="brand">
              <img src="assets/st jean logo.png" alt="Logo">
              <div class="brand-text">
                <h1>My Transport</h1>
                <p>{{ profileLevel }} • {{ profileDepartment }}</p>
              </div>
            </div>
            <div class="current-month">
              <ion-icon name="calendar-outline"></ion-icon>
              <span>{{ monthLabel }}</span>
            </div>
          </div>
          <div class="summary-bg"></div>
        </section>

        @if (activePickup) {
          <section class="pickup-alert-card">
            <div class="alert-header">
              <div class="icon-circle pulse">
                <ion-icon name="location-outline"></ion-icon>
              </div>
              <div class="alert-text">
                <h3>{{ activePickup.title }}</h3>
                <p>{{ activePickup.body }}</p>
              </div>
            </div>
            <p class="alert-question">Will you be at your pickup point today?</p>
            <div class="alert-actions">
              <button class="btn-confirm" (click)="respond('yes')">Yes, I'm coming</button>
              <button class="btn-skip" (click)="respond('no')">No, skip today</button>
            </div>
          </section>
        } @else if (responseMessage) {
          <div class="response-banner" [class.success]="responseMessage.includes('confirmed')">
            <ion-icon [name]="responseMessage.includes('Presence') ? 'bus-outline' : 'notifications-outline'"></ion-icon>
            <span>{{ responseMessage }}</span>
          </div>
        }

        <div class="grid-sections">
          <section class="info-section">
            <div class="section-header">
              <h3>Payment Status</h3>
              <a routerLink="/app/profile">Details <ion-icon name="chevron-forward-outline"></ion-icon></a>
            </div>
            <div class="status-card payment" [class.paid]="isPaid">
              <div class="status-icon">
                <ion-icon name="wallet-outline"></ion-icon>
              </div>
              <div class="status-info">
                <h4>{{ isPaid ? 'Valid Access' : 'Payment Required' }}</h4>
                <p>{{ isPaid ? 'Until ' + monthLabel : 'Action needed' }}</p>
              </div>
              <div class="status-amount">15,000 FCFA</div>
            </div>
          </section>

          <section class="info-section">
            <div class="section-header">
              <h3>My Reservation</h3>
              <a routerLink="/app/reservation">Manage <ion-icon name="chevron-forward-outline"></ion-icon></a>
            </div>
            <div class="status-card reservation" [class.reserved]="hasReservation">
              <div class="status-icon">
                <ion-icon name="bus-outline"></ion-icon>
              </div>
              <div class="status-info">
                <h4>{{ hasReservation ? (bus?.plate_number || 'Bus Reserved') : 'No Reservation' }}</h4>
                <p>{{ hasReservation ? (pickup?.name || 'Pickup Point Set') : 'Select your bus' }}</p>
              </div>
              <div class="status-tag">{{ hasReservation ? 'Confirmed' : 'Pending' }}</div>
            </div>
          </section>
        </div>

        <section class="quick-links">
          <button class="link-item" routerLink="/app/qr">
            <div class="link-icon"><ion-icon name="bus-outline"></ion-icon></div>
            <span>QR Pass</span>
          </button>
          <button class="link-item" routerLink="/app/track">
            <div class="link-icon"><ion-icon name="location-outline"></ion-icon></div>
            <span>Track Bus</span>
          </button>
          <button class="link-item" routerLink="/app/profile">
            <div class="link-icon"><ion-icon name="notifications-outline"></ion-icon></div>
            <span>Account</span>
          </button>
        </section>
      </main>
    </ion-content>
  `,
  styles: [`
    .student-dashboard {
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

    .avatar-container {
      position: relative;
    }

    .profile-photo, .avatar-fallback {
      width: 50px;
      height: 50px;
      border-radius: 16px;
      object-fit: cover;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    }

    .avatar-fallback {
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

    .welcome-text .user-name {
      margin: 0;
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
    }

    .notif-btn {
      position: relative;
      width: 44px;
      height: 44px;
      border-radius: 14px;
      background: white;
      border: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #0f172a;
      font-size: 22px;
      cursor: pointer;
    }

    .notif-btn .badge {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 10px;
      height: 10px;
      background: #ef4444;
      border: 2px solid white;
      border-radius: 50%;
    }

    .summary-card {
      position: relative;
      background: #0f172a;
      border-radius: 24px;
      padding: 24px;
      color: white;
      overflow: hidden;
      margin-bottom: 24px;
      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.2);
    }

    .summary-content {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .brand img {
      width: 48px;
      height: 48px;
      background: white;
      padding: 6px;
      border-radius: 14px;
    }

    .brand-text h1 {
      margin: 0;
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 0.5px;
    }

    .brand-text p {
      margin: 2px 0 0;
      font-size: 12px;
      color: #94a3b8;
      font-weight: 600;
    }

    .current-month {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(255,255,255,0.1);
      padding: 8px 16px;
      border-radius: 99px;
      width: fit-content;
      font-size: 14px;
      font-weight: 600;
      backdrop-filter: blur(4px);
    }

    .summary-bg {
      position: absolute;
      top: -20px;
      right: -20px;
      width: 150px;
      height: 150px;
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.1) 100%);
      border-radius: 50%;
      z-index: 1;
    }

    .pickup-alert-card {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 20px;
      padding: 20px;
      margin-bottom: 24px;
      animation: slideIn 0.5s ease-out;
    }

    @keyframes slideIn {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .alert-header {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }

    .icon-circle {
      width: 44px;
      height: 44px;
      background: #3b82f6;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      flex-shrink: 0;
    }

    .pulse {
      box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
      70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
      100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
    }

    .alert-text h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 800;
      color: #1e3a8a;
    }

    .alert-text p {
      margin: 2px 0 0;
      font-size: 13px;
      color: #60a5fa;
      font-weight: 500;
    }

    .alert-question {
      font-size: 14px;
      font-weight: 600;
      color: #1e40af;
      margin: 0 0 16px;
    }

    .alert-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .alert-actions button {
      padding: 12px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-confirm {
      background: #3b82f6;
      color: white;
      border: none;
    }

    .btn-skip {
      background: white;
      color: #64748b;
      border: 1px solid #e2e8f0;
    }

    .response-banner {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 20px;
      border-radius: 16px;
      background: #f1f5f9;
      color: #475569;
      font-weight: 700;
      font-size: 14px;
      margin-bottom: 24px;
    }

    .response-banner.success {
      background: #dcfce7;
      color: #166534;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .section-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
    }

    .section-header a {
      font-size: 13px;
      font-weight: 700;
      color: #3b82f6;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .status-card {
      background: white;
      border-radius: 20px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;
      border: 1px solid #e2e8f0;
    }

    .status-icon {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      color: #64748b;
    }

    .status-info {
      flex: 1;
    }

    .status-info h4 {
      margin: 0;
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
    }

    .status-info p {
      margin: 2px 0 0;
      font-size: 12px;
      color: #94a3b8;
      font-weight: 500;
    }

    .status-amount, .status-tag {
      font-weight: 800;
      font-size: 13px;
    }

    .status-amount {
      color: #ef4444;
    }

    .status-card.paid {
      border-color: #bcf2ce;
      background: #f0fdf4;
    }

    .status-card.paid .status-icon {
      background: #dcfce7;
      color: #22c55e;
    }

    .status-card.paid .status-amount {
      color: #22c55e;
    }

    .status-card.reserved {
      border-color: #bfdbfe;
      background: #eff6ff;
    }

    .status-card.reserved .status-icon {
      background: #dbeafe;
      color: #3b82f6;
    }

    .status-card.reserved .status-tag {
      color: #3b82f6;
      background: white;
      padding: 4px 10px;
      border-radius: 8px;
      border: 1px solid #dbeafe;
    }

    .quick-links {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-top: 8px;
    }

    .link-item {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      padding: 16px 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .link-item:active {
      transform: scale(0.95);
      background: #f8fafc;
    }

    .link-icon {
      width: 40px;
      height: 40px;
      background: #f1f5f9;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      color: #0f172a;
    }

    .link-item span {
      font-size: 12px;
      font-weight: 700;
      color: #475569;
    }
  `]
})
export class StudentDashboardPage implements OnInit {
  data?: BootstrapData;
  profileName = 'Student';
  profileLevel = 'Level';
  profileDepartment = 'Department';
  profilePhoto = '';
  activePickup?: AppNotification;
  responseMessage = '';
  unreadCount = 0;

  monthLabel = new Date().toLocaleString('en', { month: 'long', year: 'numeric' });
  get currentMonthKey() { return new Date().toISOString().slice(0, 7); }

  get reservation() { return this.data?.reservations.find(item => item.month_key === this.currentMonthKey) || this.data?.reservations[0]; }
  get bus() { return this.data?.buses.find(bus => bus.id === this.reservation?.bus_id); }
  get pickup() { return this.data?.pickupPoints.find(point => point.id === this.reservation?.pickup_point_id); }

  get isPaid() {
    const payment = this.data?.payments.find(p => p.month_key === this.currentMonthKey);
    return payment?.status === 'validated';
  }

  get hasReservation() { return !!this.reservation; }

  constructor(private api: ApiService, private offline: OfflineService) {
    addIcons({ notificationsOutline, busOutline, walletOutline, calendarOutline, chevronForwardOutline, locationOutline });
  }

  ngOnInit() {
    this.api.bootstrap().subscribe({
      next: async data => {
        this.applyData(data);
        this.loadPickupNotification();
        await this.offline.cacheBootstrap(data);
      },
      error: async () => {
        const cached = await this.offline.get<BootstrapData | undefined>('bootstrap', undefined);
        if (cached) this.applyData(cached);
      }
    });
  }

  applyData(data: BootstrapData) {
    const stored = JSON.parse(localStorage.getItem('ests_user') || '{}');
    this.data = data;
    this.profileName = data.profile?.full_name || stored.fullName || 'Student';
    this.profileLevel = data.profile?.level_label || 'Student';
    this.profileDepartment = data.profile?.department || 'Transport';
    this.profilePhoto = data.profile?.photo_data_url || stored.photoDataUrl || '';
  }

  loadPickupNotification() {
    this.api.notifications().subscribe(result => {
      this.unreadCount = result.notifications.filter(n => !n.read_at).length;
      this.activePickup = result.notifications.find(note => !!note.round_id && !note.read_at && note.title.toLowerCase().includes('pickup round'));
      if (this.activePickup?.round_id) localStorage.setItem('active_round', this.activePickup.round_id);
    });
  }

  respond(response: 'yes' | 'no') {
    const roundId = this.activePickup?.round_id || localStorage.getItem('active_round');
    if (roundId) {
      this.api.swipe(roundId, response).subscribe(() => {
        this.responseMessage = response === 'yes' ? 'Presence confirmed.' : 'Absence confirmed.';
        this.activePickup = undefined;
        localStorage.removeItem('active_round');
      });
    }
  }

  initials(name = '?') {
    return name.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase();
  }
}
