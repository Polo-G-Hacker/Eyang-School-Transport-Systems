import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent, IonIcon, IonInput, IonItem, IonText } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { busOutline, cardOutline, checkmarkCircleOutline, peopleOutline } from 'ionicons/icons';
import { AdminDashboard, ApiService } from '../core/api.service';

@Component({
  standalone: true,
  imports: [FormsModule, IonContent, IonButton, IonIcon, IonInput, IonItem, IonText, RouterLink],
  template: `
    <ion-content>
      <main class="page">
        <header class="topbar">
          <div class="admin-brand"><img class="school-logo" src="assets/st jean logo.png" alt="Saint Jean Ingenieur logo"><div><p class="muted">Saint Jean Ingenieur</p><h1 class="title">Admin Panel</h1></div></div>
          <a routerLink="/app/admin-profile">
            @if (photoPreview || data?.profile?.photo_data_url) {
              <img class="profile-photo" [src]="photoPreview || data?.profile?.photo_data_url" alt="Admin photo">
            } @else {
              <div class="avatar">AD</div>
            }
          </a>
        </header>

        <div class="headline">
          <div><h1 class="title">Good morning, {{ profileName || 'Admin' }}</h1><p class="muted">{{ monthLabel }} - Active period</p></div>
        </div>

        <h2 class="section-title">Overview</h2>
        <section class="metric-grid">
          <div class="metric soft-blue"><ion-icon name="people-outline" /><strong>{{ data?.students || 0 }}</strong><span>Students</span><small>Registered</small></div>
          <div class="metric soft-green"><ion-icon name="checkmark-circle-outline" /><strong>{{ data?.active || 0 }}</strong><span>Active</span><small>Paid this month</small></div>
          <div class="metric soft-yellow"><ion-icon name="card-outline" /><strong>{{ data?.pending || 0 }}</strong><span>Pending Pay.</span><small>Needs validation</small></div>
          <div class="metric soft-blue"><ion-icon name="bus-outline" /><strong>{{ assignedBuses.length }}</strong><span>Buses</span><small>{{ unassignedBuses.length }} unassigned</small></div>
        </section>

        <h2 class="section-title">Quick Actions</h2>
        <div class="quick">
          <ion-button routerLink="/app/students" class="primary-button"><ion-icon name="people-outline" />Add Student</ion-button>
          <ion-button routerLink="/app/payments" class="ghost-button"><ion-icon name="card-outline" />Validate Payment</ion-button>
          <ion-button routerLink="/app/drivers" class="ghost-button"><ion-icon name="bus-outline" />Add Driver</ion-button>
        </div>

        <h2 class="section-title">Assigned Buses</h2>
        <section class="card list-card">
          @for (bus of assignedBuses; track bus.id) {
            <div class="row"><div class="icon-pill"><ion-icon name="bus-outline" /></div><div class="row-main"><h3>{{ bus.plate_number }}</h3><p>{{ bus.driver_name }} - {{ bus.pickup_point || 'No pickup assigned' }} - capacity {{ bus.capacity }}</p></div></div>
          }
        </section>

        @if (unassignedBuses.length) {
          <h2 class="section-title">Unassigned Buses</h2>
          <section class="card list-card">
            @for (bus of unassignedBuses; track bus.id) {
              <div class="row"><div class="icon-pill"><ion-icon name="bus-outline" /></div><div class="row-main"><h3>{{ bus.plate_number }}</h3><p>{{ bus.color }} - {{ bus.pickup_point || 'No pickup assigned' }} - capacity {{ bus.capacity }}</p></div><span class="tag pending">No driver</span></div>
            }
          </section>
        }

        <h2 class="section-title">Pickup Points</h2>
        <section class="card list-card">
          @for (point of data?.pickupPoints || []; track point.id) {
            <div class="row"><div class="icon-pill">P</div><div class="row-main"><h3>{{ point.name }}</h3><p>{{ point.latitude }}, {{ point.longitude }}</p></div></div>
          }
        </section>
      </main>
    </ion-content>
  `,
  styles: [`
    .headline{display:flex;justify-content:space-between;gap:12px}
    .admin-brand{display:flex;align-items:center;gap:12px}.school-logo{width:48px;height:48px;border-radius:14px;object-fit:contain;background:#fff;padding:5px;box-shadow:0 8px 18px rgba(18,28,45,.08)}
    .profile-photo{width:48px;height:48px;border-radius:14px;object-fit:cover}
    .profile-card{padding:18px;margin-top:18px}
    .profile-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
    .profile-head h2{margin:0}.profile-head p{margin:4px 0 0}
    .photo-button{position:relative;display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 14px;border-radius:14px;background:#edf1f7;color:#215be6;font-weight:800;font-size:13px;white-space:nowrap}
    .photo-button input{position:absolute;inset:0;opacity:0}
    ion-item{--background:#f2f5fb;--border-radius:16px;margin:12px 0}
    .quick{display:grid;grid-template-columns:1fr;gap:12px}.quick ion-button{height:64px}.quick ion-icon{margin-right:8px}
    .metric{display:flex;flex-direction:column;gap:7px}
    .metric ion-icon{font-size:28px;color:#215be6}.metric span,.metric small{display:block;line-height:1.25}
  `]
})
export class AdminDashboardPage implements OnInit {
  data?: AdminDashboard;
  profileName = '';
  photoPreview = '';
  monthLabel = new Date().toLocaleString('en', { month: 'long', year: 'numeric' });
  get assignedBuses() { return (this.data?.buses || []).filter(bus => !!bus.driver_id); }
  get unassignedBuses() { return (this.data?.buses || []).filter(bus => !bus.driver_id); }

  constructor(private api: ApiService) {
    addIcons({ peopleOutline, checkmarkCircleOutline, cardOutline, busOutline });
  }

  ngOnInit() {
    this.load();
  }

  load() {
    this.api.adminDashboard().subscribe(data => {
      this.data = data;
      this.profileName = data.profile?.full_name || 'Admin';
    });
  }
}
