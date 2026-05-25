import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  email = '';
  password = '';
  loading = false;
  schoolName = environment.schoolName;
  appName = environment.appName;

  constructor(private auth: AuthService, private router: Router, private toast: ToastController) {}

  async submit() {
    if (!this.email || !this.password) return;
    this.loading = true;
    try {
      const user = await this.auth.login(this.email.trim(), this.password);
      await this.router.navigate([`/app/${user.role}/home`]);
    } catch (e: unknown) {
      const msg = this.errorMessage(e) ?? 'Unable to sign in';
      const t = await this.toast.create({ message: msg, duration: 3000, color: 'danger', position: 'bottom' });
      await t.present();
    } finally {
      this.loading = false;
    }
  }

  private errorMessage(e: unknown): string | undefined {
    if (typeof e === 'object' && e && 'error' in e) {
      const body = (e as { error?: { error?: { message?: string } } }).error;
      return body?.error?.message;
    }
    return undefined;
  }
}
