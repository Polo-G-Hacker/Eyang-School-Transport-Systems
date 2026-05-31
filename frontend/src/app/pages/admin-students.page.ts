import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlertController, IonButton, IonContent, IonInput, IonItem, IonText } from '@ionic/angular/standalone';
import { AdminDashboard, ApiService } from '../core/api.service';

@Component({
  standalone: true,
  imports: [FormsModule, IonContent, IonButton, IonInput, IonItem, IonText],
  template: `
    <ion-content>
      <main class="page">
        <header class="topbar">
          <div><p class="muted">Admin only</p><h1 class="title">Students</h1></div>
          <span class="status">{{ data?.students || 0 }} total</span>
        </header>

        <section class="card form">
          <h2>Add Student</h2>
          <ion-item><ion-input label="Full name" labelPlacement="stacked" [(ngModel)]="fullName" /></ion-item>
          <ion-item><ion-input label="Email" labelPlacement="stacked" type="email" [(ngModel)]="email" /></ion-item>
          <ion-item><ion-input label="Temporary password" labelPlacement="stacked" type="password" [(ngModel)]="password" /></ion-item>
          <ion-item><ion-input label="Matricule" labelPlacement="stacked" [(ngModel)]="matricule" /></ion-item>
          <div class="split">
            <ion-item><ion-input label="Level" labelPlacement="stacked" [(ngModel)]="levelLabel" /></ion-item>
            <ion-item><ion-input label="Department" labelPlacement="stacked" [(ngModel)]="department" /></ion-item>
          </div>
          <ion-button expand="block" class="primary-button" (click)="create()">Create Student</ion-button>
          @if (message) { <ion-text>{{ message }}</ion-text> }
        </section>

        <h2 class="section-title">Registered Students</h2>
        <section class="card list-card">
          @for (student of data?.studentList || []; track student.id) {
            <div class="row">
              <div class="avatar">{{ initials(student.full_name) }}</div>
              <div class="row-main"><h3>{{ student.full_name }}</h3><p>{{ student.matricule }} - {{ student.level_label }} - {{ student.department }}</p></div>
              <ion-button size="small" color="danger" fill="clear" (click)="deleteStudent(student.id)">Delete</ion-button>
            </div>
          }
        </section>
      </main>
    </ion-content>
  `,
  styles: [`
    .form{padding:18px}.form h2{margin:0 0 12px}
    .split{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    ion-item{--background:#f2f5fb;--border-radius:16px;margin:10px 0}
    .row ion-button{--border-radius:14px;font-weight:800}
  `]
})
export class AdminStudentsPage implements OnInit {
  data?: AdminDashboard;
  fullName = '';
  email = '';
  password = 'student123';
  matricule = '';
  levelLabel = '';
  department = '';
  message = '';

  constructor(private api: ApiService, private alerts: AlertController) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.api.adminDashboard().subscribe(data => this.data = data);
  }

  create() {
    this.message = '';
    const missing = [
      [this.fullName.trim(), 'full name'],
      [this.email.trim(), 'email'],
      [this.password.trim(), 'temporary password'],
      [this.matricule.trim(), 'matricule'],
      [this.levelLabel.trim(), 'level'],
      [this.department.trim(), 'department']
    ].filter(([value]) => !value).map(([, label]) => label);
    if (missing.length) {
      this.message = `Please fill: ${missing.join(', ')}.`;
      return;
    }
    if (!this.email.includes('@')) {
      this.message = 'Please enter a valid email address.';
      return;
    }
    this.api.createStudent({
      fullName: this.fullName,
      email: this.email,
      password: this.password,
      matricule: this.matricule,
      levelLabel: this.levelLabel,
      department: this.department
    }).subscribe({
      next: () => {
        this.message = 'Student created.';
        this.fullName = '';
        this.email = '';
        this.password = 'student123';
        this.matricule = '';
        this.levelLabel = '';
        this.department = '';
        this.load();
      },
      error: err => this.message = err.error?.message || 'Could not create student.'
    });
  }

  initials(name = '?') {
    return name.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase();
  }

  async deleteStudent(studentId: string) {
    this.message = '';
    const alert = await this.alerts.create({
      header: 'Delete student?',
      message: 'This will disable the student account and remove it from active lists.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.api.deleteStudent(studentId).subscribe({
              next: () => {
                this.message = 'Student deleted.';
                this.load();
              },
              error: err => this.message = err.error?.message || 'Could not delete student.'
            });
          }
        }
      ]
    });
    await alert.present();
  }
}
