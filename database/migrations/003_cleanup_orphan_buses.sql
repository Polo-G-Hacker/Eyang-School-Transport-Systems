DELETE FROM buses b
WHERE b.driver_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM reservations r WHERE r.bus_id=b.id)
  AND NOT EXISTS (SELECT 1 FROM pickup_rounds pr WHERE pr.bus_id=b.id)
  AND NOT EXISTS (SELECT 1 FROM attendance_logs al WHERE al.bus_id=b.id);
