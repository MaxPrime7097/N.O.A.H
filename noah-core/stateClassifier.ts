
import { DriftState } from './types';

export const stateClassifier = {
  classify(score: number): { state: DriftState, confidence: number } {
    let state: DriftState = 'stable';
    if (score >= 4) state = 'critical';
    else if (score === 3) state = 'drift';
    else if (score === 2) state = 'fragile';
    else state = 'stable';

    // Confidence derived from data density (pseudo-confidence)
    // 100 base, reduced by high instability
    const confidence = Math.max(40, 95 - (score * 5));

    return { state, confidence };
  }
};
