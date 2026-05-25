import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ApiService } from '../../../core/api/api.service';

interface Bus { id: string; plate_number: string; color: string; capacity: number; status: 'idle' | 'on_route' | 'maintenance' }

@Component({
  selector: 'app-bus-setup',
  standalone: false,
  templateUrl: './bus-setup.page.html',
})
export class BusSetupPage implements OnInit {
  bus: Bus | null = null;
  plate_number = '';
  color = '';
  capacity = 30;
  status: 'idle' | 'on_route' | 'maintenance' = 'idle';
  saving = false;

  constructor(private api: ApiService, private auth: AuthService, private toast: ToastController, private router: Router) {}

  async ngOnInit() {
    try {
      const r = await this.api.get<{ bus: Bus | null }>('/buses/mine');
      if (r.bus) {
        this.bus = r.bus;
        this.plate_number = r.bus.plate_number;
        this.color = r.bus.color;
        this.capacity = r.bus.capacity;
        this.status = r.bus.status;
      }
    } catch { /* ignore */ }
  }

  async save() {
    if (!this.bus) return;
    this.saving = true;
    try {
      await this.api.patch(`/buses/${this.bus.id}`, {
        plate_number: this.plate_number,
        color: this.color,
        capacity: this.capacity,
        status: this.status,
      });
      const t = await this.toast.create({ message: 'Bus updated', duration: 1800, color: 'success' });
      await t.present();
    } catch (e: unknown) {
      const t = await this.toast.create({ message: this.errorMessage(e) ?? 'Update failed', duration: 2500, color: 'danger' });
      await t.present();
    } finally {
      this.saving = false;
    }
  }

  async logout() {
    await this.auth.logout();
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
