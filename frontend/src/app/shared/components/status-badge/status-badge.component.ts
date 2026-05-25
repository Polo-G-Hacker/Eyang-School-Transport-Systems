import { Component, Input } from '@angular/core';

type Tone = 'success' | 'warning' | 'danger' | 'primary' | 'muted';

@Component({
  selector: 'app-status-badge',
  standalone: false,
  template: `<span class="pill" [ngClass]="tone">{{ label }}</span>`,
})
export class StatusBadgeComponent {
  @Input() label = '';
  @Input() tone: Tone = 'muted';
}
