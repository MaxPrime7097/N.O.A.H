
import { WindowAnalysis, DriftState } from './types';
import { DailyLog } from '../types';

export const explanationBuilder = {
  build(analysis: WindowAnalysis, state: DriftState, logs: DailyLog[] = []): string {
    const sorted = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const recentLogs = sorted.slice(0, 7);
    
    const daysWithMissedAnchors = recentLogs.filter(l => 
      l.anchorsCompleted && l.anchorsCompleted.some(completed => !completed)
    ).length;

    const primaryAnchorMissesCount = recentLogs.filter(l => 
      l.anchorsCompleted && l.anchorsCompleted.length > 0 && !l.anchorsCompleted[0]
    ).length;

    if (analysis.dominantCategory === 'None' && analysis.recent.avg > 0.7) {
      if (primaryAnchorMissesCount > 0) {
        return `Your overall trend maintains strong alignment, but you missed your primary identity anchor in ${primaryAnchorMissesCount} of your recent check-ins. Since this behavior directly defines your target identity, missing it poses a silent threat to your alignment. True integrity requires consistency here.`;
      }
      if (daysWithMissedAnchors > 0) {
        return "Your overall trend maintains strong alignment and is currently stable, though some daily anchor deviations were observed in your recent logs. Maintain vigilance to prevent drift from resetting your baseline.";
      }
      return "Your actions match your goals. All metrics show you are doing what you committed to. No drift detected.";
    }

    const segments = [];

    // Primary Identity Anchor Warning
    if (primaryAnchorMissesCount > 0) {
      segments.push(`Crucially, you failed to execute your primary identity anchor in ${primaryAnchorMissesCount} of the last 7 monitored days. Relying on secondary indicators to stay aligned or dilute this deficiency is a form of passive drift.`);
    }

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
      if (analysis.dominantCategory === 'Time') {
        segments.push(`You are not spending enough time on your goal. In ${analysis.repetitionCount} of the last 7 days, your effort was below the threshold.`);
      } else if (analysis.dominantCategory === 'Energy') {
        segments.push(`Low energy is stalling your progress. You've reported fatigue or low focus in ${analysis.repetitionCount} of your recent check-ins.`);
      } else if (analysis.dominantCategory === 'Alignment') {
        segments.push(`You are missing your behavioral anchors. Even when you log time, you aren't doing the specific actions you committed to in ${analysis.repetitionCount} of your recent logs.`);
      }
    }

    return segments.length > 0 
      ? segments.join(" ") 
      : "We need more data to give a clear analysis. Continue checking in daily to establish a baseline.";
  }
};
