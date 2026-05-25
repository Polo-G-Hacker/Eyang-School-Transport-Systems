import { Component, OnInit } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { ApiService } from '../../../core/api/api.service';

interface Bus {
  id: string;
  plate_number: string;
  color: string;
  capacity: number;
  status: 'idle' | 'on_route' | 'maintenance';
  driver_id: string | null;
  driver_name: string | null;
  driver_email: string | null;
  reserved_count?: number;
  boarded_today?: number;
}
interface Driver { id: string; full_name: string; email: string; }

@Component({
  selector: 'app-admin-buses',
  standalone: false,
  templateUrl: './buses.page.html',
  styleUrls: ['./buses.page.scss'],
})
export class AdminBusesPage implements OnInit {
  buses: Bus[] = [];
  drivers: Driver[] = [];
  stats = { on_route: 0, idle: 0, total_seats: 0 };

  showForm = false;
  form: Partial<Bus> = { plate_number: '', color: 'Blue', capacity: 30, driver_id: null };
  saving = false;

  constructor(private api: ApiService, private toast: ToastController, private alert: AlertController) {}

  async ngOnInit() {
    await Promise.all([this.refresh(), this.loadDrivers()]);
  }

  async refresh() {
    const r = await this.api.get<{ buses: Bus[]; stats: { on_route: number; idle: number; total_seats: number } }>('/buses');
    this.buses = r.buses;
    this.stats = r.stats;
  }

  async loadDrivers() {
    const r = await this.api.get<{ users: Driver[] }>('/users', { role: 'driver' });
    this.drivers = r.users;
  }

  async create() {
    if (!this.form.plate_number || !this.form.color || !this.form.capacity) return;
    this.saving = true;
    try {
      await this.api.post('/buses', {
        plate_number: this.form.plate_number,
        color: this.form.color,
        capacity: Number(this.form.capacity),
        driver_id: this.form.driver_id || null,
      });
      this.showForm = false;
      this.form = { plate_number: '', color: 'Blue', capacity: 30, driver_id: null };
      await this.refresh();
      const t = await this.toast.create({ message: 'Bus added', duration: 1500, color: 'success' });
      await t.present();
    } catch (e: unknown) {
      const t = await this.toast.create({ message: this.errorMessage(e) ?? 'Failed to add bus', duration: 2200, color: 'danger' });
      await t.present();
    } finally { this.saving = false; }
  }

  async assignDriver(bus: Bus) {
    const inputs = this.drivers.map((d) => ({
      name: 'driver_id',
      type: 'radio' as const,
      label: `${d.full_name} (${d.email})`,
      value: d.id,
      checked: bus.driver_id === d.id,
    }));
    inputs.unshift({ name: 'driver_id', type: 'radio', label: '— Unassign —', value: '', checked: !bus.driver_id });
    const alert = await this.alert.create({
      header: `Assign driver to ${bus.plate_number}`,
      inputs,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Save',
          handler: async (value: string) => {
            await this.api.patch(`/buses/${bus.id}`, { driver_id: value || null });
            await this.refresh();
          },
        },
      ],
    });
    await alert.present();
  }

  tb(_: number, b: Bus) {
    return b.id;
  }

  private errorMessage(e: unknown): string | undefined {
    if (typeof e === 'object' && e && 'error' in e) {
      const body = (e as { error?: { error?: { message?: string } } }).error;
      return body?.error?.message;
    }
    return undefined;
  }
}
