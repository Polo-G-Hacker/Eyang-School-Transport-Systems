import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonText,
  IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  checkmarkCircleOutline,
  alertCircleOutline,
  mailOutline
} from 'ionicons/icons';
import { ApiService } from '../core/api.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonButton,
    IonContent,
    IonIcon,
    IonText,
    IonSpinner
  ],
  template: `
    <ion-content scrollY="true" class="auth-content">
      <main class="auth-page auth-page--login">
        <div class="auth-bg" aria-hidden="true"></div>
        <section class="auth-shell">
          <div class="auth-card">
            <div class="card-heading">
              <span class="heading-icon" [class.heading-icon--blue]="loading" [class.heading-icon--green]="successMessage" [class.heading-icon--red]="error">
                <ion-icon [name]="loading ? 'mail-outline' : (successMessage ? 'checkmark-circle-outline' : 'alert-circle-outline')" aria-hidden="true"></ion-icon>
              </span>
              <div>
                <h2>Email Verification</h2>
                <p>{{ loading ? 'Verifying your email...' : (successMessage ? 'Verification Successful' : 'Verification Failed') }}</p>
              </div>
            </div>

            <div style="text-align: center; padding: 20px 0;">
              @if (loading) {
                <ion-spinner name="crescent" color="primary"></ion-spinner>
              }

              @if (error) {
                <ion-text color="danger">
                  <p>{{ error }}</p>
                </ion-text>
              }

              @if (successMessage) {
                <ion-text color="success">
                  <p>{{ successMessage }}</p>
                </ion-text>
              }
            </div>

            <ion-button expand="block" class="submit-button submit-button--blue" routerLink="/login">
              Go to Login
            </ion-button>
          </div>
        </section>
      </main>
    </ion-content>
  `,
  styleUrls: ['./login.page.scss']
})
export class VerifyEmailPage implements OnInit {
  loading = true;
  error = '';
  successMessage = '';

  constructor(
    private api: ApiService, 
    private route: ActivatedRoute
  ) {
    addIcons({
      checkmarkCircleOutline,
      alertCircleOutline,
      mailOutline
    });
  }

  ngOnInit() {
    const token = this.route.snapshot.queryParams['token'];
    if (!token) {
      this.loading = false;
      this.error = 'Invalid or missing verification token.';
      return;
    }

    this.api.verifyEmail(token).subscribe({
      next: res => {
        this.loading = false;
        this.successMessage = res.message;
      },
      error: err => {
        this.loading = false;
        this.error = err.error?.message || 'Failed to verify email. The link may have expired.';
      }
    });
  }
}
