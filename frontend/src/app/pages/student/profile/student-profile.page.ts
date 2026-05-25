import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, PublicUser } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-student-profile',
  standalone: false,
  templateUrl: './student-profile.page.html',
})
export class StudentProfilePage {
  user: PublicUser | null;

  constructor(private auth: AuthService, public router: Router) {
    this.user = auth.user;
  }

  async logout() {
    await this.auth.logout();
    await this.router.navigate(['/login']);
  }
}
