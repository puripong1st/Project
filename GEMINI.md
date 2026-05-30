# Innovative system for managing access rights and controlling classroom access via wireless network

## 1. Project Overview
**SmartAccess** is a Full-Stack IoT-Based Door Access Control System built for Innovative system for managing access rights and controlling classroom access via wireless network (SmartAccess). It integrates a web-based dashboard and dynamic QR code system with an ESP32 microcontroller to securely control physical door locks. The project is highly documented and includes extensive methodology, penetration testing, and security audit reports for university thesis purposes.

### Core Features
- **Dynamic QR Access:** Students/Users register and scan QR codes for room access.
- **Enterprise Admin Dashboard:** Real-time grid showing database, ESP32 hardware, and Discord alert status.
- **Security & Compliance:** Developed in accordance with Thailand's Computer Crime Act (90-day log retention, secure pruning) and PDPA standards.
- **Automated PDF Export:** Generates official audit reports using `pdfkit`.
- **Discord Integration:** Real-time webhook notifications for security events.

## 2. Technology Stack

### Web Application (`my-app/`)
- **Framework:** Next.js 15+ (App Router) / React 19 / Serverless API routes
- **Language:** TypeScript
- **Styling:** Vanilla CSS + Tailwind CSS v4 (Harmony Palette Design System - Minimalist Glassmorphism)
- **Database:** Supabase PostgreSQL (using PgBouncer connection pooling and Row-Level Security)
- **Security/Crypto:** `bcryptjs` (password hashing), `jsonwebtoken` (JWT for session control)
- **PDF Generation:** `pdfkit`

### Hardware / IoT (`esp32/`, `esp32C1/`)
- **Microcontroller:** ESP32 (Tensilica 32-bit Dual-Core)
- **Display:** SPI TFT LCD (ILI9341 3.2 inch)
- **Actuators:** 5V/12V Relay Module (controlling a 280kg Electromagnetic Solenoid Lock), Active Buzzer
- **Communication:** HTTPS Client Polling to Vercel Next.js API

## 3. Directory Structure
- `/my-app/`: The Next.js full-stack web application.
  - `/my-app/app/`: Frontend pages and backend API routes (`/api`).
  - `/my-app/lib/`: Core logic, database connections, and external service integrations.
  - `/my-app/scripts/`: Utility scripts for testing (API tampering, offline mode, performance).
- `/esp32/` & `/esp32C1/`: C/C++ source code for the ESP32 microcontroller (Arduino IDE format `.ino`). Includes Wokwi simulation files.
- `/*.md`: Extensive project documentation, thesis chapters, methodology, and security testing reports (primarily in Thai).

## 4. Development & Setup Instructions

### Web Setup
1. Navigate to the web application directory:
   ```bash
   cd my-app
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables. Create `.env.local` in `my-app/` with the following variables:
   ```env
   # Database (Supabase PostgreSQL)
   DATABASE_URL="..." # Include PgBouncer port 6543
   
   # JWT Security
   JWT_SECRET="..."
   
   # ESP32 Config
   ESP32_IP="192.168.1.100"
   ESP32_PORT="80"
   ESP32_MOCK_MODE="true" # Set to true for local testing without hardware
   
   # Alerts
   DISCORD_WEBHOOK_URL="..."
   ```
4. Start the development server:
   ```bash
   npm run dev
   # OR use Turbopack for faster builds
   npm run dev:turbo
   ```
The frontend will be available at `http://localhost:3000` and the admin panel at `http://localhost:3000/admin/login`.

## 5. Development Conventions
- **Language:** Code is primarily written in TypeScript for the web app and C++ for the ESP32. Most user-facing documentation, UI labels, and thesis documents are in **Thai**.
- **Type Safety:** Adhere strictly to TypeScript types. Avoid `any`.
- **Styling:** Follow the existing minimalistic glassmorphism design system using Tailwind CSS and Vanilla CSS. Use the university colors: Purple (`#7C3AED`) and Pink (`#DB2777`).
- **Database:** Utilize Supabase features securely. Use `lib/db.ts` for established connection patterns. Note that the project recently migrated from postgreSQL to Supabase PostgreSQL for better serverless connection pooling.
- **Legal Compliance:** When touching logging or authentication features, ensure they respect the established Thai PDPA and Computer Crime Act requirements implemented in the system (e.g., 90-day retention policies, restricted deletion permissions).

## 6. System Manual Maintenance & AI Prompt (CRITICAL)
Whenever any system development, API addition, database schema change, UI change, or firmware improvement is implemented:
1. The developer/agent **MUST** immediately update the comprehensive documentation in `complete_system_manual_th.md` under the appropriate sections (primarily in section 71 onwards) in highly detailed, professional Thai.
2. The "อัปเดตล่าสุด" date and time metadata at the top of `complete_system_manual_th.md` **MUST** be updated to the exact current local time.
3. The compiler script **MUST** be executed from the project root: `node my-app/scripts/compile_manual.js` to automatically re-generate the pre-rendered `complete_system_manual_th.html` manuals in both locations.

**AI Developer Prompt to Reference:**
> [!NOTE]
> **AI Instruction for System Manual Updates:**
> "You are required to maintain the project manual `complete_system_manual_th.md` as the single source of truth for the thesis documentation. After completing any development task or feature implementation:
> 1. Carefully inspect the code changes you made across Next.js APIs, database queries, libraries, UI pages, or ESP32 firmware.
> 2. Locate the relevant sections at the end of `complete_system_manual_th.md` (e.g., §71.53, §71.51, §71.45, etc.) or create a new section at the end if none exists.
> 3. Document the changes exhaustively in professional academic Thai. Detail all new files, database tables/columns, query filters, API endpoints (payload, parameters, responses), event notifications, security measures, and firmware settings.
> 4. Go to line 4 of `complete_system_manual_th.md` and update `อัปเดตล่าสุด: YYYY-MM-DD HH:MM:SS (+07:00)` to the current date and time in Bangkok timezone.
> 5. Run the compile script from the workspace root: `node my-app/scripts/compile_manual.js` to propagate the changes to the HTML manual files. Verify that the build succeeds with no errors."