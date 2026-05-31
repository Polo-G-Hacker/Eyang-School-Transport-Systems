import { DecimalPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { IonButton, IonContent, IonIcon, IonLabel, IonSearchbar, IonSegment, IonSegmentButton } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBackOutline, calendarOutline, checkmarkOutline } from 'ionicons/icons';
import { AdminPaymentStudent, AdminPaymentsLedger, ApiService } from '../core/api.service';

@Component({
  standalone: true,
  imports: [DecimalPipe, IonContent, IonButton, IonIcon, IonSearchbar, IonSegment, IonSegmentButton, IonLabel],
  template: `
    <ion-content>
      <main class="page payments">
        <header class="topbar">
          <ion-button fill="clear" routerDirection="back"><ion-icon name="arrow-back-outline" /></ion-button>
          <div><p class="muted">Saint Jean Ingenieur</p><h1 class="title">Payments</h1></div>
        </header>

        <section class="month">
          <ion-button fill="clear" (click)="shiftMonth(-1)">Prev</ion-button>
          <div><ion-icon name="calendar-outline" /><strong>{{ monthLabel }}</strong></div>
          <ion-button fill="clear" (click)="shiftMonth(1)">Next</ion-button>
        </section>

        <ion-searchbar placeholder="Search by name, ID, class..." (ionInput)="search = $any($event.target).value || ''" />

        <ion-segment [value]="filter" (ionChange)="filter = $any($event.detail.value)">
          <ion-segment-button value="all"><ion-label>All {{ ledger?.summary?.total || 0 }}</ion-label></ion-segment-button>
          <ion-segment-button value="unpaid"><ion-label>Unpaid {{ ledger?.summary?.unpaid || 0 }}</ion-label></ion-segment-button>
          <ion-segment-button value="pending"><ion-label>Pending {{ ledger?.summary?.pending || 0 }}</ion-label></ion-segment-button>
          <ion-segment-button value="validated"><ion-label>Paid {{ ledger?.summary?.validated || 0 }}</ion-label></ion-segment-button>
        </ion-segment>

        <section class="summary">
          <p>Total Collected - {{ monthLabel }}</p>
          <strong>{{ ledger?.summary?.collected || 0 | number }} FCFA</strong>
          <div class="summary-grid">
            <span>{{ ledger?.summary?.validated || 0 }} paid</span>
            <span>{{ ledger?.summary?.pending || 0 }} pending</span>
            <span>{{ ledger?.summary?.reserved || 0 }} reserved</span>
          </div>
        </section>

        <h2 class="section-title">Student Payment Status</h2>
        @if (message) { <p class="payment-message">{{ message }}</p> }
        <section class="card list-card">
          @if (!filteredStudents.length) {
            <div class="empty">No students match this filter for {{ monthLabel }}.</div>
          }
          @for (student of filteredStudents; track student.student_id) {
            <div class="row pay-row">
              <div class="avatar">{{ initials(student.full_name) }}</div>
              <div class="row-main">
                <h3>{{ student.full_name }}</h3>
                <p>{{ student.matricule }} - {{ student.level_label }} - {{ student.department }}</p>
                <div class="reservation-line" [class.reserved]="student.has_reservation">
                  {{ student.has_reservation ? 'Reserved' : 'No reservation' }}
                  @if (student.has_reservation) { <span> - {{ student.plate_number }} - {{ student.pickup_point }}</span> }
                </div>
              </div>
              <div class="pay-side">
                <div class="amount">{{ student.amount_fcfa | number }} FCFA</div>
                <span class="tag" [class.pending]="student.payment_status==='pending'" [class.validated]="student.payment_status==='validated'" [class.expired]="student.payment_status==='unpaid'">{{ student.payment_status }}</span>
                @if (student.payment_status === 'unpaid') {
                  <ion-button size="small" fill="outline" [disabled]="updatingStudentId === student.student_id" (click)="mark(student, 'pending')">Mark pending</ion-button>
                }
                @if (student.payment_status !== 'validated') {
                  <ion-button size="small" [disabled]="updatingStudentId === student.student_id" (click)="mark(student, 'validated')"><ion-icon name="checkmark-outline" />Validate</ion-button>
                }
              </div>
            </div>
          }
        </section>
      </main>
    </ion-content>
  `,
  styles: [`
    .topbar{justify-content:flex-start}.topbar div:nth-child(2){flex:1}
    .month{height:58px;border-radius:20px;background:#edf1f7;display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:16px;padding:0 8px}
    .month div{display:flex;align-items:center;gap:10px}.month ion-button{--color:#215be6;font-weight:800}
    ion-segment{margin:8px 0 18px;overflow-x:auto}
    .summary{background:#215be6;color:white;border-radius:28px;padding:24px;margin:20px 0}.summary p{opacity:.75;margin:0}.summary strong{font-size:32px;display:block;margin:8px 0}
    .summary-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.summary-grid span{background:rgba(255,255,255,.16);border-radius:14px;padding:10px;text-align:center;font-weight:800}
    .pay-row{align-items:flex-start}.pay-side{text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:8px}.pay-side ion-button{--border-radius:14px;margin:0}
    .reservation-line{margin-top:8px;color:#ef4444;font-size:13px;font-weight:800}.reservation-line.reserved{color:#18a650}
    .payment-message{margin:0 0 12px;color:#215be6;font-weight:800}
    .empty{padding:22px;text-align:center;color:#8b98ad;font-weight:800}
  `]
})
export class AdminPaymentsPage implements OnInit {
  ledger?: AdminPaymentsLedger;
  monthKey = new Date().toISOString().slice(0, 7);
  filter: 'all' | 'unpaid' | 'pending' | 'validated' = 'all';
  search = '';
  message = '';
  updatingStudentId = '';

  get monthLabel() {
    const [year, month] = this.monthKey.split('-').map(Number);
    return new Date(year, month - 1, 1).toLocaleString('en', { month: 'long', year: 'numeric' });
  }

  get filteredStudents() {
    const term = this.search.trim().toLowerCase();
    return (this.ledger?.students || []).filter(student => {
      const matchesFilter = this.filter === 'all' || student.payment_status === this.filter;
      const haystack = `${student.full_name} ${student.matricule} ${student.level_label} ${student.department}`.toLowerCase();
      return matchesFilter && (!term || haystack.includes(term));
    });
  }

  constructor(private api: ApiService) {
    addIcons({ arrowBackOutline, calendarOutline, checkmarkOutline });
  }

  ngOnInit() {
    this.load();
  }

  load() {
    this.api.adminPayments(this.monthKey).subscribe(data => this.ledger = data);
  }

  shiftMonth(delta: number) {
    const [year, month] = this.monthKey.split('-').map(Number);
    const next = new Date(year, month - 1 + delta, 1);
    this.monthKey = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
    this.filter = 'all';
    this.search = '';
    this.message = '';
    this.load();
  }

  initials(name = '?') {
    return name.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase();
  }

  mark(student: AdminPaymentStudent, status: 'pending' | 'validated') {
    this.message = '';
    this.updatingStudentId = student.student_id;
    this.api.markPayment({
      studentId: student.student_id,
      monthKey: this.monthKey,
      status,
      amountFcfa: Number(student.amount_fcfa || 15000)
    }).subscribe({
      next: () => {
        this.message = status === 'validated' ? 'Payment validated.' : 'Payment marked pending.';
        this.updatingStudentId = '';
        this.load();
      },
      error: err => {
        this.message = err.error?.message || 'Payment update failed.';
        this.updatingStudentId = '';
      }
    });
  }
}
