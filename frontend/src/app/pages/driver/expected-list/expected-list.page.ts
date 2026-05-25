import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/api/api.service';

interface Reservation {
  id: string;
  user_id: string;
  full_name: string;
  student_id: string | null;
  pickup_name: string | null;
  status: string;
}

@Component({
  selector: 'app-expected-list',
  standalone: false,
  templateUrl: './expected-list.page.html',
})
export class ExpectedListPage implements OnInit {
  rows: Reservation[] = [];
  busId = '';

  constructor(private api: ApiService) {}

  async ngOnInit() {
    try {
      const r = await this.api.get<{ bus: { id: string } | null }>('/buses/mine');
      this.busId = r.bus?.id ?? '';
      if (this.busId) {
        const list = await this.api.get<{ reservations: Reservation[] }>(`/buses/${this.busId}/reservations`);
        this.rows = list.reservations;
      }
    } catch { /* ignore */ }
  }
}
