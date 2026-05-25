-- ESTS Transport: initial schema
-- Idempotent: safe to re-run.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ROLES (lookup)
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
    id          SERIAL PRIMARY KEY,
    code        TEXT NOT NULL UNIQUE,    -- 'student' | 'driver' | 'admin'
    label       TEXT NOT NULL
);

INSERT INTO roles (code, label) VALUES
    ('student', 'Student'),
    ('driver',  'Driver'),
    ('admin',   'Administrator')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- ACADEMIC PROGRAMS (lookup, e.g. L1/L2/L3/M1/M2 with field)
-- ============================================================
CREATE TABLE IF NOT EXISTS academic_programs (
    id          SERIAL PRIMARY KEY,
    code        TEXT NOT NULL UNIQUE,    -- e.g. 'L1-INFO'
    level       TEXT NOT NULL,           -- 'L1' | 'L2' | 'L3' | 'M1' | 'M2'
    field       TEXT NOT NULL            -- e.g. 'Informatique'
);

-- ============================================================
-- USERS (single table for students, drivers, admins)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id             INT  NOT NULL REFERENCES roles(id),
    full_name           TEXT NOT NULL,
    email               TEXT NOT NULL UNIQUE,
    password_hash       TEXT NOT NULL,
    phone               TEXT,
    avatar_url          TEXT,
    student_id          TEXT UNIQUE,                 -- e.g. SJI-2025-0941 (students only)
    program_id          INT REFERENCES academic_programs(id),
    pickup_point_id     INT,                          -- FK added after pickup_points table
    is_email_verified   BOOLEAN NOT NULL DEFAULT FALSE,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    status              TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'disabled'
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_role            ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_status          ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_program         ON users(program_id);
CREATE INDEX IF NOT EXISTS idx_users_pickup          ON users(pickup_point_id);

-- ============================================================
-- EMAIL VERIFICATION TOKENS
-- ============================================================
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT NOT NULL,
    purpose     TEXT NOT NULL DEFAULT 'verify',  -- 'verify' | 'reset'
    expires_at  TIMESTAMPTZ NOT NULL,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_tokens_user ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_tokens_hash ON email_verification_tokens(token_hash);

-- ============================================================
-- PICKUP POINTS (fixed list with coordinates)
-- ============================================================
CREATE TABLE IF NOT EXISTS pickup_points (
    id          SERIAL PRIMARY KEY,
    code        TEXT NOT NULL UNIQUE,
    name        TEXT NOT NULL,
    latitude    NUMERIC(10, 7) NOT NULL,
    longitude   NUMERIC(10, 7) NOT NULL,
    is_destination BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order  INT NOT NULL DEFAULT 0
);

ALTER TABLE users
    ADD CONSTRAINT users_pickup_point_fk
    FOREIGN KEY (pickup_point_id) REFERENCES pickup_points(id);

-- ============================================================
-- BUSES
-- ============================================================
CREATE TABLE IF NOT EXISTS buses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plate_number    TEXT NOT NULL UNIQUE,
    color           TEXT NOT NULL,
    capacity        INT  NOT NULL CHECK (capacity > 0),
    driver_id       UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    status          TEXT NOT NULL DEFAULT 'idle',   -- 'idle' | 'on_route' | 'maintenance'
    last_seen_at    TIMESTAMPTZ,
    last_latitude   NUMERIC(10, 7),
    last_longitude  NUMERIC(10, 7),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_buses_driver ON buses(driver_id);
CREATE INDEX IF NOT EXISTS idx_buses_status ON buses(status);

-- Optional bus<->pickup_point assignments (a bus may serve several stops)
CREATE TABLE IF NOT EXISTS bus_stops (
    bus_id            UUID NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
    pickup_point_id   INT  NOT NULL REFERENCES pickup_points(id) ON DELETE CASCADE,
    sort_order        INT NOT NULL DEFAULT 0,
    PRIMARY KEY (bus_id, pickup_point_id)
);

-- ============================================================
-- PAYMENTS (one row per subscription period)
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period_year     INT  NOT NULL,
    period_month    INT  NOT NULL CHECK (period_month BETWEEN 1 AND 12),
    amount_fcfa     INT  NOT NULL DEFAULT 15000,
    status          TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'validated' | 'expired' | 'unpaid'
    paid_at         TIMESTAMPTZ,
    validated_at    TIMESTAMPTZ,
    validated_by    UUID REFERENCES users(id),
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, period_year, period_month)
);

CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_period ON payments(period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_payments_user   ON payments(user_id);

-- ============================================================
-- QR CODES (one per student per month)
-- ============================================================
CREATE TABLE IF NOT EXISTS qr_codes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payment_id      UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    token           TEXT NOT NULL UNIQUE,    -- signed JWT
    period_year     INT  NOT NULL,
    period_month    INT  NOT NULL,
    issued_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ NOT NULL,
    revoked_at      TIMESTAMPTZ,
    UNIQUE (user_id, period_year, period_month)
);

CREATE INDEX IF NOT EXISTS idx_qr_codes_user ON qr_codes(user_id);

-- ============================================================
-- RESERVATIONS (one per student per month for a bus)
-- ============================================================
CREATE TABLE IF NOT EXISTS reservations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bus_id          UUID NOT NULL REFERENCES buses(id) ON DELETE RESTRICT,
    pickup_point_id INT  NOT NULL REFERENCES pickup_points(id),
    period_year     INT  NOT NULL,
    period_month    INT  NOT NULL,
    status          TEXT NOT NULL DEFAULT 'confirmed', -- 'confirmed' | 'cancelled'
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, period_year, period_month)
);

CREATE INDEX IF NOT EXISTS idx_reservations_bus    ON reservations(bus_id, period_year, period_month, status);
CREATE INDEX IF NOT EXISTS idx_reservations_user   ON reservations(user_id);

-- ============================================================
-- PICKUP ROUNDS (driver initiates "Start Pickup Round")
-- ============================================================
CREATE TABLE IF NOT EXISTS pickup_rounds (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bus_id          UUID NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
    driver_id       UUID NOT NULL REFERENCES users(id),
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at        TIMESTAMPTZ,
    period_date     DATE NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')::date
);

CREATE INDEX IF NOT EXISTS idx_pickup_rounds_bus_date ON pickup_rounds(bus_id, period_date);

-- ============================================================
-- SWIPE RESPONSES (per student per pickup round)
-- ============================================================
CREATE TABLE IF NOT EXISTS swipe_responses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pickup_round_id UUID NOT NULL REFERENCES pickup_rounds(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    response        TEXT NOT NULL CHECK (response IN ('yes', 'no')),
    responded_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (pickup_round_id, user_id)
);

-- ============================================================
-- ATTENDANCE LOGS (each successful boarding)
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    bus_id          UUID NOT NULL REFERENCES buses(id),
    pickup_round_id UUID REFERENCES pickup_rounds(id),
    qr_code_id      UUID REFERENCES qr_codes(id),
    pickup_point_id INT  REFERENCES pickup_points(id),
    result          TEXT NOT NULL,    -- 'boarded' | 'denied'
    reason          TEXT,             -- when denied
    scanned_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    synced_from_offline BOOLEAN NOT NULL DEFAULT FALSE,
    client_event_id TEXT UNIQUE       -- offline dedupe key (uuid generated on device)
);

CREATE INDEX IF NOT EXISTS idx_attendance_user ON attendance_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_bus  ON attendance_logs(bus_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_logs(scanned_at);

-- Prevent the same QR being used twice in the same pickup round.
CREATE UNIQUE INDEX IF NOT EXISTS uq_attendance_round_user
    ON attendance_logs(pickup_round_id, user_id)
    WHERE pickup_round_id IS NOT NULL AND result = 'boarded';

-- ============================================================
-- GPS PINGS (driver position history; lightweight)
-- ============================================================
CREATE TABLE IF NOT EXISTS gps_pings (
    id              BIGSERIAL PRIMARY KEY,
    bus_id          UUID NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
    latitude        NUMERIC(10, 7) NOT NULL,
    longitude       NUMERIC(10, 7) NOT NULL,
    speed_kph       NUMERIC(6, 2),
    heading_deg     NUMERIC(5, 2),
    recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gps_bus_time ON gps_pings(bus_id, recorded_at DESC);

-- ============================================================
-- NOTIFICATIONS (out-of-band log; can be polled by clients)
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    body        TEXT NOT NULL,
    kind        TEXT NOT NULL,   -- 'payment' | 'qr' | 'pickup_round' | 'system'
    data        JSONB,
    read_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);

-- ============================================================
-- updated_at triggers
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END
$$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['users','buses','payments','reservations']
    LOOP
        EXECUTE format(
            'DROP TRIGGER IF EXISTS trg_%I_updated_at ON %I;
             CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I
             FOR EACH ROW EXECUTE FUNCTION set_updated_at();',
             t, t, t, t);
    END LOOP;
END
$$;
