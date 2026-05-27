# RMUTP ACCS — IoT-Based Door Access Control System

## 1. Project Overview
**RMUTP ACCS** is a Full-Stack IoT-Based Door Access Control System built for Rajamangala University of Technology Phra Nakhon (RMUTP). It integrates a web-based dashboard and dynamic QR code system with an ESP32 microcontroller to securely control physical door locks. The project is highly documented and includes extensive methodology, penetration testing, and security audit reports for university thesis purposes.

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