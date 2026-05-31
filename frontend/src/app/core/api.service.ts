import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private socket?: Socket;
  constructor(private http: HttpClient) {}

  login(email: string, password: string) {
    return this.http.post<AuthResponse>(`${environment.apiBaseUrl}/auth/login`, { email, password });
  }

  bootstrap() {
    return this.http.get<BootstrapData>(`${environment.apiBaseUrl}/api/bootstrap`);
  }

  adminDashboard() {
    return this.http.get<AdminDashboard>(`${environment.apiBaseUrl}/api/admin/dashboard`);
  }

  updateProfile(payload: { fullName: string; password?: string; photoDataUrl?: string }) {
    return this.http.put<UserProfile>(`${environment.apiBaseUrl}/api/profile`, payload);
  }

  notifications() {
    return this.http.get<{ notifications: AppNotification[] }>(`${environment.apiBaseUrl}/api/notifications`);
  }

  deleteNotification(notificationId: string) {
    return this.http.delete(`${environment.apiBaseUrl}/api/notifications/${notificationId}`);
  }

  validatePayment(paymentId: string) {
    return this.http.post(`${environment.apiBaseUrl}/api/payments/${paymentId}/validate`, {});
  }

  adminPayments(monthKey: string) {
    return this.http.get<AdminPaymentsLedger>(`${environment.apiBaseUrl}/api/admin/payments`, { params: { monthKey } });
  }

  markPayment(payload: { studentId: string; monthKey: string; status: 'pending' | 'validated'; amountFcfa?: number }) {
    return this.http.post(`${environment.apiBaseUrl}/api/admin/payments/mark`, payload);
  }

  updateAdminProfile(payload: { fullName: string; email: string; password?: string; photoDataUrl?: string }) {
    return this.http.put<AdminProfile>(`${environment.apiBaseUrl}/api/admin/profile`, payload);
  }

  createStudent(payload: { fullName: string; email: string; password: string; matricule: string; levelLabel: string; department: string }) {
    return this.http.post(`${environment.apiBaseUrl}/api/admin/students`, payload);
  }

  deleteStudent(studentId: string) {
    return this.http.delete(`${environment.apiBaseUrl}/api/admin/students/${studentId}`);
  }

  createDriver(payload: { fullName: string; email: string; password: string; pickupPointId: string; plateNumber: string; color: string; capacity: number }) {
    return this.http.post(`${environment.apiBaseUrl}/api/admin/drivers`, payload);
  }

  deleteDriver(driverId: string) {
    return this.http.delete(`${environment.apiBaseUrl}/api/admin/drivers/${driverId}`);
  }

  reserve(payload: { busId: string; pickupPointId: string; monthKey: string }) {
    return this.http.post(`${environment.apiBaseUrl}/api/reservations`, payload);
  }

  monthlyQr(monthKey: string, studentId?: string) {
    return this.http.post<QrPass>(`${environment.apiBaseUrl}/api/qr/monthly`, { monthKey, studentId });
  }

  startRound(busId: string) {
    return this.http.post<PickupRound>(`${environment.apiBaseUrl}/api/rounds/start`, { busId });
  }

  validateBoarding(payload: { token: string; roundId: string; busId: string; offline?: boolean }) {
    return this.http.post<BoardingResult>(`${environment.apiBaseUrl}/api/boarding/validate`, payload);
  }

  syncAttendance(scans: Array<{ token: string; roundId: string; busId: string }>) {
    return this.http.post(`${environment.apiBaseUrl}/api/sync/attendance`, { scans });
  }

  swipe(roundId: string, response: 'yes' | 'no') {
    return this.http.post(`${environment.apiBaseUrl}/api/swipes`, { roundId, response });
  }

  gps(busId: string, lat: number, lng: number) {
    return this.http.post(`${environment.apiBaseUrl}/api/gps`, { busId, lat, lng, status: 'on_route' });
  }

  realtime() {
    if (!this.socket) this.socket = io(environment.socketUrl, { transports: ['websocket'] });
    return this.socket;
  }
}

export interface AuthResponse { token: string; user: AppUser; }
export interface AppUser { id: string; fullName: string; email: string; role: 'student' | 'driver' | 'admin'; emailVerified: boolean; photoDataUrl?: string; }
export interface UserProfile { id: string; full_name: string; email: string; matricule?: string; level_label?: string; department?: string; photo_data_url?: string; }
export interface AppNotification { id: string; title: string; body: string; round_id?: string; created_at: string; read_at?: string; }
export interface BootstrapData { profile: UserProfile; pickupPoints: PickupPoint[]; buses: Bus[]; reservations: Reservation[]; payments: Payment[]; qrCodes: Array<{ month_key: string; jwt: string; expires_at: string }>; }
export interface PickupPoint { id: string; name: string; latitude: number; longitude: number; sort_order: number; }
export interface Bus { id: string; driver_id?: string; driver_name?: string; pickup_point_id?: string; pickup_point?: string; plate_number: string; color: string; capacity: number; status: string; last_lat?: number; last_lng?: number; }
export interface Reservation { id: string; bus_id: string; pickup_point_id: string; month_key: string; status: string; }
export interface Payment { id: string; student_id: string; month_key: string; amount_fcfa: number; status: string; full_name?: string; level_label?: string; department?: string; created_at?: string; }
export interface QrPass { token: string; imageDataUrl: string; student: { full_name: string; matricule: string }; monthKey: string; expiresAt: string; }
export interface PickupRound { id: string; bus_id: string; status: string; started_at: string; notifiedStudents?: number; }
export interface BoardingResult { valid: boolean; reason?: string; studentId?: string; studentName?: string; busPlate?: string; }
export interface DriverAccount { id: string; full_name: string; email: string; is_disabled: boolean; plate_number?: string; }
export interface StudentAccount { id: string; full_name: string; email: string; matricule: string; level_label: string; department: string; is_disabled: boolean; }
export interface AdminProfile { id: string; full_name: string; email: string; photo_data_url?: string; }
export interface AdminDashboard { profile: AdminProfile; students: number; studentList: StudentAccount[]; drivers: DriverAccount[]; active: number; pending: number; buses: Bus[]; payments: Payment[]; pickupPoints: PickupPoint[]; }
export interface AdminPaymentStudent {
  student_id: string;
  full_name: string;
  email: string;
  matricule: string;
  level_label: string;
  department: string;
  amount_fcfa: number;
  payment_status: 'unpaid' | 'pending' | 'validated' | 'expired';
  payment_id?: string;
  has_reservation: boolean;
  reservation_status?: string;
  plate_number?: string;
  pickup_point?: string;
}
export interface AdminPaymentsLedger {
  monthKey: string;
  summary: { total: number; unpaid: number; pending: number; validated: number; reserved: number; collected: number };
  students: AdminPaymentStudent[];
}
