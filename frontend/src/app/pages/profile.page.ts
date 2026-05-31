import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonButton, IonContent, IonInput, IonItem, IonText } from '@ionic/angular/standalone';
import { ApiService, BootstrapData } from '../core/api.service';
import { OfflineService } from '../core/offline.service';

@Component({
  standalone: true,
  imports: [FormsModule, IonContent, IonButton, IonInput, IonItem, IonText],
  template: `
    <ion-content>
      <main class="page">
        <header class="topbar">
          <div><p class="muted">Account</p><h1 class="title">Profile</h1></div>
          @if (photoPreview || photoDataUrl) {
            <img class="profile-photo" [src]="photoPreview || photoDataUrl" alt="Profile photo">
          } @else {
            <div class="avatar">{{ initials(fullName) }}</div>
          }
        </header>

        <section class="card form">
          <div class="photo-row">
            <div><h2>Personal Details</h2><p class="muted">Update your name, password, and photo.</p></div>
            <label class="photo-button">Upload photo<input type="file" accept="image/*" (change)="onPhotoSelected($event)"></label>
          </div>
          <ion-item><ion-input label="Name" labelPlacement="stacked" [(ngModel)]="fullName" /></ion-item>
          <ion-item><ion-input label="Email" labelPlacement="stacked" [value]="email" [readonly]="true" /></ion-item>
          <ion-item><ion-input label="Matricule" labelPlacement="stacked" [value]="matricule" [readonly]="true" /></ion-item>
          <ion-item><ion-input label="New password" labelPlacement="stacked" type="password" placeholder="Leave blank to keep current password" [(ngModel)]="password" /></ion-item>
          <ion-button expand="block" class="primary-button" (click)="save()">Save Profile</ion-button>
          @if (message) { <ion-text>{{ message }}</ion-text> }
        </section>
      </main>
    </ion-content>
  `,
  styles: [`
    .profile-photo{width:48px;height:48px;border-radius:14px;object-fit:cover}
    .form{padding:18px}.form h2{margin:0}.form p{margin:4px 0 0}
    .photo-row{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:12px}
    .photo-button{position:relative;display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 14px;border-radius:14px;background:#edf1f7;color:#215be6;font-weight:800;font-size:13px;white-space:nowrap}
    .photo-button input{position:absolute;inset:0;opacity:0}
    ion-item{--background:#f2f5fb;--border-radius:16px;margin:12px 0}
  `]
})
export class ProfilePage implements OnInit {
  fullName = '';
  email = '';
  matricule = '';
  password = '';
  photoDataUrl = '';
  photoPreview = '';
  message = '';

  constructor(private api: ApiService, private offline: OfflineService) {}

  ngOnInit() {
    this.api.bootstrap().subscribe({
      next: async data => { await this.offline.cacheBootstrap(data); this.setProfile(data); },
      error: async () => {
        const cached = await this.offline.get<BootstrapData | undefined>('bootstrap', undefined);
        if (cached) this.setProfile(cached);
      }
    });
  }

  setProfile(data: BootstrapData) {
    this.fullName = data.profile?.full_name || '';
    this.email = data.profile?.email || '';
    this.matricule = data.profile?.matricule || '';
    this.photoDataUrl = data.profile?.photo_data_url || '';
  }

  onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => this.photoPreview = String(reader.result || '');
    reader.readAsDataURL(file);
  }

  save() {
    this.message = '';
    if (!this.fullName.trim()) {
      this.message = 'Please enter your name.';
      return;
    }
    this.api.updateProfile({ fullName: this.fullName, password: this.password, photoDataUrl: this.photoPreview }).subscribe({
      next: profile => {
        this.message = 'Profile updated.';
        this.password = '';
        this.photoDataUrl = profile.photo_data_url || this.photoDataUrl;
        const stored = JSON.parse(localStorage.getItem('ests_user') || '{}');
        stored.fullName = profile.full_name;
        stored.photoDataUrl = profile.photo_data_url;
        localStorage.setItem('ests_user', JSON.stringify(stored));
      },
      error: err => this.message = err.error?.message || 'Could not update profile.'
    });
  }

  initials(name = '?') {
    return name.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase();
  }
}
