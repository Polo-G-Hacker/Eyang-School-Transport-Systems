import { Component } from '@angular/core';

@Component({
  selector: 'app-student-shell',
  standalone: false,
  template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="home" href="/app/student/home">
          <ion-icon name="home-outline"></ion-icon>
          <ion-label>Home</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="qr" href="/app/student/qr">
          <ion-icon name="qr-code-outline"></ion-icon>
          <ion-label>My QR</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="track" href="/app/student/track">
          <ion-icon name="map-outline"></ion-icon>
          <ion-label>Track Bus</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="profile" href="/app/student/profile">
          <ion-icon name="person-outline"></ion-icon>
          <ion-label>Profile</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
})
export class StudentShellPage {}
