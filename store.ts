
import { DailyLog, UserIdentity, FeedbackData } from './types';

const KEYS = {
  ANON_ID: 'noah_anon_id',
  IDENTITY: 'noah_identity',
  LOGS: 'noah_logs',
  CACHED_FEEDBACK: 'noah_cached_feedback_map', // Map of logId -> FeedbackData
  USER_EMAIL: 'noah_user_email',
  SEEN_LANDING: 'noah_seen_landing',
  PENDING_SYNC: 'noah_pending_sync'
};

const generateUUID = () => {
  return 'xxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

interface PendingSync {
  identity: boolean;
  logs: string[];
}

export const store = {
  getAnonId: (): string => {
    let id = localStorage.getItem(KEYS.ANON_ID);
    if (!id) {
      id = generateUUID();
      localStorage.setItem(KEYS.ANON_ID, id);
    }
    return id;
  },
  getIdentity: (): UserIdentity | null => {
    const data = localStorage.getItem(KEYS.IDENTITY);
    return data ? JSON.parse(data) : null;
  },
  saveIdentity: (identity: UserIdentity) => {
    localStorage.setItem(KEYS.IDENTITY, JSON.stringify(identity));
    store.markPending('identity');
  },
  getLogs: (): DailyLog[] => {
    const data = localStorage.getItem(KEYS.LOGS);
    return data ? JSON.parse(data) : [];
  },
  addLog: (log: DailyLog) => {
    const logs = store.getLogs();
    const filtered = logs.filter(l => l.date !== log.date && l.id !== log.id);
    localStorage.setItem(KEYS.LOGS, JSON.stringify([...filtered, log]));
    store.markPending('log', log.id);
  },
  
  // Feedback Caching Logic
  getFeedbackForLog: (logId: string): FeedbackData | null => {
    const data = localStorage.getItem(KEYS.CACHED_FEEDBACK);
    if (!data) return null;
    const map = JSON.parse(data);
    return map[logId] || null;
  },
  saveFeedbackForLog: (logId: string, feedback: FeedbackData) => {
    const data = localStorage.getItem(KEYS.CACHED_FEEDBACK);
    const map = data ? JSON.parse(data) : {};
    map[logId] = feedback;
    localStorage.setItem(KEYS.CACHED_FEEDBACK, JSON.stringify(map));
  },

  getEmail: (): string | null => {
    return localStorage.getItem(KEYS.USER_EMAIL);
  },
  saveEmail: (email: string) => {
    localStorage.setItem(KEYS.USER_EMAIL, email);
    store.markPending('identity');
  },
  hasSeenLanding: (): boolean => {
    return localStorage.getItem(KEYS.SEEN_LANDING) === 'true';
  },
  setSeenLanding: () => {
    localStorage.setItem(KEYS.SEEN_LANDING, 'true');
  },
  
  getPendingSync: (): PendingSync => {
    const data = localStorage.getItem(KEYS.PENDING_SYNC);
    return data ? JSON.parse(data) : { identity: false, logs: [] };
  },
  markPending: (type: 'identity' | 'log', id?: string) => {
    const pending = store.getPendingSync();
    if (type === 'identity') pending.identity = true;
    if (type === 'log' && id && !pending.logs.includes(id)) pending.logs.push(id);
    localStorage.setItem(KEYS.PENDING_SYNC, JSON.stringify(pending));
  },
  clearPending: () => {
    localStorage.setItem(KEYS.PENDING_SYNC, JSON.stringify({ identity: false, logs: [] }));
  },

  clearAll: () => {
    localStorage.removeItem(KEYS.IDENTITY);
    localStorage.removeItem(KEYS.LOGS);
    localStorage.removeItem(KEYS.CACHED_FEEDBACK);
    localStorage.removeItem(KEYS.PENDING_SYNC);
  }
};
