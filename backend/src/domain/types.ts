export type Role = "student" | "driver" | "admin";
export type UserStatus = "pending" | "approved" | "disabled";
export type PaymentStatus = "pending" | "validated" | "expired" | "unpaid";
export type ReservationStatus = "confirmed" | "cancelled";
export type BusStatus = "idle" | "on_route" | "maintenance";

export interface UserRow {
  id: string;
  role_code: Role;
  full_name: string;
  email: string;
  password_hash: string;
  phone: string | null;
  avatar_url: string | null;
  student_id: string | null;
  program_id: number | null;
  pickup_point_id: number | null;
  is_email_verified: boolean;
  is_active: boolean;
  status: UserStatus;
  created_at: Date;
  updated_at: Date;
}

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
  status: UserStatus;
}
