import { Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { StorageService } from '../storage/storage.service';

export interface OfflineScanEvent {
  client_event_id: string;
  qr_token: string;
  bus_id: string;
  pickup_round_id?: string | null;
  pickup_point_id?: number | null;
  scanned_at: string; // ISO
}

const QUEUE_KEY = 'ests.sync.scans.queue';

@Injectable({ providedIn: 'root' })
export class SyncService {
  constructor(private api: ApiService, private storage: StorageService) {}

  async enqueue(event: OfflineScanEvent): Promise<void> {
    const queue = (await this.storage.get<OfflineScanEvent[]>(QUEUE_KEY)) ?? [];
    queue.push(event);
    await this.storage.set(QUEUE_KEY, queue);
  }

  async queueSize(): Promise<number> {
    const queue = (await this.storage.get<OfflineScanEvent[]>(QUEUE_KEY)) ?? [];
    return queue.length;
  }

  async pendingEvents(): Promise<OfflineScanEvent[]> {
    return (await this.storage.get<OfflineScanEvent[]>(QUEUE_KEY)) ?? [];
  }

  async clear(): Promise<void> {
    await this.storage.set(QUEUE_KEY, []);
  }

  /** Push the offline queue to the server when network is back. */
  async flush(): Promise<{ flushed: number; results: unknown[] }> {
    const queue = (await this.storage.get<OfflineScanEvent[]>(QUEUE_KEY)) ?? [];
    if (queue.length === 0) return { flushed: 0, results: [] };

    try {
      const res = await this.api.post<{ results: unknown[] }>('/boarding/sync', { events: queue });
      await this.storage.set(QUEUE_KEY, []);
      return { flushed: queue.length, results: res.results };
    } catch {
      // Network failed — keep queue for next try.
      return { flushed: 0, results: [] };
    }
  }
}
