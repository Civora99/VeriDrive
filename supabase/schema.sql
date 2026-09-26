-- ====================================================================
-- VeriDrive AI: Supabase PostgreSQL Schema
-- Embedded Automotive Requirements-to-Validation Platform
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. REQUIREMENTS TABLE
CREATE TABLE IF NOT EXISTS requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    req_key VARCHAR(50) NOT NULL UNIQUE, -- e.g. REQ-BMS-042
    title VARCHAR(255) NOT NULL,
    raw_text TEXT NOT NULL,
    ecu VARCHAR(50) NOT NULL,            -- e.g. BMS, ADAS_ECU, EPB, TCU, VCU
    asil_level VARCHAR(20) NOT NULL,     -- QM, ASIL-A, ASIL-B, ASIL-C, ASIL-D
    category VARCHAR(50) NOT NULL,       -- Functional, Safety-Critical, Diagnostic, etc.
    structured_data JSONB NOT NULL,      -- Full parsed JSON representation
    risk_score INTEGER DEFAULT 0,        -- 0 - 100
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ANALYSIS RUNS TABLE
CREATE TABLE IF NOT EXISTS analysis_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    req_id UUID REFERENCES requirements(id) ON DELETE CASCADE,
    model_used VARCHAR(50) DEFAULT 'gemini-2.5-pro',
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    clarity_score INTEGER DEFAULT 85,
    testability_score INTEGER DEFAULT 90,
    rule_violations JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TEST CASES TABLE
CREATE TABLE IF NOT EXISTS test_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    req_id UUID REFERENCES requirements(id) ON DELETE CASCADE,
    test_case_key VARCHAR(60) NOT NULL UNIQUE, -- e.g. TC-BMS-042-01
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,             -- Happy-Path, Boundary, Timing, etc.
    asil_target VARCHAR(20) NOT NULL,
    test_data JSONB NOT NULL,                  -- Preconditions, steps, expected CAN/UDS
    critic_score INTEGER DEFAULT 85,
    revised_by_critic BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TEST RUNS (SUITE EXECUTIONS) TABLE
CREATE TABLE IF NOT EXISTS test_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    req_id UUID REFERENCES requirements(id) ON DELETE CASCADE,
    execution_environment VARCHAR(50) DEFAULT 'SIL_HIL_VirtualBench',
    status VARCHAR(30) DEFAULT 'COMPLETED',    -- RUNNING, COMPLETED, FAILED
    total_tests INTEGER DEFAULT 0,
    passed_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    average_latency_ms NUMERIC(8,2) DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TEST RESULTS TABLE
CREATE TABLE IF NOT EXISTS test_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id UUID REFERENCES test_runs(id) ON DELETE CASCADE,
    test_case_id UUID REFERENCES test_cases(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,               -- PASSED, FAILED, BLOCKED
    measured_latency_ms NUMERIC(8,2) NOT NULL,
    allowed_latency_ms NUMERIC(8,2) NOT NULL,
    execution_log JSONB NOT NULL,              -- CAN traces, step outputs, timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. DEFECTS TABLE
CREATE TABLE IF NOT EXISTS defects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    result_id UUID REFERENCES test_results(id) ON DELETE SET NULL,
    test_case_id UUID REFERENCES test_cases(id) ON DELETE CASCADE,
    req_id UUID REFERENCES requirements(id) ON DELETE CASCADE,
    severity VARCHAR(30) NOT NULL,             -- Critical (Safety ASIL-D), High, Medium, Low
    summary TEXT NOT NULL,
    root_cause TEXT NOT NULL,
    can_discrepancy TEXT NOT NULL,
    recommended_fix TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'Open',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TRACEABILITY LINKS TABLE
CREATE TABLE IF NOT EXISTS traceability_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    req_id UUID REFERENCES requirements(id) ON DELETE CASCADE,
    test_case_id UUID REFERENCES test_cases(id) ON DELETE CASCADE,
    verification_method VARCHAR(50) DEFAULT 'HIL_Sim',
    status VARCHAR(30) DEFAULT 'Fully_Covered',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_requirements_ecu ON requirements(ecu);
CREATE INDEX IF NOT EXISTS idx_requirements_asil ON requirements(asil_level);
CREATE INDEX IF NOT EXISTS idx_test_cases_req_id ON test_cases(req_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_category ON test_cases(category);
CREATE INDEX IF NOT EXISTS idx_test_results_run_id ON test_results(run_id);
CREATE INDEX IF NOT EXISTS idx_defects_req_id ON defects(req_id);
CREATE INDEX IF NOT EXISTS idx_traceability_req_test ON traceability_links(req_id, test_case_id);
