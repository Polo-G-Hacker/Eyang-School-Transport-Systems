import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ApiService } from '../api/api.service';
import { StorageService } from '../storage/storage.service';

export type Role = 'student' | 'driver' | 'admin';

export interface PublicUser {
  id: string;
  role: Role;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  student_id: string | null;
  program: { id: number; code: string; level: string; field: string } | null;
  pickup_point: { id: number; code: string; name: string } | null;
  is_email_verified: boolean;
  is_active: boolean;
  status: 'pending' | 'approved' | 'disabled';
}

const STORAGE_TOKEN = 'ests.auth.token';
const STORAGE_USER  = 'ests.auth.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  user$ = new BehaviorSubject<PublicUser | null>(null);
  token: string | null = null;

  constructor(private api: ApiService, private storage: StorageService) {}

  async restore(): Promise<void> {
    const token = await this.storage.get<string>(STORAGE_TOKEN);
    const user = await this.storage.get<PublicUser>(STORAGE_USER);
    if (token && user) {
      this.token = token;
      this.api.setToken(token);
      this.user$.next(user);
    }
  }

  async login(email: string, password: string): Promise<PublicUser> {
    const res = await this.api.post<{ access_token: string; user: PublicUser }>('/auth/login', { email, password });
    this.token = res.access_token;
    this.api.setToken(res.access_token);
    await this.storage.set(STORAGE_TOKEN, res.access_token);
    await this.storage.set(STORAGE_USER, res.user);
    this.user$.next(res.user);
    return res.user;
  }

  async register(payload: {
    full_name: string;
    email: string;
    password: string;
    role?: 'student' | 'driver';
    phone?: string;
    student_id?: string;
    program_id?: number;
    pickup_point_id?: number;
  }) {
    return this.api.post<{ user: PublicUser; needsVerification: true }>('/auth/register', payload);
  }

  async verifyEmail(token: string) {
    return this.api.post<{ verified: true }>('/auth/verify-email', { token });
  }

  async resendVerification(email: string) {
    return this.api.post<{ ok: true }>('/auth/resend-verification', { email });
  }

  async logout(): Promise<void> {
    this.token = null;
    this.api.setToken(null);
    await this.storage.remove(STORAGE_TOKEN);
    await this.storage.remove(STORAGE_USER);
    this.user$.next(null);
  }

  get user(): PublicUser | null {
    return this.user$.value;
  }
}
