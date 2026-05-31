import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonButton, IonContent, IonIcon, IonInput, IonItem, IonText } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { eyeOffOutline, eyeOutline } from 'ionicons/icons';
import { ApiService } from '../core/api.service';

@Component({
  standalone: true,
  imports: [FormsModule, IonButton, IonContent, IonIcon, IonInput, IonItem, IonText],
  template: `
    <ion-content>
      <main class="page login">
        <section class="card form">
          <h2>Sign in</h2>
          <p class="muted">Use your school or personal email.</p>
          <ion-item>
            <ion-input label="Email" labelPlacement="stacked" type="email" [(ngModel)]="email" />
          </ion-item>
          <ion-item>
            <ion-input label="Password" labelPlacement="stacked" [type]="showPassword ? 'text' : 'password'" [(ngModel)]="password" />
            <ion-button slot="end" fill="clear" color="medium" (click)="showPassword = !showPassword">
              <ion-icon slot="icon-only" [name]="showPassword ? 'eye-off-outline' : 'eye-outline'" />
            </ion-button>
          </ion-item>
          <ion-button expand="block" class="primary-button" (click)="login()">Continue</ion-button>
          @if (error) { <ion-text color="danger">{{ error }}</ion-text> }
        </section>
      </main>
    </ion-content>
  `,
  styles: [`
    .login { position: relative; display: grid; align-content: center; min-height: 100%; overflow: hidden; }
    .login::before { content: ""; position: absolute; inset: 0; background: linear-gradient(rgba(15, 23, 42, .54), rgba(15, 23, 42, .68)), url('/assets/Eyang_ESTS.png') center/cover no-repeat; }
    .login > * { position: relative; z-index: 1; }
    .form { padding: 22px; background: rgba(255,255,255,.94); border-color: rgba(255,255,255,.7); backdrop-filter: blur(10px); box-shadow: 0 20px 46px rgba(0,0,0,.18); }
    .form h2 { margin: 0 0 4px; font-size: 26px; }
    ion-item { --background: #f2f5fb; --border-color: transparent; --border-radius: 16px; margin: 14px 0; }
    ion-button[slot="end"] { --padding-start: 0; --padding-end: 8px; margin-top: 18px; }
  `]
})
export class LoginPage {
  email = 'student@gmail.com';
  password = 'student123';
  showPassword = false;
  error = '';

  constructor(private api: ApiService, private router: Router) {
    addIcons({ eyeOutline, eyeOffOutline });
  }

  login() {
    this.error = '';
    this.api.login(this.email, this.password).subscribe({
      next: result => {
        localStorage.setItem('ests_token', result.token);
        localStorage.setItem('ests_user', JSON.stringify(result.user));
        const target = result.user.role === 'admin' ? '/app/admin' : result.user.role === 'driver' ? '/app/driver' : '/app/student';
        this.router.navigateByUrl(target);
      },
      error: err => this.error = err.error?.message || 'Login failed'
    });
  }
}
