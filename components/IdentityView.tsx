
import React, { useState } from 'react';
import { UserIdentity } from '../types';
import { ChevronDown, Copy, Check, Fingerprint, Clock, Edit2, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { store } from '../store';

// Casting motion components to avoid type errors
const MotionDiv = motion.div as any;

interface Props {
  identity: UserIdentity;
}

const IdentityView: React.FC<Props> = ({ identity: initialIdentity }) => {
  const [identity, setIdentity] = useState<UserIdentity>(initialIdentity);
  const [showNodeInfo, setShowNodeInfo] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [newTime, setNewTime] = useState(identity.checkInTime);
  
  const start = new Date(identity.created_at).getTime();
  const now = new Date().getTime();
  const diffTime = now - start;
  const daysPassed = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  const daysRemaining = Math.max(0, 30 - daysPassed);
  const progressPercent = Math.min((daysPassed / 30) * 100, 100);

  const handleCopyNodeId = () => {
    navigator.clipboard.writeText(identity.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveTime = () => {
    const updated = { ...identity, checkInTime: newTime };
    store.saveIdentity(updated);
    setIdentity(updated);
    setIsEditingTime(false);
  };

  return (
    <div className="w-full flex-grow flex flex-col space-y-10 view-transition pb-12">
      <header className="space-y-4 pt-6">
        <h1 className="text-xs font-mono tracking-[0.3em] uppercase text-textSecondary opacity-40">Operational Identity</h1>
        <p className="text-4xl font-mono tracking-tighter uppercase text-textPrimary">{identity.role}</p>
      </header>

      {/* Node ID Collapsible */}
      <section className="noah-card overflow-hidden">
        <button 
          onClick={() => setShowNodeInfo(!showNodeInfo)} 
          className="w-full flex items-center justify-between p-4 active-feedback"
        >
          <div className="flex items-center space-x-2">
            <Fingerprint size={12} className="text-textSecondary/40" />
            <span className="noah-title">Node Signature</span>
          </div>
          <ChevronDown size={14} className={`text-textSecondary/40 transition-transform ${showNodeInfo ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence>
          {showNodeInfo && (
            /* Fixed motion.div with MotionDiv any cast */
            <MotionDiv 
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: 'auto', opacity: 1 }} 
              exit={{ height: 0, opacity: 0 }} 
              className="px-4 pb-4 space-y-4"
            >
              <div className="bg-bgMain p-3 border border-white/5 rounded-sm flex items-center justify-between group">
                <code className="text-[10px] font-mono text-textSecondary truncate mr-4">
                  {identity.id}
                </code>
                <button 
                  onClick={handleCopyNodeId} 
                  className="p-2 text-textSecondary/40 hover:text-textPrimary transition-colors active-feedback"
                  aria-label="Copy Node ID"
                >
                  {copied ? <Check size={12} className="text-accent" /> : <Copy size={12} />}
                </button>
              </div>
              <p className="text-[9px] font-mono tracking-widest text-textSecondary/20 uppercase text-center">Identity persistency token (Locked)</p>
            </MotionDiv>
          )}
        </AnimatePresence>
      </section>

      <section className="space-y-6">
        <h2 className="text-xs font-mono tracking-widest uppercase text-textSecondary">Observation Targets</h2>
        <div className="space-y-4">
          {identity.anchors.map((anchor, i) => (
            <div key={i} className="flex items-center space-x-4 border-b border-white/5 py-4 last:border-0">
              <span className="text-[10px] font-mono text-textSecondary opacity-30">{String(i + 1).padStart(2, '0')}</span>
              <span className="text-sm tracking-wide text-textPrimary/80">{anchor}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="pt-4 space-y-4">
        <div className="flex justify-between items-end">
          <h2 className="text-[10px] font-mono uppercase tracking-widest text-textSecondary">Cycle Fidelity</h2>
          <span className="text-sm font-mono text-textPrimary">{daysPassed}/30 Days</span>
        </div>
        <div className="h-[2px] w-full bg-white/5 overflow-hidden">
          {/* Fixed motion.div with MotionDiv any cast */}
          <MotionDiv 
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="h-full bg-accent" 
          />
        </div>
        
        <div className="flex justify-between items-center py-4 border-t border-white/5 mt-4">
           <p className="text-[10px] font-mono text-textSecondary/40 uppercase tracking-widest">
            {daysRemaining} Days remaining
          </p>
          <div className="flex items-center space-x-3">
            <Clock size={12} className="text-textSecondary/40" />
            {isEditingTime ? (
              <div className="flex items-center space-x-2">
                <input 
                  type="time" 
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="bg-bgSurface border border-white/10 text-[10px] font-mono text-textPrimary p-1 focus:outline-none focus:border-accent"
                />
                <button onClick={handleSaveTime} className="text-accent hover:text-textPrimary transition-colors active-feedback">
                  <Save size={14} />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsEditingTime(true)}
                className="flex items-center space-x-2 text-[10px] font-mono text-textPrimary uppercase tracking-widest hover:text-accent transition-colors group"
              >
                <span>Window: {identity.checkInTime}</span>
                <Edit2 size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
          </div>
        </div>
      </section>

      <footer className="mt-auto pt-12 text-center opacity-10">
        <p className="text-[8px] font-mono tracking-[0.5em] uppercase">
          Persistence node established {new Date(identity.created_at).toLocaleDateString()}
        </p>
      </footer>
    </div>
  );
};

export default IdentityView;
