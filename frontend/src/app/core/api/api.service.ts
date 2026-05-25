import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private token: string | null = null;

  constructor(private http: HttpClient) {}

  setToken(token: string | null) {
    this.token = token;
  }

  private headers(): HttpHeaders {
    let h = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (this.token) h = h.set('Authorization', `Bearer ${this.token}`);
    return h;
  }

  private url(path: string): string {
    if (path.startsWith('http')) return path;
    const base = environment.apiBaseUrl.replace(/\/$/, '');
    return `${base}/${path.replace(/^\//, '')}`;
  }

  async get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
    let httpParams = new HttpParams();
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== '') httpParams = httpParams.set(k, String(v));
      }
    }
    return firstValueFrom(this.http.get<T>(this.url(path), { headers: this.headers(), params: httpParams }));
  }

  async post<T>(path: string, body: unknown = {}): Promise<T> {
    return firstValueFrom(this.http.post<T>(this.url(path), body, { headers: this.headers() }));
  }

  async patch<T>(path: string, body: unknown = {}): Promise<T> {
    return firstValueFrom(this.http.patch<T>(this.url(path), body, { headers: this.headers() }));
  }

  async delete<T>(path: string): Promise<T> {
    return firstValueFrom(this.http.delete<T>(this.url(path), { headers: this.headers() }));
  }
}
