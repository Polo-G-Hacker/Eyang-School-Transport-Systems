ALTER TABLE buses ADD COLUMN IF NOT EXISTS pickup_point_id UUID REFERENCES pickup_points(id);

UPDATE buses
SET pickup_point_id = pp.id
FROM pickup_points pp
WHERE buses.pickup_point_id IS NULL
  AND (
    (buses.plate_number = 'LT 4892 A' AND pp.name = 'Carrefour TKC')
    OR (buses.plate_number = 'LT 2271 B' AND pp.name = 'Carrefour MEEC')
    OR (buses.plate_number = 'LT 0055 C' AND pp.name = 'Vogt')
  );

UPDATE reservations r
SET pickup_point_id = b.pickup_point_id
FROM buses b
WHERE r.bus_id = b.id
  AND b.pickup_point_id IS NOT NULL
  AND r.pickup_point_id <> b.pickup_point_id;

WITH unassigned AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY plate_number) AS rn
  FROM buses
  WHERE pickup_point_id IS NULL
),
usable_points AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY sort_order) AS rn
  FROM pickup_points
  WHERE name <> 'Eyang'
)
UPDATE buses b
SET pickup_point_id = up.id
FROM unassigned u
JOIN usable_points up ON up.rn = ((u.rn - 1) % (SELECT COUNT(*) FROM usable_points)) + 1
WHERE b.id = u.id;
