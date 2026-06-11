# Email Configuration Guide (Brevo / Sendinblue)

To enable **Account Verification** and the **Forgot Password** feature, you need to configure an SMTP server. **Brevo** is the recommended provider for this project.

## 1. Get your Brevo SMTP Credentials
1. Create a free account at [Brevo.com](https://www.brevo.com/).
2. Go to **SMTP & API** in your dashboard.
3. Click on the **SMTP** tab to find your credentials.
4. (Recommended) Go to **Senders & IP** to verify your domain or email address to ensure deliverability.

## 2. Update Backend Configuration
Update your `.env` file in the `backend/` directory:

```env
# Brevo SMTP Settings
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your-brevo-email@example.com
SMTP_PASS=your-brevo-smtp-key-xxxxxx
MAIL_FROM="Eyang Transport <no-reply@yourdomain.com>"

# App URL
APP_URL=http://localhost:8100
```

## 3. Local Development (No Config)
If these variables are not set, the system will log the links to the backend terminal:
- **Verification:** `Email verification for user@example.com: http://localhost:8100/verify-email?token=...`
- **Password Reset:** `Password reset for user@example.com: http://localhost:8100/reset-password?token=...`
