
import { WindowAnalysis } from './types';

export const driftDetector = {
  detect(analysis: WindowAnalysis): number {
    let score = 0;

    // 1. Negative trend delta -> +2
    if (analysis.delta < -0.1) {
      score += 2;
    }

    // 2. Repeated negative signals (>=3 same category) -> +2
    if (analysis.repetitionCount >= 3) {
      score += 2;
    }

    // 3. High instability -> +1
    if (analysis.recent.variance > 0.15) {
      score += 1;
    }

    // 4. Low Authenticity (Incoherent Data) -> +2
    // If authenticity is low, it suggests a disconnect between reality and logging.
    if (analysis.recent.authenticity < 0.7) {
      score += 2;
    }

    return score;
  }
};
