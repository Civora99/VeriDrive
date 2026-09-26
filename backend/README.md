# PACCAR TestPilot AI — Backend & AI Intelligence Layer 🚛⚡

Autonomous automotive software requirement analysis, test synthesis, adversarial quality critique, and simulated validation execution engine for embedded electronic control units (ECUs).

---

## 📌 Technology Stack

* **Python**: 3.11+ (Tested on Python 3.14)
* **Framework**: FastAPI (Asynchronous REST API)
* **Validation**: Pydantic v2 (Strict automotive schema validation)
* **AI Engine**: Google Gemini API (`gemini-3.8-flash`) via `google-genai`
* **Server**: Uvicorn ASGI
* **Configuration**: python-dotenv

---

## 🚀 Quickstart & Local Setup

### 1. Prerequisites
Ensure Python 3.11+ is installed:
```bash
python3 --version
```

### 2. Virtual Environment & Dependencies
From the repository root:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Environment Variables
Create your local `.env` file from `.env.example`:
```bash
cp .env.example .env
```

Configure your variables in `backend/.env`:
```env
# Google Gemini API Key from Google AI Studio (https://aistudio.google.com/)
GEMINI_API_KEY=your_gemini_api_key_here

# Recommended Gemini Model
GEMINI_MODEL=gemini-3.8-flash

# Set to true to force deterministic mock responses without calling Gemini
DEMO_MODE=false

# Allowed CORS origins for Next.js frontend
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Server settings
HOST=0.0.0.0
PORT=8000
```

> **Security Note**: Never commit `.env` or hardcode API keys. `.env` is ignored in `.gitignore`.

---

## 🏎️ Running the Backend Server

To start the FastAPI server with live hot-reloading:

```bash
uvicorn main:app --reload --port 8000
```

The server will be available at:
* **API Base URL**: `http://127.0.0.1:8000`
* **Interactive Swagger UI**: `http://127.0.0.1:8000/docs`
* **ReDoc Documentation**: `http://127.0.0.1:8000/redoc`

---

## 🛡️ Demo Mode (Fail-Safe Presentation Mode)

For hackathon demonstrations, the backend features built-in deterministic demo intelligence for the standard requirement:

> *"The telematics ECU shall transmit vehicle GPS position every 10 seconds when ignition is ON and cellular connectivity is available."*

* If `DEMO_MODE=true` is set in `.env`, the backend operates in offline demo mode.
* If Gemini is temporarily unavailable (e.g. 503 high demand or no network), the backend automatically engages deterministic automotive responses.
* The API will never crash during a live presentation.

---

## 📡 API Endpoints & Specifications

### 1. `GET /health`
Verifies backend service operational status and demo mode state.

**Example Request:**
```bash
curl -s http://127.0.0.1:8000/health
```

**Response:**
```json
{
  "status": "ok",
  "service": "PACCAR TestPilot AI",
  "version": "1.0.0",
  "demo_mode": false
}
```

---

### 2. `POST /analyze`
Extracts structured automotive engineering information from requirement text.

**Example Request:**
```bash
curl -s -X POST http://127.0.0.1:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "requirement": "The telematics ECU shall transmit vehicle GPS position every 10 seconds when ignition is ON and cellular connectivity is available."
  }'
```

**Response:**
```json
{
  "requirement_id": "REQ-001",
  "requirement_text": "The telematics ECU shall transmit vehicle GPS position every 10 seconds when ignition is ON and cellular connectivity is available.",
  "component": "Telematics ECU",
  "category": "Functional + Timing",
  "interfaces": ["GPS", "Cellular", "Cloud"],
  "inputs": ["Ignition", "GPS"],
  "outputs": ["Vehicle Position"],
  "constraints": ["10 seconds", "Ignition ON"],
  "dependencies": ["GPS", "Cellular Network", "Cloud"],
  "risks": ["GPS unavailable", "Cellular network unavailable", "ECU restart"],
  "conditions": ["Ignition ON", "Cellular connection available"]
}
```

---

### 3. `POST /generate-tests`
Generates an automotive validation test suite across functional, boundary, negative, timing, communication, fault, and recovery scenarios.

**Example Request:**
```bash
curl -s -X POST http://127.0.0.1:8000/generate-tests \
  -H "Content-Type: application/json" \
  -d '{
    "requirement": "The telematics ECU shall transmit vehicle GPS position every 10 seconds when ignition is ON and cellular connectivity is available."
  }'
```

**Response:**
```json
{
  "requirement_id": "REQ-001",
  "tests": [
    {
      "test_id": "TC-001",
      "requirement_id": "REQ-001",
      "title": "Normal GPS transmission at 10-second cadence",
      "category": "Functional",
      "priority": "HIGH",
      "risk": "HIGH",
      "preconditions": [
        "Ignition switch (KL15) is ON (12V active)",
        "Cellular modem registered on OEM APN network",
        "GNSS receiver has valid 3D satellite fix"
      ],
      "steps": [
        "1. Power bench with KL15 active and verified GPS lock.",
        "2. Establish secure TLS 1.3 session with cloud endpoint.",
        "3. Monitor cloud telemetry broker payloads over 60 seconds."
      ],
      "expected_result": "Telematics ECU transmits valid GPS position packets every 10.0 seconds (±500ms) with valid coordinate payload.",
      "reason_generated": "Verifies primary nominal operational requirement under standard vehicle operating conditions."
    }
  ],
  "count": 7,
  "disclaimer": "These are AI-generated validation scenarios for engineer review, not formal ISO 26262 certification or vehicle validation approval."
}
```

