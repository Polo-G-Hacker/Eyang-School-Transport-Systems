import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import * as QRCode from 'qrcode';
import { ApiService } from '../../../core/api/api.service';
import { AuthService, PublicUser } from '../../../core/auth/auth.service';
import { StorageService } from '../../../core/storage/storage.service';

const QR_CACHE_KEY = 'ests.cache.student.qr';
const PICKUP_CACHE = 'ests.cache.pickup_points';
const BUSES_CACHE  = 'ests.cache.buses';

interface PickupPoint { id: number; name: string; code: string; }
interface Bus { id: string; plate_number: string; color: string; capacity: number; reserved_count?: number }

@Component({
  selector: 'app-qr-pass',
  standalone: false,
  templateUrl: './qr-pass.page.html',
  styleUrls: ['./qr-pass.page.scss'],
})
export class QrPassPage implements OnInit {
  user: PublicUser | null = null;
  qrDataUrl: string | null = null;
  period: string | null = null;
  expiresAt: string | null = null;
  availableOffline = false;

  reservation: { id: string; bus_plate?: string; pickup_name?: string } | null = null;
  pickupPoints: PickupPoint[] = [];
  buses: Bus[] = [];
  reserving = false;
  selectedBus: string | null = null;
  selectedPickup: number | null = null;

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private storage: StorageService,
    private toast: ToastController,
  ) {}

  async ngOnInit() {
    this.user = this.auth.user;
    await this.loadCache();
    await this.refresh();
  }

  private async loadCache() {
    const qr = await this.storage.get<{ token: string; period: string; expires_at: string }>(QR_CACHE_KEY);
    if (qr) {
      this.period = qr.period;
      this.expiresAt = qr.expires_at;
      this.availableOffline = true;
      try {
        this.qrDataUrl = await QRCode.toDataURL(qr.token, { errorCorrectionLevel: 'H', width: 320, margin: 1 });
      } catch { /* ignore */ }
    }
    const pickup = await this.storage.get<PickupPoint[]>(PICKUP_CACHE);
    if (pickup) this.pickupPoints = pickup;
    const buses = await this.storage.get<Bus[]>(BUSES_CACHE);
    if (buses) this.buses = buses;
  }

  async refresh() {
    try {
      const [qr, resv, pickup, buses] = await Promise.all([
        this.api.get<{ token: string; period: string; expires_at: string }>('/qr/mine').catch(() => null),
        this.api.get<{ reservation: { id: string; bus_plate?: string; pickup_name?: string } | null }>('/reservations/mine').catch(() => ({ reservation: null })),
        this.api.get<{ pickup_points: PickupPoint[] }>('/pickup-points').catch(() => ({ pickup_points: [] })),
        this.api.get<{ buses: Bus[] }>('/buses').catch(() => ({ buses: [] })),
      ]);
      if (qr) {
        this.period = qr.period;
        this.expiresAt = qr.expires_at;
        this.availableOffline = true;
        await this.storage.set(QR_CACHE_KEY, qr);
        this.qrDataUrl = await QRCode.toDataURL(qr.token, { errorCorrectionLevel: 'H', width: 320, margin: 1 });
      }
      this.reservation = resv.reservation;
      this.pickupPoints = pickup.pickup_points.filter(p => p.code !== 'EYANG');
      await this.storage.set(PICKUP_CACHE, this.pickupPoints);
      this.buses = buses.buses;
      await this.storage.set(BUSES_CACHE, this.buses);
    } catch {/* offline-safe */}
  }

  async reserve() {
    if (!this.selectedBus || !this.selectedPickup) return;
    this.reserving = true;
    try {
      await this.api.post('/reservations', { bus_id: this.selectedBus, pickup_point_id: this.selectedPickup });
      const t = await this.toast.create({ message: 'Reservation confirmed', duration: 1800, color: 'success' });
      await t.present();
      await this.refresh();
    } catch (e: unknown) {
      const msg = this.errorMessage(e) ?? 'Could not reserve';
      const t = await this.toast.create({ message: msg, duration: 2500, color: 'danger' });
      await t.present();
    } finally {
      this.reserving = false;
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
