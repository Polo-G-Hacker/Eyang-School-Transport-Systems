WITH role_ids AS (
  SELECT
    (SELECT id FROM roles WHERE name='student') AS student_role,
    (SELECT id FROM roles WHERE name='driver') AS driver_role,
    (SELECT id FROM roles WHERE name='admin') AS admin_role
),
students AS (
  INSERT INTO users (id, role_id, full_name, email, password_hash, matricule, level_label, department, is_email_verified)
  SELECT '11111111-1111-1111-1111-111111111111', student_role, 'Jean-Baptiste Ngono',
         'student@saintjeaningenieur.org', '$2a$12$ym8ewKgGwbJ6d/5Dy1NMveYl7yT.8giXh26bBUeU6sWlIy6Lr0QZy',
         'SJ-2025-0341', 'Master 1', 'Genie Civil', TRUE
  FROM role_ids
  ON CONFLICT (email) DO NOTHING
),
driver AS (
  INSERT INTO users (id, role_id, full_name, email, password_hash, is_email_verified)
  SELECT '22222222-2222-2222-2222-222222222222', driver_role, 'Kofi Mensah',
         'driver@saintjeaningenieur.org', '$2a$12$51yz7i1mDQ6LCCiaKEtP3OJVWwihdls/VKWy0CnOue6QIpFYuVkry', TRUE
  FROM role_ids
  ON CONFLICT (email) DO NOTHING
),
admin AS (
  INSERT INTO users (id, role_id, full_name, email, password_hash, is_email_verified)
  SELECT '33333333-3333-3333-3333-333333333333', admin_role, 'Admin User',
         'admin@saintjeaningenieur.org', '$2a$12$TsSqqWqQ4HCf6KnvUW1fAevqWMeaHJZGZQLeAyHL2rn/sYIvPQbO.', TRUE
  FROM role_ids
  ON CONFLICT (email) DO NOTHING
)
INSERT INTO buses (id, driver_id, pickup_point_id, plate_number, color, capacity, status, last_lat, last_lng, last_seen_at) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', (SELECT id FROM pickup_points WHERE name='Carrefour TKC'), 'LT 4892 A', 'Blue', 30, 'on_route', 3.8678000, 11.5129000, NOW()),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NULL, (SELECT id FROM pickup_points WHERE name='Carrefour MEEC'), 'LT 2271 B', 'White', 25, 'on_route', 3.8721000, 11.5182000, NOW()),
('cccccccc-cccc-cccc-cccc-cccccccccccc', NULL, (SELECT id FROM pickup_points WHERE name='Vogt'), 'LT 0055 C', 'Yellow', 28, 'idle', NULL, NULL, NULL)
ON CONFLICT (plate_number) DO NOTHING;

INSERT INTO payments (student_id, month_key, amount_fcfa, status, validated_by, validated_at)
VALUES ('11111111-1111-1111-1111-111111111111', TO_CHAR(NOW(), 'YYYY-MM'), 15000, 'validated', '33333333-3333-3333-3333-333333333333', NOW())
ON CONFLICT (student_id, month_key) DO NOTHING;

INSERT INTO reservations (student_id, bus_id, pickup_point_id, month_key)
SELECT '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', id, TO_CHAR(NOW(), 'YYYY-MM')
FROM pickup_points WHERE name='Carrefour TKC'
ON CONFLICT (student_id, month_key) DO NOTHING;
