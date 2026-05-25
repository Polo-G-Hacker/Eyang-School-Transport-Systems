import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, PublicUser } from '../../../core/auth/auth.service';
import { ApiService } from '../../../core/api/api.service';
import { environment } from '../../../../environments/environment';

interface PickupPoint { id: number; code: string; name: string; latitude: string; longitude: string; is_destination: boolean }

@Component({
  selector: 'app-admin-settings',
  standalone: false,
  templateUrl: './settings.page.html',
})
export class AdminSettingsPage implements OnInit {
  user: PublicUser | null;
  pickupPoints: PickupPoint[] = [];
  fee = environment.monthlyFee;
  currency = environment.currency;
  schoolName = environment.schoolName;
  appName = environment.appName;

  constructor(private auth: AuthService, private api: ApiService, public router: Router) {
    this.user = auth.user;
  }

  async ngOnInit() {
    try {
      const r = await this.api.get<{ pickup_points: PickupPoint[] }>('/pickup-points');
      this.pickupPoints = r.pickup_points;
    } catch { /* ignore */ }
  }

  async logout() {
    await this.auth.logout();
    this.router.navigate(['/login']);
  }
}
