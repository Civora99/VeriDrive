import { StructuredRequirement } from '../types/requirements';

export interface RiskAnalysis {
  overall_risk_score: number; // 0 - 100
  risk_level: 'Critical (Safety ASIL-D)' | 'High' | 'Medium' | 'Low';
  contributing_factors: string[];
  mitigation_recommendations: string[];
}

export function computeRequirementRisk(req: StructuredRequirement): RiskAnalysis {
  let score = 20;
  const factors: string[] = [];
  const mitigations: string[] = [];

  // ASIL Weight
  if (req.asil_level === 'ASIL-D') {
    score += 40;
    factors.push('Highest Functional Safety classification (ASIL-D) under ISO 26262.');
    mitigations.push('Mandate hardware-redundant de-energization path and 100% MC/DC test coverage.');
  } else if (req.asil_level === 'ASIL-C') {
    score += 30;
    factors.push('High Functional Safety classification (ASIL-C).');
    mitigations.push('Require boundary value analysis and secondary hydraulic/mechanical fallback.');
  } else if (req.asil_level === 'ASIL-B') {
    score += 20;
    factors.push('Moderate Functional Safety classification (ASIL-B).');
  } else {
    score += 10;
  }

  // Timing Constraints
  const minLatency = req.timing_constraints.reduce(
    (min, tc) => Math.min(min, tc.max_latency_ms),
    Infinity
  );
  if (minLatency <= 30) {
    score += 25;
    factors.push(`Ultra-tight reaction deadline (<= ${minLatency}ms) requires hardware ISR or DMA.`);
    mitigations.push('Verify interrupt preemption latencies on HIL with microsecond digital analyzers.');
  } else if (minLatency <= 100) {
    score += 15;
    factors.push(`Tight timing deadline (<= ${minLatency}ms).`);
  }

  // High-Voltage or Actuator Interfaces
  const hasHvOrSafetyLines = req.interfaces.some(
    (i) => /high[- ]voltage|pyro|hvil|solenoid|pwm|driver/i.test(i)
  );
  if (hasHvOrSafetyLines) {
    score += 15;
    factors.push('Direct interface to high-voltage contactors or high-current solenoids.');
    mitigations.push('Incorporate reverse-polarity, flyback voltage spike, and short-circuit fault injection.');
  }

  const normalized = Math.min(100, Math.max(0, score));
  let level: RiskAnalysis['risk_level'] = 'Low';
  if (normalized >= 85) level = 'Critical (Safety ASIL-D)';
  else if (normalized >= 70) level = 'High';
  else if (normalized >= 45) level = 'Medium';

  return {
    overall_risk_score: normalized,
    risk_level: level,
    contributing_factors: factors,
    mitigation_recommendations: mitigations
  };
}
