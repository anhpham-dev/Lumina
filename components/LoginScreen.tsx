import React, { useState, useEffect } from 'react';
import { authService } from '../services/auth';
import { LockIcon } from './Icons';

interface LoginScreenProps {
  onLogin: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState<number | null>(null);

  useEffect(() => {
    let interval: number;
    if (lockoutTimer !== null && lockoutTimer > 0) {
        interval = window.setInterval(() => {
            setLockoutTimer(prev => (prev && prev > 1 ? prev - 1 : null));
        }, 1000);
    } else if (lockoutTimer === 0) {
        setLockoutTimer(null);
        setError('');
    }
    return () => clearInterval(interval);
  }, [lockoutTimer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutTimer) return;

    setLoading(true);
    setError('');

    try {
      const result = await authService.login(password);
      if (result.success) {
        onLogin();
      } else {
        if (result.lockoutRemaining) {
            setLockoutTimer(result.lockoutRemaining);
            setError(`Too many attempts. Try again in ${result.lockoutRemaining}s`);
        } else {
            setError(result.error || 'Incorrect password');
            // Shake effect could be added here
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] dark:bg-[#0a0a0a] flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors duration-500">
      
      {/* Liquid Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
         <div className="absolute top-[20%] left-[20%] w-[400px] h-[400px] bg-amber-200/40 dark:bg-amber-900/20 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-[60px] opacity-70 animate-blob"></div>
         <div className="absolute bottom-[20%] right-[20%] w-[400px] h-[400px] bg-purple-200/40 dark:bg-purple-900/20 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-[60px] opacity-70 animate-blob animation-delay-2000"></div>
      </div>

      <div className="w-full max-w-md bg-white/60 dark:bg-black/40 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/40 dark:border-white/10 animate-slide-up relative z-10">
        
        <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-amber-700 flex items-center justify-center text-white font-serif font-bold text-3xl shadow-lg shadow-primary/20 mx-auto mb-4 transform -rotate-3">L</div>
            <h1 className="font-serif font-bold text-3xl text-stone-900 dark:text-white mb-1">Lumina Library</h1>
            <p className="text-stone-500 dark:text-stone-400 text-sm">Enter master password to unlock</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400">
                <LockIcon className="w-5 h-5" />
              </div>
              <input
                type="password"
                placeholder={lockoutTimer ? `Locked for ${lockoutTimer}s` : "Master Password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={!!lockoutTimer}
                className={`block w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-white/5 border rounded-xl text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-4 transition-all
                    ${lockoutTimer 
                        ? 'border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-900/10 cursor-not-allowed text-red-500' 
                        : 'border-stone-200/50 dark:border-white/10 focus:border-primary focus:bg-white dark:focus:bg-black/50 focus:ring-primary/5'
                    }`}
                required
                autoFocus
              />
            </div>
          </div>

          {error && (
            <div className={`p-3 text-sm rounded-lg text-center font-medium animate-fade-in border ${lockoutTimer ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-200 border-red-200' : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 border-red-100 dark:border-red-900/50'}`}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !!lockoutTimer}
            className={`w-full text-white dark:text-stone-900 font-semibold py-3.5 rounded-xl shadow-lg transition-all flex justify-center
                ${lockoutTimer 
                    ? 'bg-stone-400 cursor-not-allowed' 
                    : 'bg-stone-900 dark:bg-white hover:bg-stone-800 dark:hover:bg-stone-200 hover:-translate-y-0.5'
                }`}
          >
            {loading ? (
               <div className="w-5 h-5 border-2 border-white/30 dark:border-black/30 border-t-white dark:border-t-black rounded-full animate-spin"></div>
            ) : lockoutTimer ? (
                "Locked"
            ) : (
                "Unlock Library"
            )}
          </button>
        </form>
        
        <p className="mt-8 text-stone-400 text-xs text-center flex items-center justify-center gap-1">
            <LockIcon className="w-3 h-3" />
            Protected by Secure Local Storage
        </p>
      </div>
    </div>
  );
};