import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonButton, IonContent, IonInput, IonItem, IonText } from '@ionic/angular/standalone';
import { AdminProfile, ApiService } from '../core/api.service';

@Component({
  standalone: true,
  imports: [FormsModule, IonContent, IonButton, IonInput, IonItem, IonText],
  template: `
    <ion-content>
      <main class="page">
        <header class="topbar">
          <div><p class="muted">Admin only</p><h1 class="title">My Account</h1></div>
          @if (photoPreview || photoDataUrl) {
            <img class="profile-photo" [src]="photoPreview || photoDataUrl" alt="Admin photo">
          } @else {
            <div class="avatar">AD</div>
          }
        </header>

        <section class="card form">
          <div class="photo-row">
            <div><h2>Admin Profile</h2><p class="muted">Update your details, email, and security.</p></div>
            <label class="photo-button">Upload photo<input type="file" accept="image/*" (change)="onPhotoSelected($event)"></label>
          </div>
          <ion-item><ion-input label="Full Name" labelPlacement="stacked" [(ngModel)]="fullName" /></ion-item>
          <ion-item><ion-input label="Email Address" labelPlacement="stacked" type="email" [(ngModel)]="email" /></ion-item>
          <ion-item><ion-input label="New Password" labelPlacement="stacked" type="password" placeholder="Leave blank to keep current" [(ngModel)]="password" /></ion-item>
          
          <ion-button expand="block" class="primary-button" (click)="save()">Save Changes</ion-button>
          @if (message) { <ion-text [color]="message.includes('updated') ? 'success' : 'danger'">{{ message }}</ion-text> }
        </section>

        <section class="card info-card">
          <p class="muted">Changes to your email will take effect immediately. Ensure you have access to the new email address.</p>
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
    .info-card{padding:16px;background:rgba(33,91,230,0.05);border:none}
  `]
})
export class AdminProfilePage implements OnInit {
  fullName = '';
  email = '';
  password = '';
  photoDataUrl = '';
  photoPreview = '';
  message = '';

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.api.adminDashboard().subscribe(data => {
      this.setProfile(data.profile);
    });
  }

  setProfile(profile: AdminProfile) {
    this.fullName = profile.full_name || '';
    this.email = profile.email || '';
    this.photoDataUrl = profile.photo_data_url || '';
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
    if (!this.fullName.trim() || !this.email.trim()) {
      this.message = 'Name and email are required.';
      return;
    }
    this.api.updateAdminProfile({
      fullName: this.fullName,
      email: this.email,
      password: this.password,
      photoDataUrl: this.photoPreview
    }).subscribe({
      next: profile => {
        this.message = 'Profile updated.';
        this.password = '';
        this.photoDataUrl = profile.photo_data_url || this.photoDataUrl;
        const stored = JSON.parse(localStorage.getItem('ests_user') || '{}');
        stored.fullName = profile.full_name;
        stored.email = profile.email;
        stored.photoDataUrl = profile.photo_data_url;
        localStorage.setItem('ests_user', JSON.stringify(stored));
      },
      error: err => this.message = err.error?.message || 'Could not update profile.'
    });
  }
}
