import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-section-header',
  standalone: false,
  template: `
    <div class="app-section-title">
      <span>{{ title }}</span>
      <a *ngIf="action" (click)="actionClick.emit()" class="action-link">{{ action }}</a>
    </div>
  `,
  styles: [`
    .action-link { color: #2563EB; font-weight: 600; font-size: 13px; cursor: pointer; }
  `],
})
export class SectionHeaderComponent {
  @Input() title = '';
  @Input() action?: string;
  @Output() actionClick = new EventEmitter<void>();
}
