import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { IonButton, IonContent, IonIcon, IonItem, IonItemOption, IonItemOptions, IonItemSliding } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { busOutline, checkmarkCircleOutline, notificationsOutline } from 'ionicons/icons';
import { ApiService, AppNotification } from '../core/api.service';

@Component({
  standalone: true,
  imports: [DatePipe, IonButton, IonContent, IonIcon, IonItem, IonItemOption, IonItemOptions, IonItemSliding],
  template: `
    <ion-content>
      <main class="page">
        <header class="topbar">
          <div><p class="muted">Updates</p><h1 class="title">Notifications</h1></div>
          <div class="icon-pill"><ion-icon name="notifications-outline" /></div>
        </header>
        <section class="card list-card">
          @if (message) { <div class="notice">{{ message }}</div> }
          @if (!notifications.length) {
            <div class="empty">No notifications yet.</div>
          }
          @for (note of notifications; track note.id) {
            <ion-item-sliding>
              <ion-item lines="none">
                <div class="row">
                  <div class="icon-pill soft-green"><ion-icon [name]="iconFor(note)" /></div>
                  <div class="row-main">
                    <h3>{{ note.title }}</h3>
                    <p>{{ note.body }}</p>
                    <p>{{ note.created_at | date:'medium' }}</p>
                    @if (note.round_id && !note.read_at) {
                      <div class="actions">
                        <ion-button size="small" class="primary-button" (click)="respond(note.round_id, 'yes')">Yes</ion-button>
                        <ion-button size="small" class="ghost-button" (click)="respond(note.round_id, 'no')">No</ion-button>
                      </div>
                    }
                  </div>
                </div>
              </ion-item>
              <ion-item-options side="end">
                <ion-item-option color="danger" (click)="delete(note.id)">Delete</ion-item-option>
              </ion-item-options>
            </ion-item-sliding>
          }
        </section>
      </main>
    </ion-content>
  `,
  styles: [`
    .empty{padding:22px;text-align:center;color:#8b98ad;font-weight:800}
    .actions{display:flex;gap:8px;margin-top:10px}
    .notice{margin-bottom:12px;border-radius:16px;background:#d9f9e5;color:#18a650;border:1px solid #24c564;padding:12px 14px;font-weight:850}
    ion-item{--background:transparent;--padding-start:0;--inner-padding-end:0}
    ion-item-sliding{border-bottom:1px solid #edf1f7}
    ion-item-option{font-weight:850}
  `]
})
export class NotificationsPage implements OnInit {
  notifications: AppNotification[] = [];
  message = '';

  constructor(private api: ApiService) {
    addIcons({ notificationsOutline, checkmarkCircleOutline, busOutline });
  }

  ngOnInit() {
    this.api.notifications().subscribe(result => this.notifications = result.notifications);
  }

  iconFor(note: AppNotification) {
    return note.title.toLowerCase().includes('payment') ? 'checkmark-circle-outline' : 'bus-outline';
  }

  respond(roundId: string, response: 'yes' | 'no') {
    this.api.swipe(roundId, response).subscribe(() => {
      this.message = response === 'yes' ? 'Presence confirmed.' : 'Absence confirmed.';
      this.notifications = this.notifications.filter(note => note.round_id !== roundId);
      localStorage.removeItem('active_round');
    });
  }

  delete(notificationId: string) {
    this.api.deleteNotification(notificationId).subscribe(() => {
      this.notifications = this.notifications.filter(note => note.id !== notificationId);
      this.message = 'Notification deleted.';
    });
  }
}
