
import React, { useState, useEffect, useRef } from 'react';
import { UserIdentity, DailyLog, FeedbackData, AlignmentStatus } from '../types';
import { generateAlignmentFeedback, getDeepReflectiveAnalysis } from '../services/geminiService';
import { noahCoreEngine } from '../noah-core/engine';
import { NoahResult } from '../noah-core/types';
import { store } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, X, Activity, ShieldAlert } from 'lucide-react';

// Casting motion components to avoid type errors
const MotionDiv = motion.div as any;

// Added missing Props interface to resolve line 41 error
interface Props {
  identity: UserIdentity;
  logs: DailyLog[];
  onCycleReset: () => void;
  onLogsUpdated?: () => void;
}

const FeedbackSkeleton = () => (
  <div className="w-full max-w-xs space-y-10 animate-pulse pt-8">
    <div className="space-y-2 flex flex-col items-center">
      <div className="h-2 w-20 bg-white/5 rounded" />
      <div className="h-3 w-32 bg-white/10 rounded" />
    </div>
    <div className="h-16 w-full bg-white/5 rounded flex items-center justify-center">
      <div className="h-10 w-48 bg-white/10 rounded" />
    </div>
    <div className="noah-card p-5 border-white/5 bg-muted/5 space-y-6">
      <div className="h-2 w-24 bg-white/5 rounded" />
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><div className="h-2 w-10 bg-white/5 rounded" /><div className="h-3 w-12 bg-white/10 rounded" /></div>
        <div className="space-y-2"><div className="h-2 w-10 bg-white/5 rounded" /><div className="h-3 w-12 bg-white/10 rounded" /></div>
      </div>
      <div className="pt-4 border-t border-white/5 flex justify-between">
        <div className="h-4 w-8 bg-white/5 rounded" />
        <div className="h-4 w-8 bg-white/5 rounded" />
        <div className="h-4 w-8 bg-white/5 rounded" />
      </div>
    </div>
    <div className="noah-card p-6 border-white/5 bg-muted/20 h-24" />
    <div className="h-4 w-full bg-white/5 rounded" />
    <div className="h-12 w-full bg-accent/5 border border-accent/10 rounded" />
  </div>
);

