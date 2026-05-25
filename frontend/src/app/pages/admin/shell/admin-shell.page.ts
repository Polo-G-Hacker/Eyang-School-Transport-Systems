import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-shell',
  standalone: false,
  template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="home" href="/app/admin/home">
          <ion-icon name="grid-outline"></ion-icon><ion-label>Overview</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="students" href="/app/admin/students">
          <ion-icon name="people-outline"></ion-icon><ion-label>Students</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="payments" href="/app/admin/payments">
          <ion-icon name="cash-outline"></ion-icon><ion-label>Payments</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="buses" href="/app/admin/buses">
          <ion-icon name="bus-outline"></ion-icon><ion-label>Buses</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="settings" href="/app/admin/settings">
          <ion-icon name="settings-outline"></ion-icon><ion-label>Settings</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
})
export class AdminShellPage {}
