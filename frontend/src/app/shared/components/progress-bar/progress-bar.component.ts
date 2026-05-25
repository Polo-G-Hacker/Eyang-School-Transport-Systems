import { Component, Input } from '@angular/core';

type Tone = 'primary' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'app-progress-bar',
  standalone: false,
  template: `
    <div class="bar"><div class="fill" [ngClass]="tone" [style.width.%]="pct"></div></div>
  `,
  styles: [`
    .bar { height: 6px; background: #E2E8F0; border-radius: 999px; overflow: hidden; }
    .fill { height: 100%; background: #2563EB; transition: width 0.3s; }
    .fill.success { background: #10B981; }
    .fill.warning { background: #F59E0B; }
    .fill.danger  { background: #EF4444; }
  `],
})
export class ProgressBarComponent {
  @Input() value = 0;
  @Input() max = 100;
  @Input() tone: Tone = 'primary';

  get pct(): number {
    if (!this.max) return 0;
    return Math.max(0, Math.min(100, (this.value / this.max) * 100));
  }
}
