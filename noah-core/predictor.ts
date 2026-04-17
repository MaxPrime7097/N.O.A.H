
import { DriftState, RiskLevel } from './types';

const riskTable: Record<DriftState, { '7d': RiskLevel, '14d': RiskLevel, '30d': RiskLevel }> = {
  stable: { '7d': 'low', '14d': 'low', '30d': 'low' },
  fragile: { '7d': 'medium', '14d': 'medium', '30d': 'high' },
  drift: { '7d': 'medium', '14d': 'high', '30d': 'high' },
  critical: { '7d': 'high', '14d': 'high', '30d': 'high' }
};

export const predictor = {
  predict(state: DriftState) {
    return riskTable[state];
  }
};
