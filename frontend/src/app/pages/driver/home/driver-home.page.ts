import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/api/api.service';
import { AuthService, PublicUser } from '../../../core/auth/auth.service';
import { SyncService } from '../../../core/sync/sync.service';
import { ToastController } from '@ionic/angular';

interface Bus { id: string; plate_number: string; color: string; capacity: number; status: string; reserved_count?: number; boarded_today?: number; }

@Component({
  selector: 'app-driver-home',
  standalone: false,
  templateUrl: './driver-home.page.html',
  styleUrls: ['./driver-home.page.scss'],
})
export class DriverHomePage implements OnInit {
  user: PublicUser | null = null;
  bus: Bus | null = null;
  activeRoundId: string | null = null;
  pendingScans = 0;

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private sync: SyncService,
    private toast: ToastController,
    public router: Router,
  ) {}

  async ngOnInit() {
    this.user = this.auth.user;
    await this.refresh();
  }

  async ionViewWillEnter() {
    await this.refresh();
  }

  async refresh() {
    try {
      const r = await this.api.get<{ bus: Bus | null }>('/buses/mine');
      this.bus = r.bus;
    } catch { this.bus = null; }
    this.pendingScans = await this.sync.queueSize();
  }

  async syncNow() {
    const r = await this.sync.flush();
    const t = await this.toast.create({
      message: r.flushed ? `Synced ${r.flushed} scans` : 'Nothing to sync',
      duration: 1800,
      color: r.flushed ? 'success' : 'medium',
    });
    await t.present();
    await this.refresh();
  }

  async startRound() {
    if (!this.bus) return;
    try {
      const r = await this.api.post<{ round: { id: string } }>('/pickup-rounds/start', { bus_id: this.bus.id });
      this.activeRoundId = r.round.id;
      await this.router.navigate(['/app/driver/round'], { queryParams: { id: r.round.id } });
    } catch (e: unknown) {
      const t = await this.toast.create({ message: this.errorMessage(e) ?? 'Could not start round', duration: 2500, color: 'danger' });
      await t.present();
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
