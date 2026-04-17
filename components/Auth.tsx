
import React, { useState } from 'react';

interface Props {
  onSuccess: (email: string) => void;
  onSkip: () => void;
}

const Auth: React.FC<Props> = ({ onSuccess, onSkip }) => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.includes('@')) {
      onSuccess(email);
    }
  };

  return (
    <div className="min-h-screen bg-bgMain flex flex-col items-center justify-center p-6 animate-in fade-in duration-1000">
      <div className="w-full max-w-xs space-y-12">
        <div className="space-y-6">
          <h1 className="text-xs font-mono tracking-[0.4em] uppercase text-textSecondary text-center">
            Persistence requires commitment.
          </h1>
          <p className="text-sm font-light text-textSecondary text-center leading-relaxed">
            Your identity node is local. Secure your patterns with an account to ensure continuity across nodes.
          </p>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <label htmlFor="auth-email" className="sr-only">Email address</label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full bg-transparent border-b border-white/10 py-4 text-center text-sm focus:outline-none focus:border-white/40 transition-colors"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={!email.includes('@')}
              className="w-full bg-accent py-4 text-[10px] font-mono tracking-[0.4em] uppercase disabled:opacity-20 transition-all active-feedback"
            >
              Link Identity
            </button>
          </form>
        </div>

        <button
          onClick={onSkip}
          className="w-full text-[10px] font-mono tracking-[0.4em] uppercase text-textSecondary/40 hover:text-textSecondary/80 transition-colors active-feedback"
        >
          Enter as guest node
        </button>
      </div>
    </div>
  );
};

export default Auth;
