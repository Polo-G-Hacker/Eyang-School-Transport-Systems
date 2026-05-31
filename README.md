# Eyang School Transport System (ESTS)

![Eyang Logo](frontend/src/assets/Eyang_ESTS.png)

A comprehensive, full-stack school transport management system designed for environments with unstable internet connectivity. ESTS provides a seamless experience for students, drivers, and administrators to manage school bus operations, payments, and real-time tracking.

## 🚀 Key Features

### 🎓 For Students
- **Digital QR Pass:** Generate JWT-secured QR codes for boarding, available offline after initial sync.
- **Monthly Reservations:** Secure a seat on specific buses for the month.
- **Payment Management:** Track monthly transport fees and status.
- **Live Bus Tracking:** Real-time GPS tracking of school buses on an interactive map.
- **Smart Notifications:** Get alerted when a bus round starts or arrives at your pickup point.

### 🚛 For Drivers
- **Live Location Sharing:** Broadcast GPS coordinates to students during active rounds.
- **QR Attendance:** Scan student passes to log attendance, with offline support for remote areas.
- **Round Management:** Start and end transport rounds with automatic student notifications.

### 🛡️ For Administrators
- **Fleet Management:** Monitor bus status, capacity, and current locations.
- **User Administration:** Manage student and driver accounts, including approval workflows.
- **Payment Validation:** Verify and approve monthly transport payments.
- **Dashboard Analytics:** Overview of system activity and transport efficiency.

## 🛠️ Tech Stack

### Frontend
- **Framework:** [Ionic 8](https://ionicframework.com/) + [Angular 18](https://angular.io/)
- **Mobile:** [Capacitor 6](https://capacitorjs.com/) (Android)
- **Maps:** [Leaflet.js](https://leafletjs.com/)
- **Real-time:** [Socket.IO Client](https://socket.io/)
- **Offline Support:** Local caching and persistence logic for QR validation.

### Backend
- **Runtime:** [Node.js](https://nodejs.org/) (ES Modules)
- **Framework:** [Express.js](https://expressjs.com/)
- **Database:** [PostgreSQL](https://www.postgresql.org/)
- **Validation:** [Zod](https://zod.dev/)
- **Security:** JWT (JSON Web Tokens) for QR codes and auth, Bcrypt for passwords.
- **Mailing:** [Nodemailer](https://nodemailer.com/) for notifications and verification.

## 📦 Project Structure

```text
├── backend/            # Express.js API & Socket.io Server
│   ├── src/            # Source code (routes, middleware, services)
│   └── .env.example    # Environment variable template
├── frontend/           # Ionic Angular Mobile App
│   ├── src/app/        # Core logic, pages, and services
│   └── android/        # Capacitor Android project
├── database/           # SQL scripts
│   ├── schema.sql      # Database structure & constraints
│   └── seed.sql        # Initial data (pickup points, roles)
└── package.json        # Root scripts for project management
```

## ⚙️ Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [PostgreSQL](https://www.postgresql.org/)
- [Angular CLI](https://angular.io/cli) (`npm install -g @angular/cli`)
- [Ionic CLI](https://ionic.io/docs/intro/cli) (`npm install -g @ionic/cli`)

### 1. Clone & Install Dependencies
```powershell
# Install all dependencies (backend & frontend)
npm run install:all
```

### 2. Database Setup
1. Create a PostgreSQL database (e.g., `Eyang`).
2. Run the schema and seed scripts:
```powershell
# Using the backend script (ensure DATABASE_URL is set in environment)
npm --prefix backend run schema

# OR manually via psql
psql -d Eyang -f database/schema.sql
psql -d Eyang -f database/seed.sql

# Apply migrations if any
Get-ChildItem database/migrations/*.sql | ForEach-Object { psql -d Eyang -f $_.FullName }
```

### 3. Environment Configuration
Create a `.env` file in the `backend/` directory based on `.env.example`:
```env
PORT=3000
DATABASE_URL=postgres://user:password@localhost:5432/Eyang
JWT_SECRET=your_super_secret_key
QR_SECRET=your_qr_secret_key
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### 4. Running the Application

**Start Backend:**
```powershell
npm run backend
```

**Start Frontend (Web):**
```powershell
npm run frontend
```

**Run on Android:**
1. Ensure your phone and computer are on the same Wi-Fi.
2. Update `frontend/src/environments/environment.ts` with your computer's LAN IP.
3. Execute:
```powershell
npm run android
```

## 🔐 Security
- All sensitive routes are protected via JWT middleware.
- QR codes contain signed JWTs to prevent spoofing.
- Passwords are salted and hashed using Bcrypt.
- Input validation on all API endpoints using Zod.

## 📄 License
This project is private and intended for educational purposes at St Jean.

---
*Developed for the School Mobile App Development Course.*
