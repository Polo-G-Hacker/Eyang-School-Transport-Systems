import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
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
  busOutline,
  eyeOffOutline,
  eyeOutline,
  lockClosedOutline,
  locationOutline,
  mailOutline,
  personAddOutline,
  personOutline,
  qrCodeOutline,
  schoolOutline,
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
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss']
})
export class SignupPage {
  showPassword = false;
  showConfirmPassword = false;
  loading = false;
  error = '';

  readonly signupForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    role: ['student' as 'student' | 'driver', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: this.passwordsMatch });

  constructor(private fb: FormBuilder, private api: ApiService, private router: Router) {
    addIcons({
      busOutline,
      eyeOffOutline,
      eyeOutline,
      lockClosedOutline,
      locationOutline,
      mailOutline,
      personAddOutline,
      personOutline,
      qrCodeOutline,
      schoolOutline,
      shieldCheckmarkOutline
    });
  }

  selectRole(role: 'student' | 'driver') {
    this.signupForm.controls.role.setValue(role);
  }

  register() {
    this.signupForm.markAllAsTouched();
    if (this.signupForm.invalid) {
      this.error = this.signupForm.hasError('passwordMismatch')
        ? 'Passwords do not match.'
        : 'Please complete all fields correctly.';
      return;
    }

    this.error = '';
    this.loading = true;
    const { fullName, email, password, role } = this.signupForm.getRawValue();

    this.api.register({ fullName, email, password, role }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigateByUrl('/login');
      },
      error: err => {
        this.loading = false;
        this.error = err.error?.message || 'Registration failed. Please try again.';
      }
    });
  }

  private passwordsMatch(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    return password && confirmPassword && password !== confirmPassword ? { passwordMismatch: true } : null;
  }
}
