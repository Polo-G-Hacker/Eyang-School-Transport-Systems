import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { ApiService, BootstrapData, QrPass } from './api.service';

@Injectable({ providedIn: 'root' })
export class OfflineService {
  constructor(private api: ApiService) {}

  async set<T>(key: string, value: T) {
    await Preferences.set({ key, value: JSON.stringify(value) });
  }

  async get<T>(key: string, fallback: T): Promise<T> {
    const stored = await Preferences.get({ key });
    return stored.value ? JSON.parse(stored.value) as T : fallback;
  }

  async cacheBootstrap(data: BootstrapData) {
    await this.set('bootstrap', data);
  }

  async cacheQr(pass: QrPass) {
    await this.set(`qr:${pass.monthKey}`, pass);
  }

  async queueScan(scan: { token: string; roundId: string; busId: string }) {
    const scans = await this.get<Array<{ token: string; roundId: string; busId: string }>>('queued_scans', []);
    scans.push(scan);
    await this.set('queued_scans', scans);
  }

  async syncQueuedScans() {
    if (!navigator.onLine) return;
    const scans = await this.get<Array<{ token: string; roundId: string; busId: string }>>('queued_scans', []);
    if (!scans.length) return;
    this.api.syncAttendance(scans).subscribe(async () => this.set('queued_scans', []));
  }
}
