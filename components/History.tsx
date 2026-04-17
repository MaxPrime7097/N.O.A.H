
import React, { useMemo, useState, useEffect } from 'react';
import { DailyLog, EnergyLevel, UserIdentity } from '../types';
import { noahCoreEngine } from '../noah-core/engine';
import { Download, Activity } from 'lucide-react';
import { DriftState } from '../noah-core/types';

interface Props {
  logs: DailyLog[];
  identity?: UserIdentity;
  loading?: boolean;
}

const HistorySkeleton = () => (
  <div className="w-full space-y-12 animate-pulse pt-8">
    <header className="flex justify-between items-end">
      <div className="space-y-2">
        <div className="h-6 w-32 bg-white/10 rounded" />
        <div className="h-3 w-24 bg-white/5 rounded" />
      </div>
      <div className="h-3 w-20 bg-white/5 rounded" />
    </header>
    <div className="noah-card p-6 h-32 border-white/5 bg-muted/10" />
    <div className="grid grid-cols-3 gap-4">
      <div className="noah-card p-4 h-12 bg-white/5" />
      <div className="noah-card p-4 h-12 bg-white/5" />
      <div className="noah-card p-4 h-12 bg-white/5" />
    </div>
    <div className="space-y-6">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="flex justify-between items-center border-b border-white/5 pb-4">
          <div className="space-y-2">
            <div className="h-3 w-24 bg-white/10 rounded" />
            <div className="h-2 w-16 bg-white/5 rounded" />
          </div>
          <div className="h-3 w-3 bg-white/10 rounded-sm" />
        </div>
      ))}
    </div>
  </div>
);

