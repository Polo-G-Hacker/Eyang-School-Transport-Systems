import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { ApiService } from '../../../core/api/api.service';

interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: 'student' | 'driver' | 'admin';
  status: 'pending' | 'approved' | 'disabled';
  student_id: string | null;
  program: { level: string; field: string } | null;
  pickup_point: { name: string } | null;
}

@Component({
  selector: 'app-admin-students',
  standalone: false,
  templateUrl: './students.page.html',
  styleUrls: ['./students.page.scss'],
})
export class AdminStudentsPage implements OnInit {
  users: User[] = [];
  filter: '' | 'student' | 'driver' | 'admin' = 'student';
  status: '' | 'pending' | 'approved' | 'disabled' = '';
  search = '';
  loading = false;

  constructor(private api: ApiService, private toast: ToastController) {}

  async ngOnInit() {
    await this.refresh();
  }

  async refresh() {
    this.loading = true;
    try {
      const r = await this.api.get<{ users: User[] }>('/users', {
        role: this.filter || undefined,
        status: this.status || undefined,
        q: this.search || undefined,
      });
      this.users = r.users;
    } finally { this.loading = false; }
  }

  async setStatus(u: User, status: 'approved' | 'disabled' | 'pending') {
    try {
      await this.api.patch(`/users/${u.id}/status`, { status });
      u.status = status;
      const t = await this.toast.create({ message: `Updated ${u.full_name}`, duration: 1500, color: 'success' });
      await t.present();
    } catch (e: unknown) {
      const t = await this.toast.create({ message: this.errorMessage(e) ?? 'Update failed', duration: 2200, color: 'danger' });
      await t.present();
    }
  }

  tone(s: string): 'success' | 'warning' | 'muted' {
    return s === 'approved' ? 'success' : s === 'pending' ? 'warning' : 'muted';
  }

  tb(_: number, u: User) {
    return u.id;
  }

  private errorMessage(e: unknown): string | undefined {
    if (typeof e === 'object' && e && 'error' in e) {
      const body = (e as { error?: { error?: { message?: string } } }).error;
      return body?.error?.message;
    }
    return undefined;
  }
}