---

### 4. `POST /critic`
Evaluates the test suite for missing automotive scenarios, redundancies, and weak criteria.

**Example Request:**
```bash
curl -s -X POST http://127.0.0.1:8000/critic \
  -H "Content-Type: application/json" \
  -d '{
    "requirement": "The telematics ECU shall transmit vehicle GPS position every 10 seconds when ignition is ON and cellular connectivity is available.",
    "tests": [
      {
        "test_id": "TC-001",
        "requirement_id": "REQ-001",
        "title": "Normal GPS transmission",
        "category": "Functional",
        "priority": "HIGH",
        "risk": "HIGH",
        "preconditions": [],
        "steps": [],
        "expected_result": "Coordinates transmitted every 10s",
        "reason_generated": "Verify baseline"
      }
    ]
  }'
```

**Response:**
```json
{
  "coverage_percentage": 82,
  "covered_categories": ["Functional"],
  "missing_scenarios": [
    "Cellular recovery and buffered telemetry flush after network restoration",
    "Diagnostic trouble code (DTC) logging on persistent GPS failure"
  ],
  "duplicate_tests": [],
  "weak_tests": [],
  "recommendations": [
    "Add a recovery scenario to verify uplink re-establishment when network returns.",
    "Add a diagnostic check verifying ISO 14229 UDS DTC confirmation upon sensor disconnect."
  ],
  "additional_test_suggestions": [
    {
      "test_id": "TC-REC-001",
      "requirement_id": "REQ-001",
      "title": "Cellular reconnection telemetry recovery after tunnel outage",
      "category": "Recovery",
      "priority": "HIGH",
      "risk": "HIGH",
      "preconditions": ["Vehicle simulated passing through tunnel with 45-second cellular loss"],
      "steps": ["Restore cellular RF connectivity", "Verify buffered telemetry transmitted in FIFO order"],
      "expected_result": "Connection recovered within 3.5 seconds; buffered coordinates delivered without duplicates.",
      "reason_generated": "Fills critical missing scenario for transient network loss common on freight highway corridors."
    }
  ],
  "coverage_note": "The coverage percentage is an AI-estimated scenario coverage metric. It is NOT formal ISO 26262 verification coverage."
}
```

---

### 5. `POST /run-tests`
Simulated HIL/SIL execution endpoint for hackathon demonstration.

**Example Request:**
```bash
curl -s -X POST http://127.0.0.1:8000/run-tests \
  -H "Content-Type: application/json" \
  -d '{
    "tests": [
      {
        "test_id": "TC-001",
        "requirement_id": "REQ-001",
        "title": "Normal GPS transmission at 10-second cadence",
        "category": "Functional",
        "priority": "HIGH",
        "risk": "HIGH",
        "preconditions": [],
        "steps": [],
        "expected_result": "Transmits valid GPS position packets every 10s",
        "reason_generated": "Nominal verification"
      },
      {
        "test_id": "TC-007",
        "requirement_id": "REQ-001",
        "title": "Stale GPS position detection while vehicle is in motion",
        "category": "Boundary",
        "priority": "HIGH",
        "risk": "CRITICAL",
        "preconditions": [],
        "steps": [],
        "expected_result": "No invalid/stale GPS position is transmitted without warning flag",
        "reason_generated": "Stale-data boundary"
      }
    ]
  }'
```

**Response:**
```json
{
  "run_id": "RUN-CD9935",
  "results": [
    {
      "test_id": "TC-001",
      "status": "PASS",
      "observed_result": "Observed nominal telemetry transmission conforming to expected criteria (Transmits valid GPS position packets every 10s...).",
      "failure_reason": null,
      "potential_defect": null
    },
    {
      "test_id": "TC-007",
      "status": "FAIL",
      "observed_result": "Stale GPS position transmitted after GPS signal froze; payload lacked warning flag.",
      "failure_reason": "ECU firmware failed to assert data invalidity flag when coordinate buffer ceased updating.",
      "potential_defect": "Stale-data handling defect in telematics position manager."
    }
  ],
  "summary": {
    "total": 2,
    "passed": 1,
    "failed": 1,
    "blocked": 0
  },
  "simulation_note": "SIMULATED execution only for hackathon demonstration. Does not imply real vehicle or HIL bench execution."
}
```

---

## 🧪 Automated Backend Tests

To run the automated backend test suite verifying all 6 criteria:

```bash
PYTHONPATH=backend python3 backend/test_backend.py
```
