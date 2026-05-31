CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(24) UNIQUE NOT NULL
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id INTEGER NOT NULL REFERENCES roles(id),
  full_name VARCHAR(160) NOT NULL,
  email VARCHAR(180) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  matricule VARCHAR(40),
  level_label VARCHAR(80),
  department VARCHAR(120),
  photo_data_url TEXT,
  is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_approved BOOLEAN NOT NULL DEFAULT TRUE,
  is_disabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ
);

CREATE TABLE pickup_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(80) UNIQUE NOT NULL,
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,
  sort_order INTEGER NOT NULL
);

CREATE TABLE buses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID REFERENCES users(id),
  pickup_point_id UUID REFERENCES pickup_points(id),
  plate_number VARCHAR(40) UNIQUE NOT NULL,
  color VARCHAR(40) NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  status VARCHAR(24) NOT NULL DEFAULT 'idle',
  last_lat NUMERIC(10, 7),
  last_lng NUMERIC(10, 7),
  last_seen_at TIMESTAMPTZ
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES users(id),
  month_key CHAR(7) NOT NULL,
  amount_fcfa INTEGER NOT NULL DEFAULT 15000,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  validated_by UUID REFERENCES users(id),
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, month_key)
);

CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES users(id),
  bus_id UUID NOT NULL REFERENCES buses(id),
  pickup_point_id UUID NOT NULL REFERENCES pickup_points(id),
  month_key CHAR(7) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, month_key)
);

CREATE TABLE qr_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES users(id),
  payment_id UUID NOT NULL REFERENCES payments(id),
  month_key CHAR(7) NOT NULL,
  jwt TEXT NOT NULL,
  jti UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, month_key)
);

CREATE TABLE pickup_rounds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bus_id UUID NOT NULL REFERENCES buses(id),
  driver_id UUID NOT NULL REFERENCES users(id),
  status VARCHAR(20) NOT NULL DEFAULT 'started',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

CREATE TABLE attendance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  round_id UUID NOT NULL REFERENCES pickup_rounds(id),
  student_id UUID NOT NULL REFERENCES users(id),
  qr_code_id UUID REFERENCES qr_codes(id),
  bus_id UUID NOT NULL REFERENCES buses(id),
  status VARCHAR(20) NOT NULL,
  reason TEXT,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synced_from_device BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (round_id, student_id)
);

CREATE TABLE swipe_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  round_id UUID NOT NULL REFERENCES pickup_rounds(id),
  student_id UUID NOT NULL REFERENCES users(id),
  response VARCHAR(8) NOT NULL CHECK (response IN ('yes', 'no')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (round_id, student_id)
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  round_id UUID REFERENCES pickup_rounds(id),
  role_name VARCHAR(24),
  title VARCHAR(160) NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

CREATE TABLE notification_dismissals (
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dismissed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (notification_id, user_id)
);

INSERT INTO roles (name) VALUES ('student'), ('driver'), ('admin')
ON CONFLICT (name) DO NOTHING;

INSERT INTO pickup_points (name, latitude, longitude, sort_order) VALUES
('Carrefour TKC', 3.8819000, 11.5213000, 1),
('Carrefour MEEC', 3.8728000, 11.5157000, 2),
('Vogt', 3.8659000, 11.5122000, 3),
('Poste Centrale', 3.8666000, 11.5167000, 4),
('Famassi', 3.8566000, 11.5057000, 5),
('Eyang', 3.8451000, 11.4938000, 6)
ON CONFLICT (name) DO NOTHING;
