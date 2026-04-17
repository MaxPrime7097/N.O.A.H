import React, { useState, useMemo, useRef, useEffect } from 'react';
import { DailyLog, EnergyLevel, UserIdentity } from '../types';
import { ChevronDown, AlertCircle, Lock, ClipboardCheck, ShieldAlert, Mic, Square, Loader2, Quote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { transcribeAudio } from '../services/geminiService';

// Casting motion components to avoid type errors
const MotionDiv = motion.div as any;

const PHILOSOPHICAL_QUOTES = [
  "Silence is the mirror of the soul.",
  "The unexamined life is not worth living.",
  "We are what we repeatedly do.",
  "He who has a why to live can bear almost any how.",
  "Silence is a source of great strength.",
  "The first step toward change is awareness.",
  "Observe without judgment. Reality is enough.",
  "Your actions are your only true possessions.",
  "Discipline is the bridge between goals and accomplishment.",
  "To know yourself is the beginning of all wisdom."
];

interface Props {
  identity: UserIdentity;
  logs: DailyLog[];
  onComplete: (log: DailyLog) => void;
}

const CheckIn: React.FC<Props> = ({ identity, logs, onComplete }) => {
  const [note, setNote] = useState('');
  const [time, setTime] = useState(60);
  const [state, setState] = useState('');
  const [energy, setEnergy] = useState<EnergyLevel>('MEDIUM');
  const [anchorStatus, setAnchorStatus] = useState<boolean[]>(new Array(identity.anchors.length).fill(false));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAnchors, setShowAnchors] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const idleTimerRef = useRef<number | null>(null);

  const today = new Date();
  const MAX_CHARS = 200;

  // Idle Timer Logic
  useEffect(() => {
    const resetIdleTimer = () => {
      setIsIdle(false);
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = window.setTimeout(() => {
        if (!isRecording && !isSubmitting) {
          setIsIdle(true);
          setCurrentQuoteIndex(Math.floor(Math.random() * PHILOSOPHICAL_QUOTES.length));
        }
      }, 30000); // 30 seconds of inactivity
    };

    const handleUserActivity = () => resetIdleTimer();

    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);

    resetIdleTimer();

    return () => {
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
    };
  }, [isRecording, isSubmitting]);
  
  const dayOfCycle = useMemo(() => {
    const start = new Date(identity.created_at);
    start.setHours(0,0,0,0);
    const d = new Date();
    d.setHours(0,0,0,0);
    const diff = d.getTime() - start.getTime();
    return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)) + 1);
  }, [identity]);

  const lastCheckInTime = useMemo(() => {
    if (logs.length === 0) return 'NO SIGNAL';
    const latest = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    const date = new Date(latest.date);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false 
    }).toUpperCase();
  }, [logs]);

  const continuity = useMemo(() => {
    if (logs.length === 0) return 0;
    const sorted = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    let streak = 0;
    let streakDate = new Date();
    streakDate.setHours(0,0,0,0);

    for (let i = 0; i < sorted.length; i++) {
      const logDate = new Date(sorted[i].date);
      logDate.setHours(0,0,0,0);
      const diff = Math.floor((streakDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diff === 0) {
        streak++;
        streakDate.setDate(streakDate.getDate() - 1);
      } else if (diff === 1) {
        streak++;
        streakDate = logDate;
        streakDate.setDate(streakDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }, [logs]);

  const gapDetected = useMemo(() => {
    if (logs.length === 0) return false;
    const sorted = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastLog = new Date(sorted[0].date);
    lastLog.setHours(0,0,0,0);
    const d = new Date();
    d.setHours(0,0,0,0);
    const diff = Math.floor((d.getTime() - lastLog.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 2;
  }, [logs]);

  const coherencyWarnings = useMemo(() => {
    const warnings: { message: string; critical: boolean; title: string; type: 'disconnect' | 'paradox' }[] = [];
    const anchorsChecked = anchorStatus.filter(Boolean).length;
    
    if (time === 0 && anchorsChecked > 0) {
      warnings.push({ 
        title: "LOGIC ERROR",
        message: "You checked anchors as done, but logged 0 minutes. This creates an impossible signal.", 
        critical: true,
        type: 'disconnect'
      });
    }
    if (time > 90 && anchorsChecked === 0) {
      warnings.push({ 
        title: "BUSY WORK ALERT",
        message: "Considerable time was spent without completing any behavioral anchors.", 
        critical: false,
        type: 'paradox'
      });
    }
    return warnings;
  }, [time, anchorStatus]);

  const hasLoggedToday = useMemo(() => {
    return logs.some(l => {
      const d = new Date(l.date);
      return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    });
  }, [logs, today]);

  const isFormValid = note.trim().length >= 3 && !coherencyWarnings.some(w => w.critical);

  const handleSubmit = () => {
    if (!isFormValid || isSubmitting) return;
    setIsSubmitting(true);
    
    const log: DailyLog = {
      id: Math.random().toString(36).substring(7),
      identity_id: identity.id,
      date: new Date().toISOString(),
      note: note.trim().slice(0, MAX_CHARS),
      timeSpent: time,
      state: state.trim(),
      energy,
      anchorsCompleted: anchorStatus
    };
    
    setTimeout(() => onComplete(log), 400);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        const transcription = await transcribeAudio(base64Audio, 'audio/webm');
        if (transcription) {
          const cleanTranscription = transcription.trim();
          setNote(prev => {
            const combined = prev ? prev + ' ' + cleanTranscription : cleanTranscription;
            return combined.slice(0, MAX_CHARS);
          });
        }
        setIsTranscribing(false);
      };
    } catch (err) {
      console.error("Transcription failed", err);
      setIsTranscribing(false);
    }
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length <= MAX_CHARS) {
      setNote(e.target.value);
    }
  };

  if (hasLoggedToday) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center space-y-12 py-20 text-center font-sans px-6 animate-fade-in relative">
        <MotionDiv 
          animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.95, 1, 0.95] }}
          transition={{ repeat: Infinity, duration: 4 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5"
        >
          <Quote size={300} />
        </MotionDiv>
        
        <div className="p-6 rounded-full bg-accent/5 border border-accent/10 relative z-10">
          <Lock size={48} className="text-accent/40" />
        </div>
        
        <div className="space-y-6 relative z-10">
          <div className="space-y-2">
            <p className="text-xl font-mono text-textPrimary uppercase tracking-[0.2em]">STATIONARY REFLECTION</p>
            <p className="text-[10px] font-mono text-textSecondary/40 uppercase tracking-widest">Observation node is locked for today.</p>
          </div>
          
          <div className="max-w-xs mx-auto pt-8 italic font-light text-textSecondary/80 leading-relaxed border-t border-white/5">
            "{PHILOSOPHICAL_QUOTES[currentQuoteIndex]}"
          </div>
        </div>
        
        <div className="pt-12 text-[8px] font-mono tracking-[0.5em] uppercase text-textSecondary/20">
          SIGNAL REACTIVATION AT {identity.checkInTime} TOMORROW
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pb-20 animate-fade-in font-sans relative">
      <AnimatePresence>
        {isIdle && !isRecording && !isSubmitting && (
          <MotionDiv 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-bgMain/95 backdrop-blur-md z-[60] flex flex-col items-center justify-center p-12 text-center pointer-events-none"
          >
            <MotionDiv 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1 }}
              className="space-y-8"
            >
              <Quote size={24} className="text-accent/30 mx-auto" />
              <p className="text-xl font-light italic text-textPrimary/70 max-w-sm leading-relaxed">
                "{PHILOSOPHICAL_QUOTES[currentQuoteIndex]}"
              </p>
              <div className="h-[1px] w-8 bg-accent/20 mx-auto" />
              <p className="text-[9px] font-mono tracking-[0.4em] uppercase text-textSecondary/30">Stationary Awareness</p>
            </MotionDiv>
          </MotionDiv>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSubmitting && (
          <MotionDiv 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-bgMain z-[100] flex items-center justify-center"
          >
            <span className="text-[11px] font-mono tracking-[0.5em] uppercase text-textPrimary">Logged.</span>
          </MotionDiv>
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-20 bg-bgMain/95 backdrop-blur-md space-y-6 mb-12 pt-6 pb-4 border-b border-white/5 -mx-6 px-6">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h1 className="text-[11px] font-mono tracking-widest text-textSecondary uppercase">
              {today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}
            </h1>
            <p className="text-sm font-semibold tracking-widest text-textPrimary uppercase">Day {dayOfCycle} of 30</p>
          </div>
          <div className="text-right space-y-1">
             <p className="text-[10px] font-mono tracking-widest text-textSecondary/60 uppercase">Identity: {identity.role}</p>
             <p className="text-[9px] font-mono tracking-widest text-accent uppercase">Continuity: {continuity} days</p>
             <p className="text-[8px] font-mono tracking-widest text-textSecondary/40 uppercase">Last Signal: {lastCheckInTime}</p>
          </div>
        </div>

        <AnimatePresence mode="popLayout">
          {gapDetected && (
            <MotionDiv 
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="p-3 bg-red-950/20 border border-red-900/40 rounded-sm flex items-center space-x-3 overflow-hidden"
            >
              <AlertCircle size={14} className="text-red-500" />
              <span className="text-[10px] text-red-400 font-mono uppercase tracking-widest">Observation gap detected.</span>
            </MotionDiv>
          )}

          {coherencyWarnings.map((w) => (
            <MotionDiv 
              key={w.type} 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className={`p-4 border rounded-sm flex items-start space-x-3 transition-all ${w.critical ? 'bg-red-950/40 border-red-500 animate-shake' : 'bg-accent/10 border-accent/20'}`}
            >
              {w.critical ? <ShieldAlert size={16} className="text-red-500 mt-0.5" /> : <AlertCircle size={16} className="text-accent mt-0.5" />}
              <div className="flex flex-col space-y-1">
                <span className={`text-[10px] font-mono uppercase tracking-widest font-bold ${w.critical ? 'text-red-400' : 'text-accent'}`}>
                  {w.title}
                </span>
                <span className={`text-[9px] font-mono uppercase tracking-widest leading-relaxed ${w.critical ? 'text-red-300' : 'text-accent/70'}`}>
                  {w.message}
                </span>
              </div>
            </MotionDiv>
          ))}
        </AnimatePresence>

        <div className="noah-card overflow-hidden">
          <button 
            onClick={() => setShowAnchors(!showAnchors)} 
            className="w-full flex items-center justify-between p-4 active-feedback"
            aria-expanded={showAnchors}
          >
            <div className="flex items-center space-x-2">
              <ClipboardCheck size={12} className="text-textSecondary/40" />
              <span className="noah-title">Anchors being tracked</span>
            </div>
            <ChevronDown size={14} className={`text-textSecondary/40 transition-transform ${showAnchors ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {showAnchors && (
              <MotionDiv 
                initial={{ height: 0, opacity: 0 }} 
                animate={{ height: 'auto', opacity: 1 }} 
                exit={{ height: 0, opacity: 0 }} 
                className="px-4 pb-4 space-y-3"
              >
                {identity.anchors.map((anchor, i) => (
                  <p key={i} className="text-xs text-textSecondary font-light leading-relaxed border-l border-white/5 pl-3">• {anchor}</p>
                ))}
              </MotionDiv>
            )}
          </AnimatePresence>
        </div>
      </header>

      <div className="space-y-12 px-1">
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-mono tracking-widest uppercase text-textSecondary">What did you actually do today?</label>
            <div className="flex items-center space-x-2">
               {isTranscribing && (
                 <div className="flex items-center space-x-2 text-[8px] font-mono uppercase tracking-widest text-accent animate-pulse">
                    <Loader2 size={10} className="animate-spin" />
                    <span>Processing</span>
                 </div>
               )}
               <div className="flex items-center space-x-1">
                 {isRecording && (
                   <button 
                    onClick={stopRecording}
                    className="p-2 rounded-sm bg-red-950/20 border border-red-500/50 text-red-400 active-feedback"
                    aria-label="Stop recording"
                   >
                     <Square size={12} fill="currentColor" />
                   </button>
                 )}
                 <button 
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isTranscribing}
                  className={`p-2 rounded-sm border transition-all active-feedback ${isRecording ? 'bg-accent/20 border-accent/50 text-accent' : 'bg-muted/30 border-border text-textSecondary/60'}`}
                  aria-label={isRecording ? "Finish recording" : "Transcribe audio note"}
                 >
                   <Mic size={14} />
                 </button>
               </div>
            </div>
          </div>
          
          <div className="relative">
            <textarea 
              value={note} 
              onChange={handleNoteChange}
              maxLength={MAX_CHARS}
              className={`w-full bg-muted/30 border p-4 text-sm text-textPrimary focus:outline-none focus:border-accent transition-all min-h-[120px] resize-none ${isRecording ? 'border-red-500/30' : 'border-border'}`} 
              placeholder={isRecording ? "Listening to signal..." : "Document core reality..."} 
            />
            {isRecording && (
              <MotionDiv 
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute top-4 right-4 pointer-events-none"
              >
                <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
              </MotionDiv>
            )}
          </div>
          
          <div className="text-right flex justify-end items-center space-x-2">
            <div className="h-[1px] flex-grow bg-white/5 mr-2" />
            <span className={`text-[9px] font-mono uppercase tracking-[0.2em] transition-colors duration-300 ${note.length >= MAX_CHARS ? 'text-accent' : 'text-textSecondary/40'}`}>
              {note.length}/{MAX_CHARS}
            </span>
          </div>
        </section>

        <section className="space-y-8">
          <div className="flex justify-between items-end">
            <label className="text-[10px] font-mono tracking-widest uppercase text-textSecondary">Time spent (min)</label>
            <span className="text-sm font-mono text-textPrimary">{time}m</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="180" 
            step="15" 
            value={time} 
            onChange={(e) => setTime(parseInt(e.target.value))} 
            className="w-full active-feedback" 
          />
        </section>

        <section className="space-y-4">
          <label className="text-[10px] font-mono tracking-widest uppercase text-textSecondary">Mental State</label>
          <input 
            type="text" 
            value={state} 
            onChange={(e) => setState(e.target.value)} 
            placeholder="Current mindset..." 
            className="w-full bg-muted/30 border border-border p-4 text-sm text-textPrimary focus:outline-none focus:border-accent transition-all" 
          />
        </section>

        <section className="space-y-4">
          <h2 className="text-[10px] font-mono tracking-widest uppercase text-textSecondary">Energy Signal</h2>
          <div className="grid grid-cols-3 gap-3">
            {(['LOW', 'MEDIUM', 'HIGH'] as EnergyLevel[]).map((level) => (
              <button 
                key={level} 
                onClick={() => setEnergy(level)} 
                className={`py-4 text-[10px] font-mono tracking-widest border transition-all active-feedback ${energy === level ? 'bg-accent text-textPrimary border-accent' : 'bg-muted/30 text-textSecondary/40 border-border'}`}
              >
                {level}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-[10px] font-mono tracking-widest uppercase text-textSecondary">Anchor Fulfillment</h2>
          <div className="space-y-3">
            {identity.anchors.map((anchor, i) => (
              <button 
                key={i} 
                onClick={() => {
                  const n = [...anchorStatus];
                  n[i] = !n[i];
                  setAnchorStatus(n);
                }} 
                className={`w-full text-left p-4 flex items-center justify-between border transition-all ${anchorStatus[i] ? 'border-accent bg-accent/10 text-textPrimary' : 'border-border bg-muted/20 text-textSecondary/40'}`}
              >
                <span className="text-[11px] uppercase tracking-widest font-light">{anchor}</span>
                <div className={`w-3 h-3 border ${anchorStatus[i] ? 'bg-accent border-accent' : 'border-white/10'}`} />
              </button>
            ))}
          </div>
        </section>

        <button 
          onClick={handleSubmit} 
          disabled={!isFormValid || isSubmitting || isRecording || isTranscribing}
          className={`w-full py-5 text-[11px] font-mono tracking-[0.5em] uppercase transition-all duration-300 active-feedback shadow-[0_0_20px_rgba(20,80,40,0.1)] ${coherencyWarnings.some(w => w.critical) ? 'bg-red-950 text-red-400 border border-red-500/50' : 'bg-accent text-textPrimary'}`}
        >
          {isSubmitting ? 'Syncing...' : 'Submit Observation'}
        </button>
      </div>
    </div>
  );
};

export default CheckIn;