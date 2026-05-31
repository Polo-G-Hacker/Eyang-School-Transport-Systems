import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { notificationsOutline } from 'ionicons/icons';
import { ApiService, AppNotification, BootstrapData } from '../core/api.service';
import { OfflineService } from '../core/offline.service';

@Component({
  standalone: true,
  imports: [IonContent, IonButton, IonIcon, RouterLink],
  template: `
    <ion-content>
      <main class="page">
        <header class="topbar">
          <div class="student-head">
            @if (profilePhoto) {
              <img class="profile-photo" [src]="profilePhoto" alt="Profile photo">
            } @else {
              <div class="avatar">{{ initials(profileName) }}</div>
            }
            <div><p class="muted">Welcome back</p><h2>{{ profileName }}</h2></div>
          </div>
          <a class="icon-pill" routerLink="/app/notifications" aria-label="Notifications"><ion-icon name="notifications-outline" /></a>
        </header>

        <section class="home-section transport-section">
        <div class="headline">
          <div class="brand-title"><img class="school-logo" src="assets/st jean logo.png" alt="Saint Jean Ingenieur logo"><div><h1 class="title">My Transport</h1><p class="muted">{{ profileLevel }} - {{ profileDepartment }} - {{ monthLabel }}</p></div></div>
          <span class="status">Active</span>
        </div>

        @if (activePickup) {
        <section class="card pickup-alert">
          <div><h3>{{ activePickup.title }}</h3><p class="muted">{{ activePickup.body }}</p></div>
          <p class="question">Will you be at your pickup point today?</p>
          <div class="actions">
            <ion-button class="primary-button" (click)="respond('yes')">Yes, I'll be there</ion-button>
            <ion-button class="ghost-button" (click)="respond('no')">No, skip today</ion-button>
          </div>
          @if (responseMessage) { <p class="response">{{ responseMessage }}</p> }
        </section>
        }
        @if (!activePickup && responseMessage) { <div class="confirmation">{{ responseMessage }}</div> }
        </section>

        <section class="home-section">
        <h2 class="section-title">Payment</h2>
        <section class="card payment"><div><h3>Payment Active</h3><p>Valid until end of {{ monthLabel }}</p></div><strong>15,000 FCFA</strong></section>
        </section>

        <section class="home-section">
        <h2 class="section-title">My Reservation</h2>
        <section class="card reservation"><strong>Confirmed</strong><span>{{ monthLabel }}</span><p>Bus {{ bus?.plate_number || 'Not selected' }}</p><p>{{ pickup?.name || 'Pickup point' }} to Eyang</p></section>
        </section>
      </main>
    </ion-content>
  `,
  styles: [`
    h2,p { margin: 0; }
    .topbar{margin-bottom:30px}
    .home-section{margin-top:30px}
    .transport-section{margin-top:0}
    .headline{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:18px}
    .brand-title{display:flex;align-items:center;gap:12px}.school-logo{width:44px;height:44px;border-radius:13px;object-fit:contain;background:#fff;padding:5px;box-shadow:0 8px 18px rgba(18,28,45,.08)}
    .student-head{display:flex;gap:12px;align-items:center}.student-head h2{margin:0;font-size:18px}.profile-photo{width:46px;height:46px;border-radius:14px;object-fit:cover}
    a.icon-pill{text-decoration:none}
    .pickup-alert{padding:18px;border:2px solid #5f84ff;display:grid;grid-template-columns:1fr;gap:12px;margin-top:0}
    .question{grid-column:1/-1;color:#8b98ad;margin-top:8px}.actions{grid-column:1/-1;display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .response{grid-column:1/-1;color:#18a650;font-weight:800}
    .confirmation{border-radius:18px;background:#d9f9e5;color:#18a650;border:1px solid #24c564;padding:14px 16px;font-weight:850}
    .section-title{margin:0 0 14px}
    .payment{padding:18px;display:flex;gap:14px;align-items:center;justify-content:space-between;background:#dcfae6;border-color:#24c564}.payment h3{margin:0;color:#18a650}.payment strong{color:#18a650;text-align:right}
    .reservation{padding:20px;background:#dcfae6;border-color:#24c564}.reservation span{float:right;color:#8b98ad}.reservation strong{color:#18a650}
  `]
})
export class StudentDashboardPage implements OnInit {
  data?: BootstrapData;
  profileName = 'Student';
  profileLevel = 'Student';
  profileDepartment = 'Transport';
  profilePhoto = '';
  activePickup?: AppNotification;
  responseMessage = '';
  monthLabel = new Date().toLocaleString('en', { month: 'long', year: 'numeric' });
  get currentMonthKey() { return new Date().toISOString().slice(0, 7); }
  get reservation() { return this.data?.reservations.find(item => item.month_key === this.currentMonthKey) || this.data?.reservations[0]; }
  get bus() { return this.data?.buses.find(bus => bus.id === this.reservation?.bus_id); }
  get pickup() { return this.data?.pickupPoints.find(point => point.id === this.reservation?.pickup_point_id); }

  constructor(private api: ApiService, private offline: OfflineService) {
    addIcons({ notificationsOutline });
  }

  ngOnInit() {
    this.api.bootstrap().subscribe({
      next: async data => { this.applyData(data); this.loadPickupNotification(); await this.offline.cacheBootstrap(data); },
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
