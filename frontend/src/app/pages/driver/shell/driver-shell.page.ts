import { Component } from '@angular/core';

@Component({
  selector: 'app-driver-shell',
  standalone: false,
  template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="home" href="/app/driver/home">
          <ion-icon name="speedometer-outline"></ion-icon><ion-label>Home</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="scan" href="/app/driver/scan">
          <ion-icon name="scan-outline"></ion-icon><ion-label>Scan</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="round" href="/app/driver/round">
          <ion-icon name="play-circle-outline"></ion-icon><ion-label>Round</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="bus" href="/app/driver/bus">
          <ion-icon name="bus-outline"></ion-icon><ion-label>My Bus</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
})
export class DriverShellPage {}
