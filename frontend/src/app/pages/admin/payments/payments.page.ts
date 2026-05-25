import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { ApiService } from '../../../core/api/api.service';
import { environment } from '../../../../environments/environment';

interface Payment {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  student_id: string | null;
  amount_fcfa: number;
  period_year: number;
  period_month: number;
  status: 'pending' | 'validated' | 'unpaid' | 'expired';
  paid_at: string | null;
  validated_at: string | null;
}

interface Summary { validated: number; pending: number; unpaid: number; expired: number; total_collected: number; expected: number; collection_rate: number }

@Component({
  selector: 'app-admin-payments',
  standalone: false,
  templateUrl: './payments.page.html',
  styleUrls: ['./payments.page.scss'],
})
export class AdminPaymentsPage implements OnInit {
  payments: Payment[] = [];
  summary: Summary | null = null;
  filter: '' | 'pending' | 'validated' | 'unpaid' | 'expired' = '';
  search = '';
  currency = environment.currency;
  loading = false;

  constructor(private api: ApiService, private toast: ToastController) {}

  async ngOnInit() {
    await this.refresh();
  }

  async refresh() {
    this.loading = true;
    try {
      const r = await this.api.get<{ payments: Payment[]; summary: Summary }>('/payments', {
        status: this.filter || undefined,
        q: this.search || undefined,
      });
      this.payments = r.payments;
      this.summary = r.summary;
    } finally { this.loading = false; }
  }

  async validate(p: Payment) {
    try {
      await this.api.post(`/payments/${p.id}/validate`);
      const t = await this.toast.create({ message: `Validated ${p.full_name}`, duration: 1500, color: 'success' });
      await t.present();
      await this.refresh();
    } catch (e: unknown) {
      const t = await this.toast.create({ message: this.errorMessage(e) ?? 'Validation failed', duration: 2200, color: 'danger' });
      await t.present();
    }
  }

  tone(s: string): 'success' | 'warning' | 'danger' | 'muted' {
    return s === 'validated' ? 'success' : s === 'pending' ? 'warning' : s === 'expired' ? 'danger' : 'muted';
  }

  tb(_: number, p: Payment) {
    return p.id;
  }

  private errorMessage(e: unknown): string | undefined {
    if (typeof e === 'object' && e && 'error' in e) {
      const body = (e as { error?: { error?: { message?: string } } }).error;
      return body?.error?.message;
    }
    return undefined;
  }
}
