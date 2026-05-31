import { Component, OnInit } from '@angular/core';
import { IonButton, IonContent } from '@ionic/angular/standalone';
import { ApiService, QrPass } from '../core/api.service';
import { OfflineService } from '../core/offline.service';

@Component({
  standalone: true,
  imports: [IonContent, IonButton],
  template: `
    <ion-content>
      <main class="page">
        <h1 class="title">My QR Pass</h1><p class="muted">{{ monthKey }} · saved for offline checks</p>
        <section class="card qr-full">
          <img [src]="pass?.imageDataUrl" alt="QR pass">
          <h2>{{ pass?.student?.full_name || 'Student' }}</h2>
          <p class="muted">{{ pass?.student?.matricule || 'Monthly transport pass' }}</p>
          <span class="status">Available offline</span>
        </section>
        <ion-button expand="block" class="primary-button" (click)="refresh()">Refresh QR</ion-button>
      </main>
    </ion-content>
  `,
  styles: [`.qr-full{padding:28px;text-align:center;margin:28px 0}.qr-full img{width:280px;max-width:90%;}.qr-full h2{margin-bottom:4px}`]
})
export class QrPassPage implements OnInit {
  monthKey = new Date().toISOString().slice(0, 7);
  pass?: QrPass;
  constructor(private api: ApiService, private offline: OfflineService) {}
  ngOnInit() { this.refresh(); }
  async refresh() {
    this.api.monthlyQr(this.monthKey).subscribe({
      next: async pass => { this.pass = pass; await this.offline.cacheQr(pass); },
      error: async () => this.pass = await this.offline.get<QrPass | undefined>(`qr:${this.monthKey}`, undefined)
    });
  }
}
