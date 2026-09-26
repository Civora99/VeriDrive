# VeriDrive AI 🚗⚡
### Autonomous Requirements-to-Validation Platform for Embedded Automotive Software

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Gemini API](https://img.shields.io/badge/Google_Gemini-2.5_Flash-orange?logo=google)](https://ai.google.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?logo=supabase)](https://supabase.com/)
[![ISO 26262](https://img.shields.io/badge/Standard-ISO_26262_ASIL--D-rose)]()

---

## 📌 Executive Overview
**VeriDrive AI** is an engineering-grade validation platform built specifically for automotive embedded systems (ECUs, VCU, BMS, ADAS, EPB, TCU, and CAN-FD/Ethernet gateways). 

Rather than functioning as a generic AI chatbot, VeriDrive AI behaves like a **Senior Automotive Systems Architect & Lead HIL Validation Engineer**:
1. It ingests unstructured OEM/Tier-1 software requirements (SRS / DOORS).
2. It extracts rigorous engineering schemas (ECU target, ASIL level, inputs, outputs, state triggers, deterministic millisecond timing constraints, network bus protocols, failure conditions, and ISO 14229 UDS DTC diagnostics).
3. It generates an exhaustive **10-Category Validation Suite** conforming to ISO 26262 Part 4.
4. An independent **AI Validation Critic** performs adversarial confirmation review to catch missing edge cases, eliminate vague expectations, and harden timing tolerances.
5. An interactive **Virtual HIL/SIL Test Bench** executes the suite with simulated real-time CAN bus telemetry, identifies ASIL-D safety violations, and outputs deep firmware root-cause insights.
6. A **Bidirectional Traceability Matrix (RTM)** guarantees auditable compliance.

---

## 🏎️ The 10 Automotive Validation Categories
VeriDrive AI enforces testing across all critical automotive domains:
1. **Happy-Path**: Nominal operation verifying functional baseline.
2. **Boundary**: Upper, lower, and exact threshold limits (e.g. 59.9°C vs 60.0°C).
3. **Negative**: Out-of-range inputs, unexpected transitions, and rejected stimuli.
4. **Timing**: Deterministic latency deadlines (≤ 30ms hardware de-energization, jitter tolerances).
5. **Communication-Loss**: Physical CAN bus-off, message timeout, dropped frames, CRC/alive-counter freezes.
6. **Fault-Injection**: Open circuits, sensor short-to-ground, and corrupted payload bits.
7. **Power-Cycle**: KL15 ignition toggling, KL30 battery brownouts, and NVM lockout persistence.
8. **Recovery**: Diagnostic unlock, return from degraded mode, and UDS 0x14 clears.
9. **Diagnostic**: ISO 14229 UDS DTC setting, freeze frame capture (Service 0x19), and clear verification.
10. **Cross-Component**: Multi-ECU synchronization (e.g. BMS emergency cutoff triggering Inverter DC-link active discharge).

---

## 🗺️ Product Architecture & User Journey

```
[Requirement Ingestion] (Text / Upload / Preset)
          │
          ▼
[AI Structured Extraction] ──► [ISO 26262 Quality & Testability Audit]
          │
          ▼
[10-Category Test Generation]
          │
          ▼
[Senior Automotive Safety Critic] ──► [Hardened & Augmented Test Suite]
          │
          ▼
[Bidirectional Traceability Matrix]
          │
          ▼
[Virtual HIL Test Bench Simulation] ──► [Real-time CAN Bus Telemetry Trace]
          │
          ▼
[Safety-Critical Failure Detected] ──► [Defect Insight & Firmware Root Cause Analysis]
```

---

## 🛠️ Tech Stack
- **Framework**: Next.js 16 (App Router, Turbopack, React 19)
- **Language**: TypeScript with strict automotive typing
- **Styling**: Tailwind CSS (Dark automotive engineering UI, high contrast, subtle grid, HUD styling)
- **AI Engine**: Google Gemini API (`@google/genai` with deterministic automotive fallback)
- **Database**: Supabase PostgreSQL (Full relational schema with in-memory fallback)
- **Visualizations**: Recharts (10-category radar/bar, ECU coverage, timing latency)
- **Icons**: Lucide React

---

## 🚀 Quickstart & Local Setup

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Anu020709/VeriDrive.git
cd VeriDrive
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Add your Google Gemini API key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```
*(Note: If no API key is provided, the platform automatically engages its built-in automotive synthesis engine so you can demo immediately!)*

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production (Vercel-compatible)
```bash
npm run build
npm start
```

---

## 🗄️ Database Schema (`supabase/schema.sql`)
The PostgreSQL schema covers:
- `requirements`: Raw text, parsed JSONB, ASIL level, ECU, risk scores.
- `analysis_runs`: Model metrics, testability scores, rule violations.
- `test_cases`: 10-category tests, steps, expected CAN frames, CAPL snippets.
- `test_runs`: HIL bench execution status, latencies.
- `test_results`: Millisecond measurements, step outputs, CAN traces.
- `defects`: ASIL-D root causes, CAN discrepancies, recommended firmware fixes.
- `traceability_links`: Bidirectional RTM mapping.

---

## 📋 Hackathon Demo Journey
1. **Dashboard (`/`)**: Inspect executive KPIs, 10-category distribution, and ECU coverage.
2. **Analyze (`/analyze`)**: Pick **REQ-BMS-042** (or paste your own). Click **"Extract & Analyze Requirement"**. Notice the structured inputs/outputs, millisecond timing deadlines, and ISO 26262 audit.
3. **Validation Suite (`/tests`)**: Click **"Generate Validation Suite"**. Filter by all 10 categories, inspect Vector CANoe CAPL scripts, and click **"Run AI Critic Review"** to see missing edge cases injected.
4. **Traceability (`/traceability`)**: Review the full Requirements Traceability Matrix and export to CSV.
5. **Simulation & Defect (`/execution`)**: Click **"Execute Virtual HIL Suite"**. Watch real-time CAN bus telemetry stream, observe the **ASIL-D Failure on Power-Cycle Reboot**, and review the **Defect Insight Card** detailing the bootloader GPIO race condition.

---

*Built with ❤️ for automotive software safety.*
