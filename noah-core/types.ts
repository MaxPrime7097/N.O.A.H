
export type DriftState = 'stable' | 'fragile' | 'drift' | 'critical';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface SignalMetrics {
  avg: number;
  negCount: number;
  variance: number;
  authenticity: number; // Correlation between anchors and time
}

export interface WindowAnalysis {
  recent: SignalMetrics;
  previous: SignalMetrics;
  delta: number;
  volatility: number; // Rate of change in signal
  dominantCategory: 'Time' | 'Energy' | 'Alignment' | 'None';
  repetitionCount: number;
}

export interface NoahResult {
  driftScore: number;
  state: DriftState;
  confidence: number;
  projections: {
    '7d': RiskLevel;
    '14d': RiskLevel;
    '30d': RiskLevel;
  };
  explanation: string;
  rawSignals: number[];
  meta: {
    authenticity: number;
    volatility: number;
  };
}
