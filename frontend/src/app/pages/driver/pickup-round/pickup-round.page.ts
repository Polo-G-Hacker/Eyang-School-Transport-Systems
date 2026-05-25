import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { ApiService } from '../../../core/api/api.service';

interface ExpectedRow {
  user_id: string;
  full_name: string;
  student_id: string | null;
  pickup_point_id: number | null;
  pickup_name: string | null;
  response: 'yes' | 'no' | null;
}

@Component({
  selector: 'app-pickup-round',
  standalone: false,
  templateUrl: './pickup-round.page.html',
  styleUrls: ['./pickup-round.page.scss'],
})
export class PickupRoundPage implements OnInit, OnDestroy {
  busId = '';
  roundId: string | null = null;
  expected: ExpectedRow[] = [];
  loading = false;
  private pollTimer?: ReturnType<typeof setInterval>;

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    public router: Router,
    private toast: ToastController,
  ) {}

  async ngOnInit() {
    this.roundId = this.route.snapshot.queryParamMap.get('id');
    try {
      const r = await this.api.get<{ bus: { id: string } | null }>('/buses/mine');
      this.busId = r.bus?.id ?? '';
    } catch { /* ignore */ }
    await this.refresh();
    this.pollTimer = setInterval(() => this.refresh(), 12_000);
  }

  ngOnDestroy() {
    if (this.pollTimer) clearInterval(this.pollTimer);
  }

  async refresh() {
    if (!this.roundId || !this.busId) return;
    this.loading = true;
    try {
      const r = await this.api.get<{ expected: ExpectedRow[] }>(
        `/pickup-rounds/${this.roundId}/expected`,
        { bus_id: this.busId },
      );
      this.expected = r.expected;
    } catch { /* keep prior */ }
    this.loading = false;
  }

  async startRound() {
    if (!this.busId) return;
    try {
      const r = await this.api.post<{ round: { id: string } }>('/pickup-rounds/start', { bus_id: this.busId });
      this.roundId = r.round.id;
      await this.router.navigate([], { queryParams: { id: r.round.id }, queryParamsHandling: 'merge' });
      await this.refresh();
    } catch (e: unknown) {
      const t = await this.toast.create({ message: this.errorMessage(e) ?? 'Could not start round', duration: 2500, color: 'danger' });
      await t.present();
    }
  }

  async endRound() {
    if (!this.roundId) return;
    try {
      await this.api.post(`/pickup-rounds/${this.roundId}/end`, {});
      this.roundId = null;
      this.expected = [];
      const t = await this.toast.create({ message: 'Round ended', duration: 1800, color: 'success' });
      await t.present();
    } catch (e: unknown) {
      const t = await this.toast.create({ message: this.errorMessage(e) ?? 'Could not end round', duration: 2500, color: 'danger' });
      await t.present();
    }
  }

  goScan() {
    if (!this.busId) return;
    this.router.navigate(['/app/driver/scan'], { queryParams: { bus_id: this.busId, round_id: this.roundId } });
  }

  get yesCount(): number {
    return this.expected.filter((e) => e.response === 'yes').length;
  }
  get noCount(): number {
    return this.expected.filter((e) => e.response === 'no').length;
  }
  get pendingCount(): number {
    return this.expected.filter((e) => e.response === null).length;
  }

  private errorMessage(e: unknown): string | undefined {
    if (typeof e === 'object' && e && 'error' in e) {
      const body = (e as { error?: { error?: { message?: string } } }).error;
      return body?.error?.message;
    }
    return undefined;
  }
}
