import { Component } from '@angular/core';
import { IonIcon, IonLabel, IonTabBar, IonTabButton, IonTabs } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { busOutline, cardOutline, gridOutline, locationOutline, peopleOutline, personOutline, qrCodeOutline, scanOutline } from 'ionicons/icons';

@Component({
  standalone: true,
  selector: 'app-tabs',
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
  template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom">
        @if (role === 'student') {
          <ion-tab-button tab="student" href="/app/student"><ion-icon name="grid-outline" /><ion-label>Home</ion-label></ion-tab-button>
          <ion-tab-button tab="qr" href="/app/qr"><ion-icon name="qr-code-outline" /><ion-label>My QR</ion-label></ion-tab-button>
          <ion-tab-button tab="track" href="/app/track"><ion-icon name="location-outline" /><ion-label>Track</ion-label></ion-tab-button>
          <ion-tab-button tab="reservation" href="/app/reservation"><ion-icon name="bus-outline" /><ion-label>Reserve</ion-label></ion-tab-button>
          <ion-tab-button tab="profile" href="/app/profile"><ion-icon name="person-outline" /><ion-label>Profile</ion-label></ion-tab-button>
        }
        @if (role === 'driver') {
          <ion-tab-button tab="driver" href="/app/driver"><ion-icon name="scan-outline" /><ion-label>Scan</ion-label></ion-tab-button>
          <ion-tab-button tab="track" href="/app/track"><ion-icon name="location-outline" /><ion-label>Map</ion-label></ion-tab-button>
        }
        @if (role === 'admin') {
          <ion-tab-button tab="admin" href="/app/admin"><ion-icon name="grid-outline" /><ion-label>Overview</ion-label></ion-tab-button>
          <ion-tab-button tab="students" href="/app/students"><ion-icon name="people-outline" /><ion-label>Students</ion-label></ion-tab-button>
          <ion-tab-button tab="payments" href="/app/payments"><ion-icon name="card-outline" /><ion-label>Payments</ion-label></ion-tab-button>
          <ion-tab-button tab="drivers" href="/app/drivers"><ion-icon name="people-outline" /><ion-label>Drivers</ion-label></ion-tab-button>
          <ion-tab-button tab="admin-profile" href="/app/admin-profile"><ion-icon name="person-outline" /><ion-label>Account</ion-label></ion-tab-button>
        }
      </ion-tab-bar>
    </ion-tabs>
  `
})
export class TabsPage {
  role = JSON.parse(localStorage.getItem('ests_user') || '{}').role || 'student';
  constructor() {
    addIcons({ gridOutline, qrCodeOutline, locationOutline, busOutline, cardOutline, peopleOutline, scanOutline, personOutline });
  }
}
