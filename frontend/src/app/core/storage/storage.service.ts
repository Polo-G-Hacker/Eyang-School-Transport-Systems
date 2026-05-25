import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private _ready: Promise<Storage> | null = null;

  constructor(private storage: Storage) {}

  private ensure(): Promise<Storage> {
    if (!this._ready) {
      this._ready = this.storage.create();
    }
    return this._ready;
  }

  async get<T>(key: string): Promise<T | null> {
    const s = await this.ensure();
    return (await s.get(key)) as T | null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    const s = await this.ensure();
    await s.set(key, value);
  }

  async remove(key: string): Promise<void> {
    const s = await this.ensure();
    await s.remove(key);
  }

  async clear(): Promise<void> {
    const s = await this.ensure();
    await s.clear();
  }
}
