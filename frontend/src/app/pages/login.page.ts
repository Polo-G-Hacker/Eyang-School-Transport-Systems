import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonButton,
  IonCheckbox,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  IonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  busOutline,
  eyeOffOutline,
  eyeOutline,
  lockClosedOutline,
  logInOutline,
  mailOutline,
  qrCodeOutline,
  shieldCheckmarkOutline,
  locationOutline
} from 'ionicons/icons';
import { ApiService } from '../core/api.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    IonButton,
    IonCheckbox,
    IonContent,
    IonIcon,
    IonInput,
    IonItem,
    IonText
  ],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss']
})
export class LoginPage {
  showPassword = false;
  loading = false;
  error = '';
  successMessage = '';

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    remember: [true]
  });

  constructor(private fb: FormBuilder, private api: ApiService, private router: Router) {
    addIcons({
      busOutline,
      eyeOffOutline,
      eyeOutline,
      lockClosedOutline,
      logInOutline,
      mailOutline,
      qrCodeOutline,
      shieldCheckmarkOutline,
      locationOutline
    });
  }

  login() {
    this.loginForm.markAllAsTouched();
    if (this.loginForm.invalid) {
      this.error = 'Please enter a valid email and password.';
      return;
    }

    this.error = '';
    this.successMessage = '';
    this.loading = true;
    const { email, password } = this.loginForm.getRawValue();

    this.api.login(email, password).subscribe({
      next: result => {
        this.loading = false;
        localStorage.setItem('ests_token', result.token);
        localStorage.setItem('ests_user', JSON.stringify(result.user));
        const target = result.user.role === 'admin' ? '/app/admin' : result.user.role === 'driver' ? '/app/driver' : '/app/student';
        this.router.navigateByUrl(target);
      },
      error: err => {
        this.loading = false;
        this.error = err.error?.message || 'Login failed. Please check your credentials.';
      }
    });
  }

  forgotPassword() {
    const email = this.loginForm.controls.email.value;
    if (!email || this.loginForm.controls.email.invalid) {
      this.error = 'Please enter your email address to reset your password.';
      return;
    }

    this.error = '';
    this.successMessage = '';
    this.loading = true;

    this.api.forgotPassword(email).subscribe({
      next: res => {
        this.loading = false;
        this.successMessage = res.message;
      },
      error: err => {
        this.loading = false;
        this.error = err.error?.message || 'Failed to send reset link.';
      }
    });
  }
}
