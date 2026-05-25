import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { AuthService } from '../../../core/auth/auth.service';
import { ApiService } from '../../../core/api/api.service';

interface PickupPoint { id: number; code: string; name: string }

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.page.html',
  styleUrls: ['../login/login.page.scss'],
})
export class RegisterPage implements OnInit {
  full_name = '';
  email = '';
  password = '';
  phone = '';
  student_id = '';
  pickup_point_id?: number;
  role: 'student' | 'driver' = 'student';
  loading = false;
  done = false;
  pickupPoints: PickupPoint[] = [];

  constructor(
    private auth: AuthService,
    private api: ApiService,
    private router: Router,
    private toast: ToastController,
  ) {}

  async ngOnInit() {
    // Pickup points list is fetched only when authenticated, so for unauthenticated registration
    // we keep an empty list; the user can set their pickup point in their profile after first sign-in.
  }

  async submit() {
    if (!this.email || !this.password || !this.full_name) return;
    this.loading = true;
    try {
      await this.auth.register({
        full_name: this.full_name.trim(),
        email: this.email.trim(),
        password: this.password,
        role: this.role,
        phone: this.phone || undefined,
        student_id: this.student_id || undefined,
        pickup_point_id: this.pickup_point_id,
      });
      this.done = true;
    } catch (e: unknown) {
      const msg = this.errorMessage(e) ?? 'Unable to register';
      const t = await this.toast.create({ message: msg, duration: 3000, color: 'danger' });
      await t.present();
    } finally {
      this.loading = false;
    }
  }

  goLogin() {
    this.router.navigate(['/login']);
  }

  private errorMessage(e: unknown): string | undefined {
    if (typeof e === 'object' && e && 'error' in e) {
      const body = (e as { error?: { error?: { message?: string } } }).error;
      return body?.error?.message;
    }
    return undefined;
  }
}
