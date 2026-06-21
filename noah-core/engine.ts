
import { DailyLog } from '../types';
import { NoahResult } from './types';
import { signalAnalyzer } from './signalAnalyzer';
import { driftDetector } from './driftDetector';
import { stateClassifier } from './stateClassifier';
import { predictor } from './predictor';
import { explanationBuilder } from './explanationBuilder';

export const noahCoreEngine = {
  process(logs: DailyLog[]): NoahResult {
    // 1. Signals -> Signal Analyzer
    const analysis = signalAnalyzer.analyze(logs);

    // 2. Signal Analyzer -> Drift Detector
    const driftScore = driftDetector.detect(analysis);

    // 3. Drift Detector -> State Classifier
    const { state, confidence } = stateClassifier.classify(driftScore);

    // 4. State Classifier -> Predictor
    const projections = predictor.predict(state);

    // 5. Predictor -> Explanation Builder
    const explanation = explanationBuilder.build(analysis, state, logs);

    // Calculate signals for last 7 days
    const recentLogs = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-7);
    const calculatedSignals = recentLogs.map(l => signalAnalyzer.calculateSingleLogMetric(l));

    // Pad to 7 points for visualization stability
    const paddedSignals = Array(7).fill(0);
    calculatedSignals.forEach((sig, idx) => {
      paddedSignals[paddedSignals.length - calculatedSignals.length + idx] = sig;
    });

    // 6. Return NoahResult with metadata
    return {
      driftScore,
      state,
      confidence,
      projections,
      explanation,
      rawSignals: paddedSignals,
      meta: {
        authenticity: analysis.recent.authenticity,
        volatility: analysis.volatility
      }
    };
  }
};
