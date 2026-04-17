import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AppView, UserIdentity, DailyLog } from './types';
import { store } from './store';
import IdentitySetup from './components/IdentitySetup';
import CheckIn from './components/CheckIn';
import Feedback from './components/Feedback';
import History from './components/History';
import Landing from './components/Landing';
import Auth from './components/Auth';
import Renewal from './components/Renewal';
import IdentityView from './components/IdentityView';
import { Circle, MessageSquare, Clock, User as UserIcon, RefreshCw, WifiOff, AlertTriangle, ArrowRight, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// Casting motion components to avoid type errors in certain environments
const MotionDiv = motion.div as any;

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('LANDING');
  const [identity, setIdentity] = useState<UserIdentity | null>(null);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [anonId, setAnonId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isWarningDismissed, setIsWarningDismissed] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  const isExpired = useMemo(() => {
    if (!identity) return false;
    const expiresAt = new Date(identity.expiresAt).getTime();
    const now = new Date().getTime();
    return now >= expiresAt;
  }, [identity]);

  const daysLeft = useMemo(() => {
    if (!identity) return null;
    const expiry = new Date(identity.expiresAt).getTime();
    const diff = expiry - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [identity]);

  const showRenewalWarning = useMemo(() => {
    return (
      !isWarningDismissed &&
      daysLeft !== null &&
      daysLeft <= 3 &&
      daysLeft > 0 &&
      ['CHECKIN', 'FEEDBACK', 'HISTORY', 'IDENTITY'].includes(view)
    );
  }, [daysLeft, view, isWarningDismissed]);

  const triggerSync = useCallback(async () => {
    if (!isOnline || isSyncing) return;
    
    const pending = store.getPendingSync();
    if (!pending.identity && pending.logs.length === 0) return;

    setIsSyncing(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      store.clearPending();
    } catch (error) {
      console.error('NOAH: Sync failed.', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing]);

  useEffect(() => {
    const id = store.getAnonId();
    setAnonId(id);

    const storedIdentity = store.getIdentity();
    const storedLogs = store.getLogs();
    const storedEmail = store.getEmail();
    const seenLanding = store.hasSeenLanding();

    setIdentity(storedIdentity);
    setLogs(storedLogs);
    setUserEmail(storedEmail);

    if (seenLanding) {
      if (!storedIdentity) setView('SETUP');
      else if (new Date().getTime() >= new Date(storedIdentity.expiresAt).getTime()) setView('RENEWAL');
      else setView('CHECKIN');
    } else {
      setView('LANDING');
    }

    const handleOnline = () => {
      setIsOnline(true);
      setTimeout(triggerSync, 500); 
    };
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const syncInterval = setInterval(() => {
      if (isOnline) triggerSync();
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(syncInterval);
    };
  }, [isOnline, triggerSync]);

  const handleLandingProceed = () => setView('AUTH');
  const handleLandingEnter = () => {
    store.setSeenLanding();
    if (!identity) setView('SETUP');
    else if (isExpired) setView('RENEWAL');
    else setView('CHECKIN');
  };

  const handleAuthSuccess = (email: string) => {
    store.saveEmail(email);
    setUserEmail(email);
    store.setSeenLanding();
    if (!identity) setView('SETUP');
    else if (isExpired) setView('RENEWAL');
    else setView('CHECKIN');
    triggerSync();
  };

  const handleIdentityLocked = (newIdentity: UserIdentity) => {
    setIsInitializing(true);
    setTimeout(() => {
      setIdentity(newIdentity);
      store.saveIdentity(newIdentity); 
      setIsInitializing(false);
      setView('CHECKIN');
      triggerSync();
    }, 2000);
  };

  const handleImport = (importedIdentity: UserIdentity, importedLogs: DailyLog[]) => {
    setIsInitializing(true);
    setTimeout(() => {
      store.saveIdentity(importedIdentity);
      localStorage.setItem('noah_logs', JSON.stringify(importedLogs));
      setIdentity(importedIdentity);
      setLogs(importedLogs);
      
      const today = new Date();
      const hasLoggedToday = importedLogs.some(l => {
        const d = new Date(l.date);
        return d.getDate() === today.getDate() && 
               d.getMonth() === today.getMonth() && 
               d.getFullYear() === today.getFullYear();
      });

      setIsInitializing(false);
      setView(hasLoggedToday ? 'FEEDBACK' : 'CHECKIN');
      triggerSync();
    }, 2000);
  };

  const handleLogSubmitted = (newLog: DailyLog) => {
    store.addLog(newLog); 
    setLogs(prev => [...prev.filter(l => l.id !== newLog.id), newLog]);
    setView('FEEDBACK');
    triggerSync();
  };

  const handleCycleReset = () => {
    store.clearAll();
    setIdentity(null);
    setLogs([]);
    setView('SETUP');
    setIsWarningDismissed(false);
  };

  const handleRecommit = () => {
    if (!identity) return;
    const now = new Date();
    const newExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const updatedIdentity = { ...identity, expiresAt: newExpiresAt, cycle_start: now.toISOString() };
    store.saveIdentity(updatedIdentity);
    setIdentity(updatedIdentity);
    setView('CHECKIN');
    setIsWarningDismissed(true);
  };

  if (view === 'LANDING') return <Landing onProceed={handleLandingProceed} onEnter={handleLandingEnter} />;
  if (view === 'AUTH') return <Auth onSuccess={handleAuthSuccess} onSkip={handleLandingEnter} />;
  
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-bgMain flex flex-col items-center justify-center p-12 text-center space-y-12 animate-fade-in">
        <MotionDiv 
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.98, 1.02, 0.98] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-16 h-16 border border-accent/30 rounded-full flex items-center justify-center"
        >
          <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
        </MotionDiv>
        <div className="space-y-4">
          <p className="text-[10px] font-mono tracking-[0.5em] uppercase text-textPrimary">Initializing Node</p>
          <p className="text-[9px] font-mono tracking-widest text-textSecondary/40 uppercase">Establishing 30-Day commitment</p>
        </div>
      </div>
    );
  }

  if (view === 'SETUP' || !identity) return <IdentitySetup onLock={handleIdentityLocked} onImport={handleImport} />;

  return (
    <div className="min-h-screen bg-bgMain flex flex-col items-center max-w-md mx-auto relative px-6 pb-20 overflow-hidden">
      <header className="w-full py-6 flex justify-between items-center z-20" role="banner">
        <div className="flex flex-col">
          <span className="text-[12px] font-mono tracking-[0.5em] text-textPrimary uppercase font-bold">N.O.A.H</span>
        </div>
        <div className="flex items-center space-x-3">
          {isSyncing && (
            <MotionDiv 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center space-x-2"
            >
              <span className="text-[8px] font-mono tracking-widest text-accent uppercase animate-pulse">Syncing</span>
              <RefreshCw size={10} className="text-accent animate-spin opacity-60" aria-label="Synchronizing" />
            </MotionDiv>
          )}
          {!isOnline && (
            <div className="flex items-center space-x-1.5 opacity-60" aria-label="Offline Mode">
              <span className="text-[8px] font-mono tracking-widest text-textSecondary uppercase">Offline</span>
              <WifiOff size={12} className="text-textSecondary" />
            </div>
          )}
        </div>
      </header>

      <main className="w-full flex-grow flex flex-col relative z-10 overflow-y-auto no-scrollbar pb-12" id="main-content" role="main">
        <AnimatePresence>
          {showRenewalWarning && (
            <MotionDiv
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="bg-accent/10 border border-accent/30 rounded p-4 flex items-center justify-between space-x-4">
                <div className="flex items-center space-x-3">
                  <AlertTriangle size={16} className="text-accent flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-textPrimary">Cycle Expiry Approaching</span>
                    <span className="text-[9px] font-mono uppercase tracking-wider text-textSecondary/60">{daysLeft} days remaining in current node.</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => setView('RENEWAL')}
                    className="flex items-center space-x-1 text-[9px] font-mono uppercase tracking-widest text-accent hover:text-textPrimary transition-colors active-feedback"
                  >
                    <span>Renew</span>
                    <ArrowRight size={10} />
                  </button>
                  <button 
                    onClick={() => setIsWarningDismissed(true)}
                    className="text-textSecondary/40 hover:text-textPrimary transition-colors active-feedback"
                    aria-label="Dismiss warning"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            </MotionDiv>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <MotionDiv
            key={view}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="w-full flex-grow flex flex-col"
          >
            {view === 'CHECKIN' && <CheckIn identity={identity} logs={logs} onComplete={handleLogSubmitted} />}
            {view === 'FEEDBACK' && <Feedback identity={identity} logs={logs} onCycleReset={handleCycleReset} />}
            {view === 'HISTORY' && <History logs={logs} identity={identity} loading={isSyncing} />}
            {view === 'RENEWAL' && identity && <Renewal identity={identity} logs={logs} onRecommit={handleRecommit} onReset={handleCycleReset} />}
            {view === 'IDENTITY' && <IdentityView identity={identity} />}
          </MotionDiv>
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-bgSurface/95 backdrop-blur-md border-t border-white/5 h-20 flex items-center justify-around px-4 z-50 pb-[env(safe-area-inset-bottom)]" role="navigation" aria-label="Main Navigation">
        <NavButton active={view === 'CHECKIN'} icon={<Circle size={18} />} label="Check-in" onClick={() => setView('CHECKIN')} />
        <NavButton active={view === 'FEEDBACK'} icon={<MessageSquare size={18} />} label="Truth" onClick={() => setView('FEEDBACK')} />
        <NavButton active={view === 'HISTORY'} icon={<Clock size={18} />} label="History" onClick={() => setView('HISTORY')} />
        <NavButton active={view === 'IDENTITY'} icon={<UserIcon size={18} />} label="Id" onClick={() => setView('IDENTITY')} />
      </nav>
    </div>
  );
};

const NavButton = ({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    aria-current={active ? 'page' : undefined}
    className={`flex flex-col items-center space-y-1 transition-all duration-300 active-feedback ${active ? 'text-textPrimary' : 'text-textSecondary/30'}`}
  >
    <div className={`${active ? 'text-accent scale-110' : ''} transition-all`} aria-hidden="true">{icon}</div>
    <span className="text-[9px] uppercase tracking-widest font-mono font-medium">{label}</span>
  </button>
);

export default App;