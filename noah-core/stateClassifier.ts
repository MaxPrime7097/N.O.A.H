
import { DriftState } from './types';

export const stateClassifier = {
  classify(score: number, logsLength: number = 8): { state: DriftState, confidence: number } {
    let state: DriftState = 'stable';
    if (logsLength < 8) {
      state = 'calibrating';
    } else {
      if (score >= 4) state = 'critical';
      else if (score === 3) state = 'drift';
      else if (score === 2) state = 'fragile';
      else state = 'stable';
    }

    // Confidence derived from data density (pseudo-confidence)
    // 100 base, reduced by high instability
    const baseConfidence = Math.max(40, 95 - (score * 5));
    // Proportional scaling for calibration / light datasets
    const ratio = logsLength === 0 ? 0 : Math.min(1, logsLength / 7);
    const confidence = Math.round(baseConfidence * ratio);

    return { state, confidence };
  }
};
