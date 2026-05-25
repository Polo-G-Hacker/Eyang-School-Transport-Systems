import { Component, Input } from '@angular/core';

export interface BusCardModel {
  id: string;
  plate_number: string;
  color: string;
  capacity: number;
  status: 'idle' | 'on_route' | 'maintenance';
  driver_name: string | null;
  driver_email?: string | null;
  reserved_count?: number;
  boarded_today?: number;
}

@Component({
  selector: 'app-bus-card',
  standalone: false,
  template: `
    <div class="app-card bus-card" [ngClass]="bus.status">
      <div class="row-flex space-between">
        <div class="row-flex">
          <div class="bus-icon"><ion-icon name="bus-outline"></ion-icon></div>
          <div>
            <div class="plate">{{ bus.plate_number }}</div>
            <div class="muted-text text-tiny color">{{ bus.color }}</div>
          </div>
        </div>
        <app-status-badge
          [label]="bus.status === 'on_route' ? 'On Route' : bus.status === 'idle' ? 'Idle' : 'Maintenance'"
          [tone]="bus.status === 'on_route' ? 'success' : bus.status === 'maintenance' ? 'danger' : 'muted'">
        </app-status-badge>
      </div>

      <div class="driver-row" *ngIf="bus.driver_name">
        <div class="avatar-fallback">{{ initials(bus.driver_name) }}</div>
        <div>
          <div class="driver-name">{{ bus.driver_name }}</div>
          <div class="muted-text text-tiny" *ngIf="bus.driver_email">{{ bus.driver_email }}</div>
        </div>
      </div>

      <div class="cap-row" *ngIf="showCapacity">
        <div class="row-flex space-between text-small">
          <span class="muted-text">Reserved</span>
          <span>{{ bus.reserved_count || 0 }}/{{ bus.capacity }}</span>
        </div>
        <app-progress-bar
          [value]="bus.reserved_count || 0"
          [max]="bus.capacity"
          tone="primary">
        </app-progress-bar>
      </div>
    </div>
  `,
  styles: [`
    .bus-card { border-left: 4px solid #2563EB; }
    .bus-card.on_route { border-left-color: #10B981; }
    .bus-card.idle { border-left-color: #94A3B8; }
    .bus-card.maintenance { border-left-color: #F59E0B; }
    .bus-icon {
      width: 36px; height: 36px; border-radius: 10px;
      background: rgba(37,99,235,0.10); color: #2563EB;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px;
    }
    .plate { font-weight: 700; font-size: 15px; color: #0F172A; }
    .driver-row {
      display: flex; align-items: center; gap: 10px;
      margin-top: 12px; padding: 10px; border-radius: 10px;
      background: #F8FAFC;
    }
    .avatar-fallback {
      width: 36px; height: 36px; border-radius: 999px;
      background: #E2E8F0; display: flex; align-items: center;
      justify-content: center; font-weight: 700; color: #475569;
    }
    .driver-name { font-weight: 600; font-size: 14px; color: #0F172A; }
    .cap-row { margin-top: 12px; display: grid; gap: 6px; }
    .color { text-transform: capitalize; }
  `],
})
export class BusCardComponent {
  @Input() bus!: BusCardModel;
  @Input() showCapacity = true;

  initials(name: string): string {
    return name
      .split(/\s+/)
      .map((p) => p.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }
}
