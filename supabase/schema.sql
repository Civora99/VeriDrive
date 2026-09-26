-- ====================================================================
-- VeriDrive AI: Supabase PostgreSQL Database Schema
-- Embedded Automotive Requirements-to-Validation Platform
-- ====================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- 2. CREATE TABLES
-- ====================================================================

-- 2.1 REQUIREMENTS TABLE
CREATE TABLE IF NOT EXISTS requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requirement_key TEXT NOT NULL UNIQUE,
    source_name TEXT,
    raw_text TEXT NOT NULL,
    component TEXT,
    requirement_type TEXT,
    summary TEXT,
    inputs JSONB DEFAULT '[]'::jsonb,
    outputs JSONB DEFAULT '[]'::jsonb,
    conditions JSONB DEFAULT '[]'::jsonb,
    constraints JSONB DEFAULT '[]'::jsonb,
    interfaces JSONB DEFAULT '[]'::jsonb,
    dependencies JSONB DEFAULT '[]'::jsonb,
    risks JSONB DEFAULT '[]'::jsonb,
    classification_confidence NUMERIC DEFAULT 0.9,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.2 ANALYSIS RUNS TABLE
CREATE TABLE IF NOT EXISTS analysis_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requirement_id UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
    model_name TEXT NOT NULL,
    analysis_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'COMPLETED',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.3 TEST CASES TABLE
CREATE TABLE IF NOT EXISTS test_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requirement_id UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
    test_key TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    objective TEXT,
    preconditions TEXT,
    test_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    inputs JSONB DEFAULT '{}'::jsonb,
    expected_result TEXT NOT NULL,
    pass_criteria TEXT NOT NULL,
    priority TEXT DEFAULT 'Medium',
    risk_level TEXT DEFAULT 'Medium',
    generated_by TEXT DEFAULT 'AI-Generator',
    critic_status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.4 TEST RUNS TABLE
CREATE TABLE IF NOT EXISTS test_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requirement_id UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
    run_name TEXT NOT NULL,
    total_tests INTEGER NOT NULL DEFAULT 0,
    passed INTEGER NOT NULL DEFAULT 0,
    failed INTEGER NOT NULL DEFAULT 0,
    blocked INTEGER NOT NULL DEFAULT 0,
    simulated BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.5 DEFECTS TABLE
CREATE TABLE IF NOT EXISTS defects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_case_id UUID NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    severity TEXT NOT NULL,
    description TEXT NOT NULL,
    expected_behavior TEXT NOT NULL,
    observed_behavior TEXT NOT NULL,
    likely_area TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.6 TEST RESULTS TABLE
CREATE TABLE IF NOT EXISTS test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_run_id UUID NOT NULL REFERENCES test_runs(id) ON DELETE CASCADE,
    test_case_id UUID NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    observed_result TEXT NOT NULL,
    failure_reason TEXT,
    defect_id UUID REFERENCES defects(id) ON DELETE SET NULL,
    execution_time_ms INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.7 TRACEABILITY LINKS TABLE
CREATE TABLE IF NOT EXISTS traceability_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requirement_id UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
    test_case_id UUID NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    coverage_type TEXT NOT NULL DEFAULT 'Functional',
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_req_test_link UNIQUE (requirement_id, test_case_id)
);

-- ====================================================================
-- 3. INDEXES
-- ====================================================================

-- Index on requirement_key
CREATE INDEX IF NOT EXISTS idx_requirements_requirement_key ON requirements(requirement_key);

-- Indexes on requirement_id
CREATE INDEX IF NOT EXISTS idx_analysis_runs_requirement_id ON analysis_runs(requirement_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_requirement_id ON test_cases(requirement_id);
CREATE INDEX IF NOT EXISTS idx_test_runs_requirement_id ON test_runs(requirement_id);
CREATE INDEX IF NOT EXISTS idx_traceability_links_requirement_id ON traceability_links(requirement_id);

-- Index on test_key
CREATE INDEX IF NOT EXISTS idx_test_cases_test_key ON test_cases(test_key);

-- Index on test_run_id
CREATE INDEX IF NOT EXISTS idx_test_results_test_run_id ON test_results(test_run_id);
CREATE INDEX IF NOT EXISTS idx_test_results_test_case_id ON test_results(test_case_id);

-- Indexes on status
CREATE INDEX IF NOT EXISTS idx_analysis_runs_status ON analysis_runs(status);
CREATE INDEX IF NOT EXISTS idx_test_cases_critic_status ON test_cases(critic_status);
CREATE INDEX IF NOT EXISTS idx_test_results_status ON test_results(status);

-- Additional foreign key performance index
CREATE INDEX IF NOT EXISTS idx_defects_test_case_id ON defects(test_case_id);
CREATE INDEX IF NOT EXISTS idx_traceability_links_test_case_id ON traceability_links(test_case_id);

-- ====================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- Enable RLS on all 7 application tables
ALTER TABLE requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE defects ENABLE ROW LEVEL SECURITY;
ALTER TABLE traceability_links ENABLE ROW LEVEL SECURITY;

-- Anonymous/Public access policies for Hackathon Demo MVP
-- Safe minimum required policies for demo environment

-- Requirements RLS
CREATE POLICY "Allow public full access to requirements"
    ON requirements FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- Analysis Runs RLS
CREATE POLICY "Allow public full access to analysis_runs"
    ON analysis_runs FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- Test Cases RLS
CREATE POLICY "Allow public full access to test_cases"
    ON test_cases FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- Test Runs RLS
CREATE POLICY "Allow public full access to test_runs"
    ON test_runs FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- Defects RLS
CREATE POLICY "Allow public full access to defects"
    ON defects FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- Test Results RLS
CREATE POLICY "Allow public full access to test_results"
    ON test_results FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- Traceability Links RLS
CREATE POLICY "Allow public full access to traceability_links"
    ON traceability_links FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);
