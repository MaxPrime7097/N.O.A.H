import { DailyLog, EnergyLevel } from '../types';
import { SignalMetrics, WindowAnalysis } from './types';

const energyValue: Record<EnergyLevel, number> = { 'LOW': 0.1, 'MEDIUM': 0.5, 'HIGH': 1.0 };
const NEGATIVE_THRESHOLD = 0.4;

export const signalAnalyzer = {
  calculateSingleLogMetric(l: DailyLog): number {
    const time = Math.min(l.timeSpent / 180, 1.0);
    const energy = l.energy && energyValue[l.energy] !== undefined ? energyValue[l.energy] : 0.5;
    const anchors = l.anchorsCompleted || [];
    
    let anchorRatio = 0;
    if (anchors.length > 0) {
      if (anchors.length === 3) {
        // Core Identity Anchor (index 0) has 50% weight, others have 25% weight each.
        const a1 = anchors[0] ? 0.5 : 0;
        const a2 = anchors[1] ? 0.25 : 0;
        const a3 = anchors[2] ? 0.25 : 0;
        anchorRatio = a1 + a2 + a3;
      } else {
        anchorRatio = anchors.filter(Boolean).length / anchors.length;
      }
    }
    
    // Core signal formula: Weighted towards Anchors (40%), Time (40%), and Energy (20%)
    return (time * 0.4) + (energy * 0.2) + (anchorRatio * 0.4);
  },

  analyze(logs: DailyLog[]): WindowAnalysis {
    const sorted = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const windowRecent = sorted.slice(0, 7);
    const windowPrevious = sorted.slice(7, 14);

    const recent = calculateMetrics(windowRecent);
    const previous = calculateMetrics(windowPrevious);
    
    const delta = recent.avg - previous.avg;
    const volatility = Math.abs(recent.avg - previous.avg) + (recent.variance * 2);

    let dominantCategory: 'Time' | 'Energy' | 'Alignment' | 'None' = 'None';
    let maxNeg = 0;

    if (windowRecent.length > 0) {
      const timeNeg = windowRecent.filter(l => l.timeSpent < 45).length;
      const energyNeg = windowRecent.filter(l => l.energy === 'LOW').length;
      const alignNeg = windowRecent.filter(l => (l.anchorsCompleted?.filter(Boolean).length || 0) === 0).length;

      maxNeg = Math.max(timeNeg, energyNeg, alignNeg);
      if (maxNeg > 0) {
        if (maxNeg === timeNeg) dominantCategory = 'Time';
        else if (maxNeg === energyNeg) dominantCategory = 'Energy';
        else dominantCategory = 'Alignment';
      }
    }

    return {
      recent,
      previous,
      delta,
      volatility,
      dominantCategory,
      repetitionCount: maxNeg
    };
  }
};

function calculateMetrics(logs: DailyLog[]): SignalMetrics {
  if (logs.length === 0) return { avg: 0, negCount: 0, variance: 0, authenticity: 1 };

  const values = logs.map(l => signalAnalyzer.calculateSingleLogMetric(l));

  // Advanced Authenticity Calculation
  const authenticityScores = logs.map(l => {
    let score = 1.0;
    const time = l.timeSpent;
    const anchors = l.anchorsCompleted || [];
    const completedCount = anchors.filter(Boolean).length;
    const noteLength = (l.note || "").trim().length;
    const energy = l.energy;
    const state = (l.state || "").toLowerCase();

    // Rule 1: Ghost Achievement (Anchors marked with 0 time)
    // Absolute critical disconnect
    if (time === 0 && completedCount > 0) score -= 0.8;

    // Rule 2: Effort Paradox (Significant time, 0 anchors)
    // Heavier penalty for extreme drift
    if (time > 90 && completedCount === 0) score -= 0.6;
    if (time > 120 && completedCount === 0) score -= 1.0; // Total signal disconnect

    // Rule 3: Velocity Check (Claiming all anchors in too little time)
    if (time < 30 && completedCount >= 2) score -= 0.4;

    // Rule 4: Documentation Integrity (Very short note for significant time)
    if (time > 90 && noteLength < 15) score -= 0.3;

    // Rule 5: State-Time Disparity (High performance words with low time)
    const perfWords = ['focus', 'productive', 'crushed', 'flow', 'efficient'];
    if (perfWords.some(w => state.includes(w)) && time < 15) score -= 0.4;

    return Math.max(0, score);
  });

  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const negCount = values.filter(v => v < NEGATIVE_THRESHOLD).length;
  const variance = values.length < 2 ? 0 : values.reduce((acc, v) => acc + Math.pow(v - avg, 2), 0) / values.length;
  const authenticity = authenticityScores.reduce((a, b) => a + b, 0) / authenticityScores.length;

  return { avg, negCount, variance, authenticity };
}
