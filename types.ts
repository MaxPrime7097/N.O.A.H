
export type EnergyLevel = 'LOW' | 'MEDIUM' | 'HIGH';

// Equivalent to 'checkins' table
export interface DailyLog {
  id: string;          // checkin id
  identity_id: string; // link to anon_id
  date: string;        // ISO string
  note: string;        // formerly 'action'
  state: string;       // formerly 'mentalState'
  timeSpent: number;
  energy: EnergyLevel;
  anchorsCompleted?: boolean[];
  deepAnalysis?: string; // stored deep analysis for this particular log/trajectory status
}

// Equivalent to 'identities' table
export interface UserIdentity {
  id: string;          // anon_id
  role: string;
  anchors: string[];
  checkInTime: string; // HH:mm format (e.g., "18:00")
  created_at: string;  // ISO string (formerly 'lockedAt')
  cycle_start: string; // ISO string
  status: AlignmentStatus;
  expiresAt: string;   // ISO string (end of 30-day window)
}

export type AppView = 'LANDING' | 'ONBOARDING' | 'AUTH' | 'SETUP' | 'CHECKIN' | 'FEEDBACK' | 'HISTORY' | 'RENEWAL' | 'IDENTITY';

export type AlignmentStatus = 'ALIGNED' | 'UNSTABLE' | 'DRIFTING';

export interface FeedbackData {
  status: AlignmentStatus;
  message: string;
  observation?: string;
}

export interface NoahState {
  userId: string | null;
  identity: UserIdentity | null;
  checkIns: DailyLog[];
}
