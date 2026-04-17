
import { WindowAnalysis, DriftState } from './types';

export const explanationBuilder = {
  build(analysis: WindowAnalysis, state: DriftState): string {
    if (analysis.dominantCategory === 'None' && analysis.recent.avg > 0.7) {
      return "Your actions match your goals. All metrics show you are doing what you committed to. No drift detected.";
    }

    const segments = [];

    // Authenticity Check
    if (analysis.recent.authenticity < 0.4) {
      segments.push("Major gap detected: Your daily records do not match your actual time or tasks. This suggests a disconnect between your reporting and reality.");
    } else if (analysis.recent.authenticity < 0.7) {
      segments.push("Pattern disconnect: You are writing about progress, but your numbers (time and tasks) don't back up your words.");
    } else if (analysis.recent.authenticity < 0.85) {
      segments.push("Slight misalignment: Your daily actions aren't perfectly matching the identity you defined.");
    }

    // Volatility Check
    if (analysis.volatility > 0.4) {
      segments.push("Your effort is inconsistent. Large swings in performance make it difficult to maintain your target identity.");
    }

    // Category Specifics
    if (analysis.dominantCategory !== 'None') {
      const trend = analysis.delta < 0 ? "dropping" : "staying low";
      if (analysis.dominantCategory === 'Time') {
        segments.push(`You are not spending enough time on your goal. In ${analysis.repetitionCount} of the last 7 days, your effort was below the threshold.`);
      } else if (analysis.dominantCategory === 'Energy') {
        segments.push(`Low energy is stalling your progress. You've reported fatigue or low focus in ${analysis.repetitionCount} of your recent check-ins.`);
      } else if (analysis.dominantCategory === 'Alignment') {
        segments.push(`You are missing your behavioral anchors. Even when you log time, you aren't doing the specific actions you committed to.`);
      }
    }

    return segments.length > 0 
      ? segments.join(" ") 
      : "We need more data to give a clear analysis. Continue checking in daily to establish a baseline.";
  }
};
