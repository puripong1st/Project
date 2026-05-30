# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SmartAccess — IoT-based door access control system for Innovative system for managing access rights and controlling classroom access via wireless network. Students register via a Next.js web app; an ESP32 microcontroller polls the backend to control a solenoid door lock and ILI9341 TFT display.

**Stack**: Next.js 16 (canary) · React 19 · TypeScript · PostgreSQL via Supabase (`pg` pool, raw SQL) · JWT auth · Tailwind CSS v4 · ESP32 Arduino firmware

## Repository Layout

```
my-app/          Next.js application (all web work happens here)
esp32/           Primary ESP32 firmware (Arduino .ino + Wokwi sim files)
esp32C1/         Alternate firmware for ESP32-C1 variant
```

## Commands

All commands run from `my-app/`:

```bash
npm run dev          # Start dev server (4 GB heap limit)
npm run dev:turbo    # Start with Turbopack
npm run build        # Production build
npm run lint         # ESLint 9 flat config
npm run clean        # Delete .next cache (PowerShell)
node scripts/compile_manual.js # Compile the system manual (runs from my-app/)
```

No test suite exists in this project.

## Architecture

### Request Flow

```
Browser/ESP32 → Next.js API Route → lib/ helper → Supabase PostgreSQL
                                  ↘ ESP32 HTTP (LAN direct call, fire-and-forget)
                                  ↘ Discord webhook (alerts)
```

### Key lib/ Modules

| File | Purpose |
|------|---------|
| `lib/db.ts` | PostgreSQL pool (Supabase SSL), auto-migration on first run, 30s settings cache |
| `lib/auth.ts` | JWT sign/verify (HS256, 8h expiry), httpOnly cookie helpers |
| `lib/esp32.ts` | Door unlock: writes command to DB queue, then fires async LAN call; supports mock/wokwi/physical modes via `ESP32_MODE` env var |
| `lib/qr.ts` | One-time QR tokens (consumed on scan, PNG output) |
| `lib/rate-limit.ts` | IP-based rate limiting: 10 login attempts/5 min, 3 bypass unlocks/min |
| `lib/pdf.ts` | Server-side landscape PDF reports via pdfkit |
| `lib/discord.ts` | Webhook alerts for door events |

### Database Tables

- `admin_users` — roles: `owner` | `door_operator`
- `students` — status: `pending` | `approved` | `rejected`
- `access_logs` — actions: registered, approved, rejected, door_opened, door_failed
- `dynamic_qr_tokens` — one-time tokens with `is_consumed` flag
- `system_settings` — key/value config store

Schema is created automatically by `lib/db.ts` on startup (no migration files needed).

### Auth Model

Admin sessions use JWT stored in an httpOnly cookie (`admin_token`). Role `owner` can manage other admins; `door_operator` can only approve/reject students and open doors. Public routes: student registration (`POST /api/students`), QR scan (`POST /api/esp32/qr/verify`).

### ESP32 Communication

The ESP32 polls `GET /api/esp32/display` every few seconds and authenticates with a pre-shared `X-API-Key` header. Door unlock from admin dashboard writes a command to the DB queue first, then the Next.js server attempts a direct LAN HTTP call to the ESP32 — the LAN call is best-effort; ESP32 will pick up the queued command on its next poll if the direct call fails.

Three modes controlled by `ESP32_MODE` env var: `mock` (no hardware needed), `wokwi` (simulator), `physical` (real device at `ESP32_IP`).

## Environment Variables

Copy `my-app/.env.example` to `my-app/.env.local`. Key variables:

```
DATABASE_URL              Supabase PostgreSQL connection string (with pgbouncer pooling)
DATABASE_URL_DIRECT       Direct connection (used for migrations/DDL)
JWT_SECRET                Random secret for token signing
ESP32_MODE                mock | wokwi | physical
ESP32_IP / ESP32_PORT     Hardware device address (physical mode only)
ESP32_API_KEY             Pre-shared key for ESP32 ↔ server auth
QR_SIGNING_KEY            Secret for QR token signing
DISCORD_WEBHOOK_URL       Optional alert channel
NEXT_PUBLIC_SUPABASE_URL  Supabase project URL
SUPABASE_SERVICE_ROLE_KEY Server-side Supabase key
```

## Security Constraints

These hardened behaviors must not be removed:

- Login rate-limited: 10 attempts per IP per 5 minutes (`lib/rate-limit.ts`)
- Bypass unlock rate-limited: 3 per student per minute
- Log cleanup requires owner password re-verification for records < 90 days old (Thai Computer Crime Act §26 compliance)
- All DB queries use parameterized `pg` queries — no string interpolation
- ESP32 API routes require `X-API-Key` header matching `ESP32_API_KEY`
- Admin creation: username `^[a-zA-Z0-9_.]{3,30}$`, password ≥ 8 chars

## ESP32 Firmware

`esp32/esp32.ino` targets ESP32 with ILI9341 TFT (320×240). Key pins: `RELAY_PIN=12`, `TFT_CS=15`, `TFT_DC=2`, `BUZZER_PIN=27`. Wokwi simulator config in `esp32/wokwi.toml` and `esp32/diagram.json`. Enable simulator mode with `#define WOKWI_SIM` at top of `.ino` file (already guarded with `#ifdef`).

## Styling

Brand colors: `#7C3AED` (SmartAccess purple) and `#DB2777` (Faculty of Education pink). Defined in `app/globals.css`. UI language is Thai (`<html lang="th">`).

## System Manual Maintenance
Always keep the comprehensive system manual `complete_system_manual_th.md` up-to-date and compile it after any changes. Follow the rules defined in `GEMINI.md` (§6):
1. Document Next.js APIs, database queries, libraries, UI, or firmware changes in Thai at the end of the manual.
2. Update the "อัปเดตล่าสุด" timestamp at line 4 of `complete_system_manual_th.md`.
3. Run the compiler from root: `node my-app/scripts/compile_manual.js` to re-generate the pre-rendered HTML manual files.