const History: React.FC<Props> = ({ logs, identity, loading: externalLoading }) => {
  const [internalLoading, setInternalLoading] = useState(true);

  useEffect(() => {
    // Artificial brief delay to allow skeleton to be perceived during "processing"
    const timer = setTimeout(() => setInternalLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const isLoading = externalLoading || internalLoading;

  const handleExport = () => {
    const fullState = {
      identity: identity,
      logs: logs,
      exportedAt: new Date().toISOString(),
      version: "2.0"
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullState, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `noah_node_${identity?.role || 'backup'}_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const history = useMemo(() => {
    return [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 7);
  }, [logs]);
  
  const stats = useMemo(() => {
    if (logs.length === 0) return null;
    const last7 = logs.slice(-7);
    const totalTime = last7.reduce((acc, curr) => acc + curr.timeSpent, 0);
    
    const energyMap: Record<EnergyLevel, number> = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3 };
    const avgEnergyVal = last7.reduce((acc, curr) => acc + energyMap[curr.energy], 0) / last7.length;
    let avgEnergyLabel: EnergyLevel = 'MEDIUM';
    if (avgEnergyVal < 1.5) avgEnergyLabel = 'LOW';
    else if (avgEnergyVal > 2.5) avgEnergyLabel = 'HIGH';

    return {
      totalTime,
      avgEnergy: avgEnergyLabel,
      frequency: last7.length,
      isComplete: last7.length >= 7
    };
  }, [logs]);

  const coreResult = useMemo(() => {
    if (logs.length === 0) return null;
    return noahCoreEngine.process(logs);
  }, [logs]);

  const visualization = useMemo(() => {
    if (!coreResult) return null;
    const signals = coreResult.rawSignals;
    const width = 300;
    const height = 40;
    const step = width / (signals.length - 1 || 1);
    
    const points = signals.map((val, i) => {
      const x = i * step;
      const y = height - (val * height);
      return `${x},${y}`;
    });

    const trendPoints = points.join(" ");
    const areaPoints = `0,${height} ${trendPoints} ${width},${height}`;

    const getColors = (state: DriftState) => {
      switch (state) {
        case 'stable': return { stroke: 'text-statusAligned', area: 'fill-statusAligned/5' };
        case 'fragile': return { stroke: 'text-statusFragile', area: 'fill-statusFragile/5' };
        case 'drift': return { stroke: 'text-statusDrift', area: 'fill-statusDrift/10' };
        case 'critical': return { stroke: 'text-red-600', area: 'fill-red-600/15' };
        default: return { stroke: 'text-accent', area: 'fill-accent/5' };
      }
    };

    return { trendPoints, areaPoints, style: getColors(coreResult.state) };
  }, [coreResult]);

  if (isLoading) {
    return <HistorySkeleton />;
  }

  if (logs.length === 0) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center text-center p-12 view-transition">
        <p className="text-[10px] font-mono tracking-widest uppercase text-textSecondary/50 max-w-[180px] leading-relaxed">
          No patterns yet. Reality starts today.
        </p>
      </div>
    );
  }

  const getIndicatorColor = (log: DailyLog) => {
    const completionRate = log.anchorsCompleted?.filter(Boolean).length || 0;
    if (completionRate >= 2 && log.timeSpent >= 60) return 'bg-statusAligned'; 
    if (completionRate >= 1 || log.timeSpent >= 30) return 'bg-textSecondary/40'; 
    return 'bg-statusDrift'; 
  };

  return (
    <div className="w-full flex-grow flex flex-col space-y-12 view-transition pt-8 pb-12 animate-fade-in">
      <header className="flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-[0.2em] uppercase text-textPrimary">History</h1>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-textSecondary/40">Signal Logs (7D)</p>
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center space-x-2 text-[9px] font-mono tracking-widest uppercase text-textSecondary/30 hover:text-textSecondary transition-colors active-feedback group"
          aria-label="Export full identity node as JSON"
        >
          <Download size={10} className="group-hover:text-textPrimary transition-colors" />
          <span>Export Node</span>
        </button>
      </header>

      {/* Enhanced Trajectory Plot */}
      <section className="noah-card p-6 space-y-6 border-white/5 bg-muted/10 relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 opacity-40">
            <Activity size={10} />
            <span className="text-[8px] font-mono tracking-widest uppercase">Trajectory Plot</span>
          </div>
          {coreResult && (
             <span className={`text-[8px] font-mono uppercase tracking-widest transition-colors duration-500 ${visualization?.style.stroke}`}>
              {coreResult.state.toUpperCase()} NODE (Drift: {coreResult.driftScore})
             </span>
          )}
        </div>

        {visualization ? (
          <div className="pt-4 relative">
             <svg className="w-full h-12 overflow-visible" viewBox="0 0 300 40" preserveAspectRatio="none" aria-hidden="true">
              {/* Area Fill */}
              <polyline
                fill="none"
                stroke="none"
                className={`${visualization.style.area} transition-all duration-700`}
                points={visualization.areaPoints}
                style={{ fill: 'currentColor' }}
              />
              {/* Background Guideline */}
              <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="text-textPrimary opacity-5"
                points={visualization.trendPoints}
              />
              {/* Active Signal Line */}
              <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`${visualization.style.stroke} transition-all duration-700 shadow-[0_0_10px_currentColor]`}
                points={visualization.trendPoints}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Glowing Indicator for current point */}
              {coreResult.rawSignals.length > 0 && (
                <circle 
                  cx="300" 
                  cy={40 - (coreResult.rawSignals[6] * 40)} 
                  r="3" 
                  className={`${visualization.style.stroke} fill-current animate-pulse`} 
                />
              )}
            </svg>
            <div className="flex justify-between mt-3">
              <span className="text-[7px] font-mono uppercase tracking-widest text-textSecondary/20">Log T-7</span>
              <span className="text-[7px] font-mono uppercase tracking-widest text-textSecondary/20">Active Window</span>
            </div>
          </div>
        ) : (
          <p className="text-[9px] font-mono text-textSecondary/20 text-center py-4">Insufficient signal history.</p>
        )}
      </section>

      {/* Weekly Summary */}
      {stats && (
        <section className="grid grid-cols-3 gap-4">
          <div className="noah-card p-4 text-center space-y-1">
            <span className="text-[7px] font-mono uppercase tracking-widest text-textSecondary/40">Total Time</span>
            <p className="text-xs font-mono text-textPrimary">{stats.totalTime}m</p>
          </div>
          <div className="noah-card p-4 text-center space-y-1">
            <span className="text-[7px] font-mono uppercase tracking-widest text-textSecondary/40">Energy</span>
            <p className="text-xs font-mono text-textPrimary">{stats.avgEnergy}</p>
          </div>
          <div className="noah-card p-4 text-center space-y-1">
            <span className="text-[7px] font-mono uppercase tracking-widest text-textSecondary/40">State</span>
            <p className="text-xs font-mono text-textPrimary uppercase">{coreResult?.state || '??'}</p>
          </div>
        </section>
      )}

      {/* Detailed List */}
      <div className="space-y-6" role="list">
        {history.map((log, idx) => {
          const date = new Date(log.date);
          const formattedDate = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
          
          return (
            <div key={idx} role="listitem" className="flex items-center justify-between group border-b border-white/5 pb-4 last:border-0 hover:bg-white/[0.01] transition-colors rounded-sm px-1">
              <div className="flex flex-col">
                <span className="text-[10px] font-mono tracking-[0.15em] text-textSecondary/80 group-hover:text-textPrimary transition-colors">
                  {formattedDate}
                </span>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-[9px] font-mono text-textSecondary/20">
                    {log.timeSpent}m
                  </span>
                  <span className="text-[9px] font-mono text-textSecondary/20">•</span>
                  <span className="text-[9px] font-mono text-textSecondary/20 uppercase tracking-tighter">
                    {log.state}
                  </span>
                </div>
              </div>
              
              <div 
                className={`w-2.5 h-2.5 rounded-sm ${getIndicatorColor(log)} transition-all duration-700 shadow-sm`} 
                role="img"
                aria-label={`Alignment indicator for ${formattedDate}`}
              />
            </div>
          );
        })}
      </div>

      <footer className="mt-auto pt-8 opacity-10 text-center">
        <p className="text-[8px] font-mono tracking-[0.6em] uppercase">
          NOAH Core v2.0 — Trajectory Analysis
        </p>
      </footer>
    </div>
  );
};

export default History;