const Feedback: React.FC<Props> = ({ identity, logs, onCycleReset, onLogsUpdated }) => {
  const [data, setData] = useState<FeedbackData | null>(null);
  const [coreResult, setCoreResult] = useState<NoahResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStatusOverlay, setShowStatusOverlay] = useState(false);
  
  const [deepAnalysis, setDeepAnalysis] = useState<string | null>(null);
  const [isAnalyzingDeeply, setIsAnalyzingDeeply] = useState(false);
  const [showDeepModal, setShowDeepModal] = useState(false);

  useEffect(() => {
    async function fetchTruth() {
      if (logs.length === 0) {
        setLoading(false);
        return;
      }

      setLoading(true);
      
      const core = noahCoreEngine.process(logs);
      setCoreResult(core);

      const latestLog = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      
      if (latestLog && latestLog.deepAnalysis) {
        setDeepAnalysis(latestLog.deepAnalysis);
      } else {
        setDeepAnalysis(null);
      }

      const cachedFeedback = store.getFeedbackForLog(latestLog.id);

      if (cachedFeedback) {
        setData(cachedFeedback);
      } else {
        const result = await generateAlignmentFeedback(identity, logs);
        setData(result);
        store.saveFeedbackForLog(latestLog.id, result);
        
        setShowStatusOverlay(true);
        setTimeout(() => setShowStatusOverlay(false), 800);
      }

      setLoading(false);
    }
    fetchTruth();
  }, [identity, logs]);

  const handleDeepReflection = async () => {
    setShowDeepModal(true);
    if (!deepAnalysis) {
      setIsAnalyzingDeeply(true);
      const latestLog = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      if (latestLog && latestLog.deepAnalysis) {
        setDeepAnalysis(latestLog.deepAnalysis);
        setIsAnalyzingDeeply(false);
      } else {
        const analysis = await getDeepReflectiveAnalysis(identity, logs);
        setDeepAnalysis(analysis);
        setIsAnalyzingDeeply(false);
        if (latestLog) {
          store.updateLogDeepAnalysis(latestLog.id, analysis);
          if (onLogsUpdated) {
            onLogsUpdated();
          }
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="flex-grow flex flex-col items-center px-4 overflow-hidden">
        <FeedbackSkeleton />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center space-y-4 text-center">
        <p className="text-[10px] font-mono tracking-widest uppercase text-textSecondary/40">No signal detected.</p>
        <p className="text-xs text-textSecondary max-w-[200px] leading-relaxed">The mirror remains dark until you perform your first check-in.</p>
      </div>
    );
  }

  if (!data || !coreResult) return null;

  const getStatusStyle = (status: AlignmentStatus) => {
    switch (status) {
      case 'ALIGNED': return { color: 'text-textPrimary', animation: '' };
      case 'UNSTABLE': return { color: 'text-textSecondary', animation: '' };
      case 'DRIFTING': return { color: 'text-accent', animation: 'animate-pulse-drift' };
      default: return { color: 'text-textSecondary', animation: '' };
    }
  };

  const style = getStatusStyle(data.status);

  return (
    <div className="flex-grow flex flex-col items-center py-8 text-center px-4 relative">
      <AnimatePresence>
        {showStatusOverlay && (
          /* Fixed motion.div with MotionDiv any cast */
          <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-bgMain z-[100] flex items-center justify-center pointer-events-none">
            <span className="text-[11px] font-mono tracking-[0.5em] uppercase text-textPrimary">Trajectory analyzed.</span>
          </MotionDiv>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeepModal && (
          /* Fixed motion.div with MotionDiv any cast */
          <MotionDiv 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-bgMain/95 z-[200] flex justify-center p-4 md:p-12 backdrop-blur-md overflow-y-auto no-scrollbar" 
            role="dialog" 
            aria-modal="true"
          >
            <div className="max-w-2xl w-full space-y-8 py-8 md:py-12">
              <div className="flex justify-between items-center sticky top-0 bg-bgMain/0 pb-4 z-10">
                <span className="text-[10px] font-mono tracking-[0.5em] uppercase text-accent bg-bgMain/80 px-2 backdrop-blur-sm rounded">Deep Thinking Mode</span>
                <button onClick={() => setShowDeepModal(false)} className="text-textSecondary/40 hover:text-textPrimary transition-colors active-feedback p-1">
                  <X size={20} />
                </button>
              </div>
              <div className="noah-card p-6 md:p-10 border-accent/20 bg-muted/10 min-h-[300px] flex flex-col justify-center">
                {isAnalyzingDeeply ? (
                  <div className="space-y-6 text-center">
                     {/* Fixed motion.div with MotionDiv any cast */}
                     <MotionDiv animate={{ opacity: [0.1, 1, 0.1], scale: [0.95, 1, 0.95] }} transition={{ repeat: Infinity, duration: 3 }} className="flex justify-center">
                      <BrainCircuit size={40} className="text-accent" />
                    </MotionDiv>
                    <p className="text-[10px] font-mono tracking-[0.3em] uppercase text-textSecondary/40 animate-pulse">Consulting deeper mirrors...</p>
                  </div>
                ) : (
                  /* Fixed motion.div with MotionDiv any cast */
                  <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <p className="text-sm md:text-base font-light leading-relaxed text-textPrimary text-left whitespace-pre-wrap">
                      {deepAnalysis}
                    </p>
                  </MotionDiv>
                )}
              </div>
              <p className="text-[9px] font-mono tracking-widest uppercase text-textSecondary/20 text-center pb-8">Thinking enabled by Gemini 3 Pro</p>
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>

      <div className="space-y-2 mb-8">
        <span className="text-[9px] font-mono tracking-[0.4em] uppercase text-textSecondary/30">Target Identity</span>
        <p className="text-xs font-medium tracking-widest text-textSecondary/60 uppercase">{identity.role}</p>
      </div>

      <div className="space-y-4 mb-10">
        {/* Replacing motion.h2 with standard h2 or any-casted version if needed */}
        <h2 className={`text-6xl font-bold tracking-[0.1em] font-mono transition-colors duration-1000 ${style.color} ${style.animation}`}>
          {data.status}
        </h2>
      </div>

      <div className="w-full max-w-xs space-y-8">
        <div className="noah-card p-5 border-white/5 bg-muted/5 space-y-6 text-left">
          <div className="flex items-center space-x-2 opacity-40">
            <Activity size={10} />
            <span className="text-[8px] font-mono tracking-widest uppercase">Signal Diagnostics [NOAH-CORE]</span>
          </div>
          <div className="grid grid-cols-2 gap-y-4">
            <div className="space-y-1">
              <span className="text-[7px] font-mono uppercase text-textSecondary/40 tracking-wider">State Confidence</span>
              <p className="text-xs font-mono text-textPrimary">{coreResult.confidence}%</p>
            </div>
            <div className="space-y-1">
              <span className="text-[7px] font-mono uppercase text-textSecondary/40 tracking-wider">Drift Score</span>
              <p className="text-xs font-mono text-textPrimary">{coreResult.driftScore}</p>
            </div>
          </div>
          <div className="pt-4 border-t border-white/5 space-y-3">
             <div className="flex items-center space-x-2 opacity-40">
              <ShieldAlert size={10} />
              <span className="text-[8px] font-mono tracking-widest uppercase">Risk Projections</span>
            </div>
            <div className="flex justify-between">
              <div className="text-center">
                <span className="text-[7px] font-mono text-textSecondary/30 block mb-1">7D</span>
                <span className={`text-[8px] font-mono uppercase ${coreResult.projections['7d'] === 'high' ? 'text-accent' : 'text-textPrimary/40'}`}>{coreResult.projections['7d']}</span>
              </div>
              <div className="text-center">
                <span className="text-[7px] font-mono text-textSecondary/30 block mb-1">14D</span>
                <span className={`text-[8px] font-mono uppercase ${coreResult.projections['14d'] === 'high' ? 'text-accent' : 'text-textPrimary/40'}`}>{coreResult.projections['14d']}</span>
              </div>
              <div className="text-center">
                <span className="text-[7px] font-mono text-textSecondary/30 block mb-1">30D</span>
                <span className={`text-[8px] font-mono uppercase ${coreResult.projections['30d'] === 'high' ? 'text-accent' : 'text-textPrimary/40'}`}>{coreResult.projections['30d']}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="noah-card p-6 border-white/5 bg-muted/20 text-left">
          <p className="text-sm font-light leading-relaxed text-textPrimary/80">
            {data.message}
          </p>
        </div>

        <div className="space-y-3 text-left">
          <h4 className="noah-title text-[9px] opacity-40">Core Signal Analysis</h4>
          <p className="text-[11px] text-textSecondary font-light leading-relaxed tracking-wide px-4">
            {coreResult.explanation}
          </p>
        </div>

        <button onClick={handleDeepReflection} className="flex items-center justify-center space-x-3 w-full border border-accent/20 py-4 text-[10px] font-mono tracking-[0.3em] uppercase text-accent hover:bg-accent/5 transition-all active-feedback">
          <BrainCircuit size={14} />
          <span>Request Deep Analysis</span>
        </button>
      </div>

      <footer className="mt-auto pt-12 opacity-20 pb-8">
        <p className="text-[9px] font-mono tracking-[0.5em] uppercase">Engine: NOAH Core 2.0</p>
      </footer>
    </div>
  );
};

export default Feedback;
