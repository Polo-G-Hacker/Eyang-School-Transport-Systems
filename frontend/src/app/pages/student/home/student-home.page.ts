import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import * as QRCode from 'qrcode';
import { ApiService } from '../../../core/api/api.service';
import { AuthService, PublicUser } from '../../../core/auth/auth.service';
import { StorageService } from '../../../core/storage/storage.service';
import { environment } from '../../../../environments/environment';

interface Reservation { id: string; bus_id: string; bus_plate?: string; pickup_name?: string; status: string; period_year: number; period_month: number; }
interface Notification { id: string; title: string; body: string; kind: string; created_at: string; read_at: string | null; }
interface PaymentStatus { status: string; period_year: number; period_month: number; amount_fcfa: number; validated_at: string | null; }

const CACHE_KEY = 'ests.cache.student.home';
const QR_CACHE_KEY = 'ests.cache.student.qr';

@Component({
  selector: 'app-student-home',
  standalone: false,
  templateUrl: './student-home.page.html',
  styleUrls: ['./student-home.page.scss'],
})
export class StudentHomePage implements OnInit {
  user: PublicUser | null = null;
  reservation: Reservation | null = null;
  payment: PaymentStatus | null = null;
  qrDataUrl: string | null = null;
  qrPeriod: string | null = null;
  qrExpiresAt: string | null = null;
  qrAvailableOffline = false;
  notifications: Notification[] = [];
  activeRound: { id: string; bus_id: string } | null = null;
  loading = true;
  schoolName = environment.schoolName;
  fee = environment.monthlyFee;

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private storage: StorageService,
    public router: Router,
    private toast: ToastController,
  ) {}

  async ngOnInit() {
    this.user = this.auth.user;
    await this.loadFromCache();
    await this.refresh();
  }

  async ionViewWillEnter() {
    await this.refresh();
  }

  private async loadFromCache() {
    const cached = await this.storage.get<{
      reservation: Reservation | null;
      payment: PaymentStatus | null;
      notifications: Notification[];
    }>(CACHE_KEY);
    if (cached) {
      this.reservation = cached.reservation;
      this.payment = cached.payment;
      this.notifications = cached.notifications ?? [];
    }
    const qr = await this.storage.get<{ token: string; period: string; expires_at: string }>(QR_CACHE_KEY);
    if (qr) {
      this.qrPeriod = qr.period;
      this.qrExpiresAt = qr.expires_at;
      this.qrAvailableOffline = true;
      try {
        this.qrDataUrl = await QRCode.toDataURL(qr.token, { errorCorrectionLevel: 'M', width: 280, margin: 1 });
      } catch { /* ignore */ }
    }
  }

  async refresh() {
    this.loading = true;
    try {
      const [resv, notif] = await Promise.all([
        this.api.get<{ reservation: Reservation | null }>('/reservations/mine').catch(() => ({ reservation: null })),
        this.api.get<{ notifications: Notification[] }>('/notifications').catch(() => ({ notifications: [] })),
      ]);
      this.reservation = resv.reservation;
      this.notifications = notif.notifications.slice(0, 5);

      // student users won't be able to GET /payments (admin only).
      // We'll use a /qr/mine which 200s only when payment is active.
      try {
        const qr = await this.api.get<{ token: string; period: string; expires_at: string; user: { full_name: string; student_id: string | null } }>('/qr/mine');
        this.qrPeriod = qr.period;
        this.qrExpiresAt = qr.expires_at;
        this.payment = { status: 'validated', period_year: 0, period_month: 0, amount_fcfa: this.fee, validated_at: new Date().toISOString() };
        await this.storage.set(QR_CACHE_KEY, { token: qr.token, period: qr.period, expires_at: qr.expires_at });
        this.qrDataUrl = await QRCode.toDataURL(qr.token, { errorCorrectionLevel: 'M', width: 280, margin: 1 });
        this.qrAvailableOffline = true;
      } catch {
        // No active payment, no QR yet.
        this.payment = this.payment ?? null;
      }

      // Look for an in-progress pickup round notification
      const round = this.notifications.find((n) => n.kind === 'pickup_round');
      if (round) {
        const data = (round as unknown as { data?: { round_id?: string; bus_id?: string } }).data;
        if (data?.round_id && data?.bus_id) {
          this.activeRound = { id: data.round_id, bus_id: data.bus_id };
        }
      }
      await this.storage.set(CACHE_KEY, {
        reservation: this.reservation,
        payment: this.payment,
        notifications: this.notifications,
      });
    } finally {
      this.loading = false;
    }
  }

  async respondSwipe(response: 'yes' | 'no') {
    if (!this.activeRound) return;
    try {
      await this.api.post('/swipes', { round_id: this.activeRound.id, response });
      const t = await this.toast.create({
        message: response === 'yes' ? 'Thanks! Driver will know to expect you.' : 'Marked as not attending today.',
        duration: 2000,
        color: response === 'yes' ? 'success' : 'medium',
      });
      await t.present();
      this.activeRound = null;
    } catch {
      const t = await this.toast.create({ message: 'Could not send response', duration: 2000, color: 'danger' });
      await t.present();
    }
  }

  get currentPeriodLabel(): string {
    const d = new Date();
    return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }

  goReservation() {
    this.router.navigate(['/app/student/qr']);
  }

  goTrack() {
    this.router.navigate(['/app/student/track']);
  }
}
