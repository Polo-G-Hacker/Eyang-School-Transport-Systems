/* Demo seed: creates an admin, two drivers, three buses, sample students, payments,
   reservations. Idempotent (safe to re-run). */
import * as bcrypt from "bcryptjs";
import { pool, query, withTx } from "../pool";
import { logger } from "../../config/logger";

async function getRoleId(code: "student" | "driver" | "admin"): Promise<number> {
  const { rows } = await query<{ id: number }>(`SELECT id FROM roles WHERE code = $1`, [code]);
  if (!rows[0]) throw new Error(`role ${code} not found`);
  return rows[0].id;
}

async function getProgramId(code: string): Promise<number | null> {
  const { rows } = await query<{ id: number }>(`SELECT id FROM academic_programs WHERE code = $1`, [code]);
  return rows[0]?.id ?? null;
}

async function getPickupId(code: string): Promise<number | null> {
  const { rows } = await query<{ id: number }>(`SELECT id FROM pickup_points WHERE code = $1`, [code]);
  return rows[0]?.id ?? null;
}

async function upsertUser(args: {
  email: string;
  password: string;
  full_name: string;
  role: "student" | "driver" | "admin";
  student_id?: string | null;
  program?: string | null;
  pickup?: string | null;
  status?: "approved";
}): Promise<string> {
  const existing = await query<{ id: string }>(`SELECT id FROM users WHERE LOWER(email) = LOWER($1)`, [args.email]);
  if (existing.rows[0]) return existing.rows[0].id;

  const hash = await bcrypt.hash(args.password, 10);
  const roleId = await getRoleId(args.role);
  const programId = args.program ? await getProgramId(args.program) : null;
  const pickupId = args.pickup ? await getPickupId(args.pickup) : null;

  const { rows } = await query<{ id: string }>(
    `INSERT INTO users (role_id, full_name, email, password_hash, student_id, program_id, pickup_point_id, is_email_verified, status)
     VALUES ($1, $2, LOWER($3), $4, $5, $6, $7, TRUE, COALESCE($8, 'approved'))
     RETURNING id`,
    [roleId, args.full_name, args.email, hash, args.student_id ?? null, programId, pickupId, args.status ?? null],
  );
  if (!rows[0]) throw new Error("seed user insert failed");
  return rows[0].id;
}

async function upsertBus(plate: string, color: string, capacity: number, driverId: string): Promise<string> {
  const existing = await query<{ id: string }>(`SELECT id FROM buses WHERE plate_number = $1`, [plate]);
  if (existing.rows[0]) return existing.rows[0].id;
  const { rows } = await query<{ id: string }>(
    `INSERT INTO buses(plate_number, color, capacity, driver_id, status) VALUES ($1, $2, $3, $4, 'idle') RETURNING id`,
    [plate, color, capacity, driverId],
  );
  if (!rows[0]) throw new Error("seed bus insert failed");
  return rows[0].id;
}

async function ensurePayment(userId: string, year: number, month: number, status: "validated" | "pending" | "unpaid") {
  await withTx(async (client) => {
    await client.query(
      `INSERT INTO payments(user_id, period_year, period_month, amount_fcfa, status, paid_at, validated_at)
       VALUES ($1, $2, $3, 15000, $4,
               CASE WHEN $4 = 'validated' THEN NOW() ELSE NULL END,
               CASE WHEN $4 = 'validated' THEN NOW() ELSE NULL END)
       ON CONFLICT (user_id, period_year, period_month) DO UPDATE
         SET status = EXCLUDED.status,
             paid_at = EXCLUDED.paid_at,
             validated_at = EXCLUDED.validated_at`,
      [userId, year, month, status],
    );
  });
}

