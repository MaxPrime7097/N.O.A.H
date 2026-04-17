
import React, { useMemo } from 'react';
import { UserIdentity, DailyLog } from '../types';
import { motion } from 'framer-motion';
import { Trophy, Target, Zap, Clock, AlertTriangle } from 'lucide-react';

// Casting motion components to avoid type errors
const MotionDiv = motion.div as any;

interface Props {
  identity: UserIdentity;
  logs: DailyLog[];
  onRecommit: () => void;
  onReset: () => void;
}

const Renewal: React.FC<Props> = ({ identity, logs, onRecommit, onReset }) => {
  const stats = useMemo(() => {
    if (logs.length === 0) return null;
    
    const totalTime = logs.reduce((acc, l) => acc + l.timeSpent, 0);
    const avgTime = Math.round(totalTime / logs.length);
    const anchorSuccess = logs.reduce((acc, l) => {
      const completed = l.anchorsCompleted?.filter(Boolean).length || 0;
      const total = l.anchorsCompleted?.length || 1;
      return acc + (completed / total);
    }, 0) / logs.length;
    
    const highEnergyDays = logs.filter(l => l.energy === 'HIGH').length;
    const frequency = logs.length;

    return {
      totalTime,
      avgTime,
      anchorScore: Math.round(anchorSuccess * 100),
      highEnergyPercent: Math.round((highEnergyDays / logs.length) * 100),
      frequency
    };
  }, [logs]);

  return (
    <div className="flex-grow flex flex-col items-center py-12 space-y-12 animate-fade-in">
      <header className="text-center space-y-4">
        {/* Fixed motion.div with MotionDiv any cast */}
        <MotionDiv 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-block p-4 rounded-full bg-accent/10 mb-4"
        >
          <Trophy size={32} className="text-accent" />
        </MotionDiv>
        <h1 className="text-xs font-mono tracking-[0.4em] uppercase text-accent">Cycle 01 Terminated</h1>
        <p className="text-4xl font-mono tracking-tighter text-textPrimary uppercase">{identity.role}</p>
      </header>

      {stats && (
        <section className="w-full max-w-sm grid grid-cols-2 gap-4">
          <StatCard 
            icon={<Clock size={14} />} 
            label="Investment" 
            value={`${stats.totalTime}m`} 
            sub={`Avg ${stats.avgTime}m/day`}
          />
          <StatCard 
            icon={<Target size={14} />} 
            label="Fidelity" 
            value={`${stats.anchorScore}%`} 
            sub={`${stats.frequency} Nodes recorded`}
          />
          <StatCard 
            icon={<Zap size={14} />} 
            label="Vitality" 
            value={`${stats.highEnergyPercent}%`} 
            sub="High energy state"
          />
          <StatCard 
            icon={<AlertTriangle size={14} />} 
            label="Duration" 
            value="30D" 
            sub="Full trajectory"
          />
        </section>
      )}

      <div className="max-w-xs space-y-6 text-center">
        <p className="text-sm font-light leading-relaxed text-textSecondary">
          The window for this operational identity has closed. Your patterns have been committed to the long-term mirror. 
        </p>
        <div className="h-[1px] w-12 bg-white/10 mx-auto" />
        <p className="text-[10px] font-mono tracking-widest text-textSecondary/40 uppercase">
          Signal integrity check: Passed.
        </p>
      </div>

      <div className="w-full max-w-sm space-y-4 pt-4">
        <button 
          onClick={onRecommit}
          className="w-full bg-accent py-5 text-[11px] font-mono tracking-[0.5em] uppercase hover:opacity-90 active-feedback shadow-[0_0_20px_rgba(20,80,40,0.1)] transition-all"
        >
          Recommit (New 30D Cycle)
        </button>
        <button 
          onClick={() => {
            if (confirm("Resetting will clear all identity parameters and history. This action is irreversible. Proceed?")) {
              onReset();
            }
          }}
          className="w-full border border-white/5 py-5 text-[11px] font-mono tracking-[0.5em] uppercase text-textSecondary/40 hover:text-textSecondary hover:border-white/10 active-feedback transition-all"
        >
          Reset Identity Node
        </button>
      </div>

      <footer className="mt-auto pt-12 opacity-10 text-center pb-8">
        <p className="text-[8px] font-mono tracking-[0.6em] uppercase">
          N.O.A.H — Archive generated {new Date().toLocaleDateString()}
        </p>
      </footer>
    </div>
  );
};

const StatCard = ({ icon, label, value, sub }: { icon: React.ReactNode, label: string, value: string, sub: string }) => (
  <div className="noah-card p-5 space-y-3 bg-muted/5 border-white/5">
    <div className="flex items-center space-x-2 text-textSecondary/40">
      {icon}
      <span className="text-[8px] font-mono uppercase tracking-widest">{label}</span>
    </div>
    <div className="space-y-1">
      <p className="text-xl font-mono text-textPrimary">{value}</p>
      <p className="text-[8px] font-mono uppercase text-textSecondary/20 tracking-tighter">{sub}</p>
    </div>
  </div>
);

export default Renewal;
