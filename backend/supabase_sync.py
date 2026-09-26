"""
VeriDrive AI - Supabase Backend Synchronization Utility
Standalone sync runner to populate, sync, and verify database state between
Python AI service and Supabase PostgreSQL instance.
"""

import sys
import os
import json
import logging
from pathlib import Path

# Ensure backend directory is in python path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from supabase_client import supabase_backend_client, SupabaseBackendClient

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("veridrive.sync")


def test_supabase_connection():
    """CLI action: Verifies connection to Supabase instance."""
    print("\n[+] Checking Supabase Backend Database Connection...")
    client = supabase_backend_client
    
    if not client.is_configured:
        print("[!] Supabase URL / Key is NOT configured in environment.")
        print("    Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your .env file.")
        return False

    status = client.check_connection()
    if status.get("status") == "connected":
        print(f"[OK] Successfully connected to Supabase project: {client.url}")
        return True
    else:
        print(f"[!] Connection check result: {status}")
        return False


def seed_demo_data_to_supabase():
    """
    Seeds sample automotive requirements and test cases into Supabase
    so the frontend and backend share synchronized data.
    """
    print("\n[+] Seeding Demo Automotive Requirements & Test Cases to Supabase...")
    client = supabase_backend_client

    if not client.is_configured:
        print("[!] Supabase not configured. Skipping seeding.")
        return

    # Sample ISO 26262 Automotive Requirement
    demo_req = {
        "requirement_key": "REQ-TLM-001",
        "raw_text": "The telematics ECU shall transmit vehicle GPS position every 10 seconds when ignition is ON and LTE cellular connection is registered.",
        "component": "Telematics ECU (TCU)",
        "requirement_type": "Functional / Communication"
    }

    demo_analysis = {
        "inputs": ["Ignition Status (KL15)", "GNSS Fix Quality", "LTE Module Registration"],
        "outputs": ["Cloud MQTT GPS Payload (0x390)"],
        "conditions": ["Ignition ON (12V active)", "Cellular network registered"],
        "constraints": ["Transmission period: 10.0s +- 0.25s"],
        "interfaces": ["CAN3_Body", "LTE-M Modem"],
        "dependencies": ["UDS Diagnostic Manager", "GNSS Firmware"],
        "risks": ["Buffer overflow on cloud loss", "GPS spoofing vulnerability"]
    }

    # Save requirement
    req_res = client.save_requirement(
        requirement_key=demo_req["requirement_key"],
        raw_text=demo_req["raw_text"],
        analysis_data=demo_analysis,
        component=demo_req["component"],
        requirement_type=demo_req["requirement_type"]
    )
    print(f"[*] Requirement Seed Status: {req_res.get('status')}")

    # Sample Generated Test Cases
    demo_tests = [
        {
            "test_id": "TC-TLM-001-01",
            "title": "Nominal 10-Second Cloud Telemetry Transmission",
            "category": "Happy-Path",
            "priority": "HIGH",
            "risk": "HIGH",
            "preconditions": ["KL15 is active", "Cellular LTE registered", "GNSS HDOP < 1.5"],
            "steps": [
                "Initialize TCU bench with KL15 active.",
                "Monitor CAN3 0x390 uplink message timestamps over 60 seconds."
            ],
            "expected_result": "6 telemetry packets sent at exactly 10.0s +- 0.25s interval.",
            "reason_generated": "Verify baseline cadence requirement."
        },
        {
            "test_id": "TC-TLM-001-02",
            "title": "LTE Connection Loss Queueing and Buffer Recovery",
            "category": "Communication",
            "priority": "CRITICAL",
            "risk": "CRITICAL",
            "preconditions": ["KL15 active", "LTE RF signal attenuation set to -120dBm"],
            "steps": [
                "Simulate LTE dropped connection for 60 seconds.",
                "Restore LTE connection and inspect cloud message queue."
            ],
            "expected_result": "TCU buffers exactly 6 packets in NVM and flushes sequence without data loss.",
            "reason_generated": "Verify fault recovery during network outage."
        }
    ]

    tc_res = client.save_test_cases(demo_req["requirement_key"], demo_tests)
    print(f"[*] Test Cases Seed Status: {tc_res.get('status')} ({tc_res.get('count', 0)} saved)")

    # Sample Run Execution
    run_res = client.save_test_run_results(
        requirement_key=demo_req["requirement_key"],
        run_name="Automated Bench HIL Simulation Run #1",
        test_results=[
            {"status": "PASS", "observed_result": "6 packets received with 10.01s mean cadence"},
            {"status": "PASS", "observed_result": "All 6 buffered messages recovered upon reconnection"}
        ]
    )
    print(f"[*] Test Run Seed Status: {run_res.get('status')}\n")


if __name__ == "__main__":
    print("==========================================================")
    print(" VeriDrive AI - Supabase Backend Integration CLI ")
    print("==========================================================")

    conn_ok = test_supabase_connection()
    if conn_ok:
        seed_demo_data_to_supabase()
        print("[OK] Supabase & Backend synchronization completed successfully!")
    else:
        print("[!] Note: You can add Supabase credentials in your .env file to enable live persistence.")
