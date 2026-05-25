import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { Html5Qrcode } from 'html5-qrcode';
import { ToastController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../core/api/api.service';
import { SyncService, OfflineScanEvent } from '../../../core/sync/sync.service';

interface ScanResult { result: 'boarded' | 'denied'; reason?: string; user?: { full_name: string; student_id: string | null } }

@Component({
  selector: 'app-scanner',
  standalone: false,
  templateUrl: './scanner.page.html',
  styleUrls: ['./scanner.page.scss'],
})
export class ScannerPage implements AfterViewInit, OnDestroy {
  scanner: Html5Qrcode | null = null;
  scanning = false;
  manualToken = '';
  lastResult: ScanResult | null = null;
  recent: { name: string; status: 'boarded' | 'denied'; reason?: string; at: string }[] = [];
  busId = '';
  roundId: string | null = null;
  online = navigator.onLine;
  pending = 0;

  constructor(
    private api: ApiService,
    private sync: SyncService,
    private toast: ToastController,
    private route: ActivatedRoute,
  ) {}

  async ngAfterViewInit() {
    this.busId = this.route.snapshot.queryParamMap.get('bus_id') ?? '';
    this.roundId = this.route.snapshot.queryParamMap.get('round_id');
    if (!this.busId) {
      try {
        const r = await this.api.get<{ bus: { id: string } | null }>('/buses/mine');
        this.busId = r.bus?.id ?? '';
      } catch { /* ignore */ }
    }
    window.addEventListener('online', this.onOnline);
    window.addEventListener('offline', this.onOffline);
    await this.refreshPending();
    await this.startScanning();
  }

  ngOnDestroy() {
    this.stopScanning();
    window.removeEventListener('online', this.onOnline);
    window.removeEventListener('offline', this.onOffline);
  }

  private onOnline = async () => { this.online = true; await this.sync.flush(); await this.refreshPending(); };
  private onOffline = () => { this.online = false; };

  async startScanning() {
    if (this.scanning) return;
    this.scanner = new Html5Qrcode('qr-host', { verbose: false });
    try {
      await this.scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (text) => this.handleToken(text),
        () => undefined,
      );
      this.scanning = true;
    } catch (e) {
      const t = await this.toast.create({ message: 'Camera unavailable. Use manual entry.', duration: 2000, color: 'warning' });
      await t.present();
      void e;
    }
  }

  async stopScanning() {
    try {
      if (this.scanner) {
        await this.scanner.stop();
        await this.scanner.clear();
      }
    } catch { /* ignore */ }
    this.scanner = null;
    this.scanning = false;
  }

  async handleManual() {
    if (!this.manualToken) return;
    await this.handleToken(this.manualToken);
    this.manualToken = '';
  }

  private async handleToken(token: string) {
    if (!this.busId) {
      const t = await this.toast.create({ message: 'Assign your bus first', duration: 2000, color: 'warning' });
      await t.present();
      return;
    }
    const event: OfflineScanEvent = {
      client_event_id: this.uuid(),
      qr_token: token,
      bus_id: this.busId,
      pickup_round_id: this.roundId,
      scanned_at: new Date().toISOString(),
    };

    if (navigator.onLine) {
      try {
        const out = await this.api.post<ScanResult>('/boarding/scan', {
          qr_token: event.qr_token,
          bus_id: event.bus_id,
          pickup_round_id: event.pickup_round_id,
          client_event_id: event.client_event_id,
          scanned_at: event.scanned_at,
        });
        this.lastResult = out;
        this.recent = [{
          name: out.user?.full_name ?? 'Unknown',
          status: out.result,
          reason: out.reason,
          at: new Date().toLocaleTimeString(),
        }, ...this.recent].slice(0, 8);
        return;
      } catch {
        // fall through to offline queue
      }
    }
    await this.sync.enqueue(event);
    this.lastResult = { result: 'boarded', reason: 'Saved offline, will sync when online' };
    this.recent = [{ name: 'Pending', status: 'boarded' as const, reason: 'queued offline', at: new Date().toLocaleTimeString() }, ...this.recent].slice(0, 8);
    await this.refreshPending();
  }

  async syncNow() {
    const r = await this.sync.flush();
    const t = await this.toast.create({
      message: r.flushed ? `Synced ${r.flushed} scans` : 'Nothing to sync',
      duration: 1800,
      color: r.flushed ? 'success' : 'medium',
    });
    await t.present();
    await this.refreshPending();
  }

  private async refreshPending() {
    this.pending = await this.sync.queueSize();
  }

  private uuid(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'scan-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }
}
