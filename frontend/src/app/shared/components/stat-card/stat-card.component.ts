import { Component, Input } from '@angular/core';

type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'muted';

@Component({
  selector: 'app-stat-card',
  standalone: false,
  template: `
    <div class="stat-card" [ngClass]="tone">
      <div class="stat-card__icon" *ngIf="icon">
        <ion-icon [name]="icon"></ion-icon>
      </div>
      <div class="stat-card__value">{{ value }}</div>
      <div class="stat-card__label">{{ label }}</div>
      <div class="stat-card__sub" *ngIf="sub">{{ sub }}</div>
    </div>
  `,
  styles: [`
    .stat-card {
      border-radius: 14px;
      padding: 14px;
      background: rgba(37,99,235,0.07);
    }
    .stat-card.success { background: rgba(16,185,129,0.10); }
    .stat-card.warning { background: rgba(245,158,11,0.12); }
    .stat-card.danger  { background: rgba(239,68,68,0.10); }
    .stat-card.muted   { background: rgba(100,116,139,0.10); }
    .stat-card__icon { font-size: 18px; margin-bottom: 6px; color: #2563EB; }
    .stat-card.success .stat-card__icon { color: #059669; }
    .stat-card.warning .stat-card__icon { color: #B45309; }
    .stat-card.danger  .stat-card__icon { color: #B91C1C; }
    .stat-card.muted   .stat-card__icon { color: #475569; }
    .stat-card__value { font-size: 22px; font-weight: 700; color: #0F172A; }
    .stat-card__label { font-size: 13px; color: #475569; margin-top: 2px; }
    .stat-card__sub   { font-size: 11px; color: #64748B; margin-top: 2px; }
  `],
})
export class StatCardComponent {
  @Input() label = '';
  @Input() value: string | number = '';
  @Input() sub?: string;
  @Input() icon?: string;
  @Input() tone: Tone = 'primary';
}