async function ensureReservation(userId: string, busId: string, pickup: string, year: number, month: number) {
  const pickupId = await getPickupId(pickup);
  if (!pickupId) return;
  await query(
    `INSERT INTO reservations(user_id, bus_id, pickup_point_id, period_year, period_month, status)
     VALUES ($1, $2, $3, $4, $5, 'confirmed')
     ON CONFLICT (user_id, period_year, period_month) DO UPDATE SET bus_id = EXCLUDED.bus_id, status = 'confirmed'`,
    [userId, busId, pickupId, year, month],
  );
}

async function main() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;

  logger.info("seed:start");

  await upsertUser({
    email: "admin@saintjeaningenieur.org",
    password: "Admin1234!",
    full_name: "Admin User",
    role: "admin",
  });

  const driverKofi = await upsertUser({
    email: "k.mensah@saintjeaningenieur.org",
    password: "Driver1234!",
    full_name: "Kofi Mensah",
    role: "driver",
  });
  const driverSamuel = await upsertUser({
    email: "s.atangana@saintjeaningenieur.org",
    password: "Driver1234!",
    full_name: "Samuel Atangana",
    role: "driver",
  });
  const driverEric = await upsertUser({
    email: "e.fouda@saintjeaningenieur.org",
    password: "Driver1234!",
    full_name: "Eric Fouda",
    role: "driver",
  });

  const bus1 = await upsertBus("LT 4892 A", "Blue", 30, driverKofi);
  const bus2 = await upsertBus("LT 2271 B", "White", 25, driverSamuel);
  const _bus3 = await upsertBus("LT 0055 C", "Yellow", 28, driverEric);
  void _bus3;

  // Students (subset matching mockups)
  const students = [
    { email: "n.mvondo@example.com",   name: "Nadège Mvondo",     sid: "SJI-2025-0001", program: "M2-CIVI", pickup: "POSTE_CENTRALE", pay: "validated" as const },
    { email: "jb.ngono@example.com",   name: "Jean-Baptiste Ngono", sid: "SJI-2025-0941", program: "M1-CIVI", pickup: "CARREFOUR_TKC", pay: "validated" as const },
    { email: "f.toure@example.com",    name: "Fatima Toure",       sid: "SJI-2025-0003", program: "L3-INFO", pickup: "VOGT",          pay: "validated" as const },
    { email: "b.yankep@example.com",   name: "Boris Yankep",       sid: "SJI-2025-0004", program: "L3-CIVI", pickup: "CARREFOUR_MEEC",pay: "unpaid"   as const },
    { email: "a.diallo@example.com",   name: "Aïssatou Diallo",    sid: "SJI-2025-0005", program: "L2-INFO", pickup: "CARREFOUR_MEEC",pay: "pending"  as const },
    { email: "r.atanga@example.com",   name: "Rodrigue Atanga",    sid: "SJI-2025-0006", program: "L2-INFO", pickup: "CARREFOUR_TKC", pay: "validated" as const },
    { email: "t.essomba@example.com",  name: "Thierry Essomba",    sid: "SJI-2025-0007", program: "L1-MECA", pickup: "FAMASSI",       pay: "pending"  as const },
    { email: "c.nkomo@example.com",    name: "Christelle Nkomo",   sid: "SJI-2025-0008", program: "L1-ELEC", pickup: "FAMASSI",       pay: "pending"  as const },
  ];

  for (const s of students) {
    const id = await upsertUser({
      email: s.email,
      password: "Student1234!",
      full_name: s.name,
      role: "student",
      student_id: s.sid,
      program: s.program,
      pickup: s.pickup,
    });
    await ensurePayment(id, year, month, s.pay);
    if (s.pay === "validated") {
      // Distribute across buses
      const bus = s.pickup === "POSTE_CENTRALE" || s.pickup === "FAMASSI" ? bus2 : bus1;
      await ensureReservation(id, bus, s.pickup, year, month);
    }
  }

  logger.info("seed:done");
  await pool.end();
}

main().catch((e) => {
  logger.error("seed:failed", { err: (e as Error).message });
  process.exit(1);
});
