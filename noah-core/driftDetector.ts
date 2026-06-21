
import { WindowAnalysis } from './types';
import { DailyLog } from '../types';

export const driftDetector = {
  detect(analysis: WindowAnalysis, logs: DailyLog[] = []): number {
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

    // 5. Primary Identity Anchor Check
    // Since the primary anchor directly defines the target identity and holds 50% of the weight,
    // missing it is a form of passive drift.
    if (logs.length > 0) {
      const sorted = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const recentLogs = sorted.slice(0, 7);
      const primaryAnchorMissesCount = recentLogs.filter(l => 
        l.anchorsCompleted && l.anchorsCompleted.length > 0 && !l.anchorsCompleted[0]
      ).length;

      if (primaryAnchorMissesCount === 1) {
        score += 2; // Fragile / Unstable
      } else if (primaryAnchorMissesCount === 2) {
        score += 3; // Drift / Drifting
      } else if (primaryAnchorMissesCount >= 3) {
        score += 4; // Critical / Drifting
      }
    }

    return score;
  }
};
