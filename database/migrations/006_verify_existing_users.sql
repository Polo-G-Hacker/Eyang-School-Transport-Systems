-- Verify all existing users and set the default for future users
UPDATE users SET is_email_verified = TRUE WHERE is_email_verified = FALSE;
ALTER TABLE users ALTER COLUMN is_email_verified SET DEFAULT TRUE;
