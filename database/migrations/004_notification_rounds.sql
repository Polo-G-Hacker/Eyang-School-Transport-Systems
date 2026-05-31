ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS round_id UUID REFERENCES pickup_rounds(id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
ON notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_round
ON notifications (round_id);
