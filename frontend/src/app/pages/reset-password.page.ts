import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  IonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  eyeOffOutline,
  eyeOutline,
  lockClosedOutline,
  shieldCheckmarkOutline
} from 'ionicons/icons';
import { ApiService } from '../core/api.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    IonButton,
    IonContent,
    IonIcon,
    IonInput,
    IonItem,
    IonText
  ],
  template: `
    <ion-content scrollY="true" class="auth-content">
      <main class="auth-page auth-page--login">
        <div class="auth-bg" aria-hidden="true"></div>
        <section class="auth-shell">
          <form class="auth-card" [formGroup]="resetForm" (ngSubmit)="resetPassword()" novalidate>
            <div class="card-heading">
              <span class="heading-icon heading-icon--blue">
                <ion-icon name="lock-closed-outline" aria-hidden="true"></ion-icon>
              </span>
              <div>
                <h2>Reset Password</h2>
                <p>Enter your new password below</p>
              </div>
            </div>

            <div class="field-group">
              <label for="new-password">New Password</label>
              <ion-item lines="none" class="auth-input">
                <ion-icon name="lock-closed-outline" slot="start" aria-hidden="true"></ion-icon>
                <ion-input id="new-password" [type]="showPassword ? 'text' : 'password'" placeholder="Enter new password" formControlName="password" aria-label="New Password"></ion-input>
                <ion-button type="button" fill="clear" class="icon-action" slot="end" (click)="showPassword = !showPassword">
                  <ion-icon slot="icon-only" [name]="showPassword ? 'eye-off-outline' : 'eye-outline'"></ion-icon>
                </ion-button>
              </ion-item>
            </div>

            @if (error) {
              <ion-text color="danger" class="feedback">{{ error }}</ion-text>
            }
            @if (successMessage) {
              <ion-text color="success" class="feedback">{{ successMessage }}</ion-text>
            }

            <ion-button type="submit" expand="block" class="submit-button submit-button--blue" [disabled]="loading || successMessage">
              {{ loading ? 'Resetting...' : 'Reset Password' }}
            </ion-button>

            <p class="switch-copy">
              Back to <a routerLink="/login">Login</a>
            </p>
          </form>
        </section>
      </main>
    </ion-content>
  `,
  styleUrls: ['./login.page.scss']
})
export class ResetPasswordPage implements OnInit {
  showPassword = false;
  loading = false;
  error = '';
  successMessage = '';
  token = '';

  readonly resetForm = this.fb.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  constructor(
    private fb: FormBuilder, 
    private api: ApiService, 
    private router: Router,
    private route: ActivatedRoute
  ) {
    addIcons({
      eyeOffOutline,
      eyeOutline,
      lockClosedOutline,
      shieldCheckmarkOutline
    });
  }

  ngOnInit() {
    this.token = this.route.snapshot.queryParams['token'] || '';
    if (!this.token) {
      this.error = 'Invalid or missing reset token.';
    }
  }

  resetPassword() {
    if (this.resetForm.invalid) {
      this.error = 'Password must be at least 8 characters long.';
      return;
    }

    if (!this.token) {
      this.error = 'Cannot reset password without a valid token.';
      return;
    }

    this.error = '';
    this.loading = true;
    const { password } = this.resetForm.getRawValue();

    this.api.resetPassword({ token: this.token, password }).subscribe({
      next: res => {
        this.loading = false;
        this.successMessage = res.message + ' Redirecting to login...';
        setTimeout(() => this.router.navigateByUrl('/login'), 3000);
      },
      error: err => {
        this.loading = false;
        this.error = err.error?.message || 'Failed to reset password.';
      }
    });
  }
}
