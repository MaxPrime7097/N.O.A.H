
import React, { useState, useRef } from 'react';
import { UserIdentity, DailyLog } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { FileUp, AlertTriangle, ShieldCheck, HelpCircle, Info } from 'lucide-react';
import { store } from '../store';

// Casting motion components to avoid type errors
const MotionDiv = motion.div as any;
const MotionP = motion.p as any;

interface Props {
  onLock: (id: UserIdentity) => void;
  onImport: (identity: UserIdentity, logs: DailyLog[]) => void;
  onBack?: () => void;
}

const IdentitySetup: React.FC<Props> = ({ onLock, onImport, onBack }) => {
  const [slideIndex, setSlideIndex] = useState(0);
  const [role, setRole] = useState('');
  const [anchors, setAnchors] = useState(['', '', '']);
  const [isLocking, setIsLocking] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error' | 'verifying'>('idle');
  const [pendingNode, setPendingNode] = useState<{ identity: UserIdentity, logs: DailyLog[] } | null>(null);
  const [nodeIdInput, setNodeIdInput] = useState('');
  const [showAnchorInfo, setShowAnchorInfo] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const slides = [
    "This is not a productivity app.",
    "This is a mirror.",
    "You will define who you want to become.",
    "Then you will observe yourself.",
    "Nothing more. Nothing less."
  ];

  const handleNextSlide = () => {
    if (slideIndex < slides.length - 1) setSlideIndex(slideIndex + 1);
    else setSlideIndex(99); 
  };

  const handleSkipSlides = () => setSlideIndex(99);

  const trimmedRole = role.trim();
  const validAnchors = anchors.map(a => a.trim()).filter(a => a.length >= 3);
  const uniqueAnchors = new Set(anchors.map(a => a.trim().toLowerCase())).size === 3;
  const isFormValid = trimmedRole.length >= 3 && validAnchors.length === 3 && uniqueAnchors;

  const handleLock = () => {
    if (!isFormValid) return;
    setIsLocking(true);
    const now = new Date().toISOString();
    const anonId = store.getAnonId();
    
    onLock({
      id: anonId,
      role: trimmedRole,
      anchors: validAnchors,
      checkInTime: "19:00",
      created_at: now,
      cycle_start: now,
      status: 'UNSTABLE',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.identity && json.logs) {
          setPendingNode({ identity: json.identity, logs: json.logs });
          setImportStatus('verifying');
        }
      } catch (err) {
        setImportStatus('error');
        setTimeout(() => setImportStatus('idle'), 2000);
      }
    };
    reader.readAsText(file);
  };

  const verifyNodeId = () => {
    if (!pendingNode) return;
    if (nodeIdInput.trim() === pendingNode.identity.id) {
      onImport(pendingNode.identity, pendingNode.logs);
    } else {
      setImportStatus('error');
      setTimeout(() => setImportStatus('verifying'), 1500);
    }
  };

  if (slideIndex < slides.length) {
    return (
      <div className="min-h-screen bg-bgMain flex flex-col items-center justify-center p-12 text-center relative">
        {onBack && (
          <button 
            onClick={onBack}
            className="absolute top-12 left-12 text-[9px] font-mono tracking-[0.3em] uppercase text-textSecondary/40 hover:text-textPrimary transition-colors active-feedback"
          >
            ← Back
          </button>
        )}
        <button 
          onClick={handleSkipSlides}
          className="absolute top-12 right-12 text-[9px] font-mono tracking-[0.3em] uppercase text-textSecondary/40 hover:text-textPrimary transition-colors"
        >
          Skip
        </button>
        <div 
          onClick={handleNextSlide}
          className="flex-grow flex flex-col items-center justify-center cursor-pointer select-none w-full"
        >
          <AnimatePresence mode="wait">
            {/* Fixed motion.p with MotionP any cast */}
            <MotionP 
              key={slideIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-xl md:text-2xl font-light tracking-wide text-textPrimary max-w-md leading-relaxed"
            >
              {slides[slideIndex]}
            </MotionP>
          </AnimatePresence>
        </div>
        <div className="pb-12 flex space-x-2">
          {slides.map((_, i) => (
            <div key={i} className={`h-[1px] w-4 transition-all duration-700 ${i === slideIndex ? 'bg-textPrimary' : 'bg-white/10'}`} />
          ))}
        </div>
        <p className="absolute bottom-6 text-[8px] font-mono tracking-[0.4em] uppercase text-textSecondary/20">Tap to continue</p>
      </div>
    );
  }

  return (
    /* Fixed motion.div with MotionDiv any cast */
    <MotionDiv 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="min-h-screen bg-bgMain flex flex-col items-center p-6 pt-20 text-center relative"
    >
      {onBack && (
        <button 
          onClick={onBack}
          className="absolute top-8 left-8 text-[9px] font-mono tracking-[0.3em] uppercase text-textSecondary/40 hover:text-textPrimary transition-colors active-feedback"
        >
          ← Back
        </button>
      )}
      <AnimatePresence>
        {importStatus === 'verifying' && (
          /* Fixed motion.div with MotionDiv any cast */
          <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-bgMain/98 z-[200] flex items-center justify-center p-6 backdrop-blur-xl">
            <div className="noah-card max-w-xs w-full p-8 space-y-6">
              <ShieldCheck size={32} className="text-accent mx-auto" />
              <h3 className="noah-title">Authorize Node</h3>
              <input
                type="text"
                value={nodeIdInput}
                onChange={(e) => setNodeIdInput(e.target.value)}
                placeholder="Enter Node ID"
                className="w-full bg-muted/30 border border-border p-4 text-center text-xs font-mono focus:outline-none"
              />
              <button onClick={verifyNodeId} className="w-full bg-accent py-4 text-[10px] font-mono uppercase tracking-widest">Restore</button>
              <button onClick={() => setImportStatus('idle')} className="w-full text-[9px] font-mono uppercase text-textSecondary/40">Cancel</button>
            </div>
          </MotionDiv>
        )}

        {showConfirm && (
          /* Fixed motion.div with MotionDiv any cast */
          <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-bgMain/95 z-[100] flex items-center justify-center p-6 backdrop-blur-sm">
            <div className="noah-card max-w-xs w-full p-8 space-y-8 text-center border-accent/20">
              <AlertTriangle size={32} className="text-accent mx-auto opacity-50" />
              <div className="space-y-4">
                <h3 className="noah-title text-textPrimary">30-Day Commitment</h3>
                <p className="text-sm text-textSecondary font-light leading-relaxed">This identity cannot be changed for 30 days. This ensures the honesty of your signal.</p>
              </div>
              <button onClick={handleLock} className="w-full bg-accent py-4 text-[10px] font-mono tracking-[0.3em] uppercase active-feedback">Lock Identity</button>
              <button onClick={() => setShowConfirm(false)} className="w-full py-4 text-[10px] font-mono tracking-[0.3em] uppercase text-textSecondary/40">Review</button>
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>

      <div className="w-full max-w-sm space-y-16">
        <div className="space-y-6">
          <label className="text-[10px] font-mono tracking-[0.4em] uppercase text-textSecondary/60">Who do you want to become?</label>
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Focused Creator"
            className="w-full bg-transparent border-b border-white/10 py-4 text-3xl text-center focus:outline-none focus:border-accent transition-colors font-light"
          />
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-center space-x-2">
            <h2 className="noah-title">Behavioral Anchors</h2>
            <button 
              onClick={() => setShowAnchorInfo(!showAnchorInfo)}
              className="text-textSecondary/40 hover:text-accent transition-colors"
              title="Learn about anchors"
            >
              <HelpCircle size={14} />
            </button>
          </div>
          <AnimatePresence>
            {showAnchorInfo && (
              /* Fixed motion.div with MotionDiv any cast */
              <MotionDiv 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden bg-bgSurface/50 p-4 rounded border border-white/5 text-left"
              >
                <div className="flex items-start space-x-3">
                  <Info size={14} className="text-accent mt-0.5" />
                  <p className="text-[10px] text-textSecondary leading-relaxed">
                    Anchors are specific, measurable actions that prove you are inhabiting your target identity. Use clear behaviors like "Read for 30m" rather than vague aspirations. Note: <strong>Your Primary Anchor behaves as your core identity habit and holds 50% of the Anchor alignment weight (which corresponds directly to 20% of your overall trajectory score)</strong>, while secondary anchors hold 25% of the anchor weight (10% of the global score) each.
                  </p>
                </div>
              </MotionDiv>
            )}
          </AnimatePresence>
          <div className="space-y-6">
            {anchors.map((a, i) => (
              <div key={i} className="relative">
                {i === 0 && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-accent text-[8px] font-mono font-bold uppercase tracking-widest text-bgMain px-2 py-0.5 rounded-sm z-10 shadow-[0_0_10px_rgba(20,184,166,0.25)]">
                    Primary / Core Identity Anchor
                  </span>
                )}
                <input
                  type="text"
                  value={a}
                  onChange={(e) => {
                    const n = [...anchors];
                    n[i] = e.target.value;
                    setAnchors(n);
                  }}
                  placeholder={i === 0 ? "Core Anchor (Direct Definition of Identity — 50% Anchor / 20% Global Weight)" : `Secondary Anchor ${i} (25% Anchor / 10% Global Weight)`}
                  className={`w-full bg-muted/20 border rounded-sm p-4 text-sm text-center focus:outline-none transition-all ${i === 0 ? 'border-accent/40 text-accent font-medium' : 'border-border/40 focus:border-accent'} ${a.length > 0 && a.length < 3 ? 'border-red-900/40 text-red-400' : ''}`}
                />
              </div>
            ))}
          </div>
          {!uniqueAnchors && <p className="text-[9px] font-mono text-accent uppercase">Anchors must be unique</p>}
        </div>

        <div className="space-y-8 pt-8">
          <div className="space-y-2">
            <p className="text-[10px] font-mono tracking-widest text-accent uppercase">30-day commitment</p>
            <p className="text-[9px] text-textSecondary/40 font-mono uppercase tracking-[0.2em]">Locked cycle required for valid signal.</p>
            <p className="text-[8px] text-textSecondary/30 font-mono uppercase tracking-[0.2em] pt-1">
              Check-in window defaults to 19:00 (Adjustable in ID view).
            </p>
          </div>
          <button
            onClick={() => setShowConfirm(true)}
            disabled={!isFormValid || isLocking}
            className="w-full bg-accent py-5 text-[11px] font-mono tracking-[0.5em] uppercase disabled:opacity-10 active-feedback"
          >
            Lock Identity
          </button>
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="text-[9px] font-mono tracking-widest uppercase text-textSecondary/30 hover:text-textSecondary transition-colors flex items-center justify-center space-x-2 w-full"
          >
            <FileUp size={12} />
            <span>Import existing Node</span>
          </button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportJson} className="hidden" />
        </div>
      </div>
    </MotionDiv>
  );
};

export default IdentitySetup;
