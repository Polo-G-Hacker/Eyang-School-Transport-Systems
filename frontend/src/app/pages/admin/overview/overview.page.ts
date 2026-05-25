import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/api/api.service';
import { AuthService, PublicUser } from '../../../core/auth/auth.service';
import { environment } from '../../../../environments/environment';

interface Bus { id: string; plate_number: string; color: string; capacity: number; status: 'idle' | 'on_route' | 'maintenance'; reserved_count?: number; boarded_today?: number; driver_name: string | null; driver_email: string | null }
interface Summary { validated: number; pending: number; unpaid: number; expired: number; total_collected: number; expected: number; collection_rate: number }
interface User { id: string; full_name: string; email: string; role: string; status: string }

@Component({
  selector: 'app-admin-overview',
  standalone: false,
  templateUrl: './overview.page.html',
  styleUrls: ['./overview.page.scss'],
})
export class AdminOverviewPage implements OnInit {
  user: PublicUser | null = null;
  buses: Bus[] = [];
  fleetStats = { on_route: 0, idle: 0, total_seats: 0 };
  summary: Summary | null = null;
  pendingUsers: User[] = [];
  pendingPayments: { id: string; full_name: string; period_year: number; period_month: number; amount_fcfa: number }[] = [];
  currency = environment.currency;

  constructor(private api: ApiService, private auth: AuthService, public router: Router) {
    this.user = auth.user;
  }

  async ngOnInit() {
    await this.refresh();
  }

  async ionViewWillEnter() {
    await this.refresh();
  }

  async refresh() {
    try {
      const [bs, pmts, users] = await Promise.all([
        this.api.get<{ buses: Bus[]; stats: { on_route: number; idle: number; total_seats: number } }>('/buses'),
        this.api.get<{ payments: { id: string; full_name: string; period_year: number; period_month: number; amount_fcfa: number; status: string }[]; summary: Summary }>('/payments', { status: 'pending' }),
        this.api.get<{ users: User[] }>('/users', { status: 'pending' }),
      ]);
      this.buses = bs.buses;
      this.fleetStats = bs.stats;
      this.summary = pmts.summary;
      this.pendingPayments = pmts.payments.slice(0, 5);
      this.pendingUsers = users.users.slice(0, 5);
    } catch { /* ignore */ }
  }
}
