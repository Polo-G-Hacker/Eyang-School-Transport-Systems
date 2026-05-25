import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: false,
  templateUrl: './verify-email.page.html',
  styleUrls: ['../login/login.page.scss'],
})
export class VerifyEmailPage implements OnInit {
  status: 'idle' | 'loading' | 'success' | 'error' = 'idle';
  token = '';
  message = '';
  email = '';
  resending = false;

  constructor(private route: ActivatedRoute, private auth: AuthService, private router: Router) {}

  async ngOnInit() {
    this.token = (this.route.snapshot.queryParamMap.get('token') ?? '').trim();
    if (this.token) await this.run();
  }

  async run() {
    this.status = 'loading';
    try {
      await this.auth.verifyEmail(this.token);
      this.status = 'success';
      this.message = 'Your email has been verified.';
    } catch (e: unknown) {
      this.status = 'error';
      this.message = this.errorMessage(e) ?? 'Verification failed';
    }
  }

  async resend() {
    if (!this.email) return;
    this.resending = true;
    try {
      await this.auth.resendVerification(this.email.trim());
      this.message = 'If the email exists, a new link was sent.';
    } finally {
      this.resending = false;
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
