import React, { useState, useEffect } from 'react';
import { XIcon, LockIcon, LogoutIcon } from './Icons';
import { authService } from '../services/auth';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onLogout }) => {
  const [password, setPassword] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [autoLockMinutes, setAutoLockMinutes] = useState(15);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setMessage(null);
      setPassword('');
      const settings = authService.getSettings();
      setAutoLockMinutes(settings.autoLockMinutes);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      // Update settings
      authService.updateSettings({ autoLockMinutes });

      // Update password if provided
      if (password.trim()) {
          await authService.updatePassword(password);
          setMessage({ text: 'Settings & password updated. Please re-login.', type: 'success' });
          setTimeout(() => onLogout(), 1500); // Force logout on password change
          return;
      }
      
      setMessage({ text: 'Settings updated successfully', type: 'success' });
      setPassword(''); 
    } catch (err) {
      setMessage({ text: 'Failed to update settings', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen && !isVisible) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'visible opacity-100' : 'invisible opacity-0'}`}>
      <div 
        className="absolute inset-0 bg-stone-900/60 dark:bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      
      <div className={`bg-white/90 dark:bg-stone-900/90 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-3xl w-full max-w-md p-8 relative shadow-2xl transform transition-all duration-300 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
        <button 
          onClick={onClose}
          className="absolute right-6 top-6 text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors p-1 hover:bg-stone-100 dark:hover:bg-white/10 rounded-full"
        >
          <XIcon className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-serif font-bold text-stone-900 dark:text-white mb-2">Settings</h2>
        <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">Manage security and preferences.</p>

        <form onSubmit={handleSave} className="space-y-6">
           
           {/* Security: Auto Lock */}
           <div className="bg-stone-50 dark:bg-white/5 p-4 rounded-2xl border border-stone-100 dark:border-white/5">
             <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">Auto-Lock Timer</label>
             <select 
                value={autoLockMinutes}
                onChange={(e) => setAutoLockMinutes(Number(e.target.value))}
                className="block w-full px-4 py-3 bg-white dark:bg-black/30 border border-stone-200 dark:border-white/10 rounded-xl text-stone-900 dark:text-white focus:outline-none focus:border-primary cursor-pointer [&>option]:text-black font-medium"
             >
                <option value={0}>Never</option>
                <option value={1}>1 Minute</option>
                <option value={5}>5 Minutes</option>
                <option value={15}>15 Minutes (Default)</option>
                <option value={30}>30 Minutes</option>
                <option value={60}>1 Hour</option>
             </select>
             <p className="text-xs text-stone-400 mt-2">Automatically locks the library after inactivity.</p>
           </div>

           {/* Security: Password */}
           <div className="bg-stone-50 dark:bg-white/5 p-4 rounded-2xl border border-stone-100 dark:border-white/5">
             <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">Change Master Password</label>
             <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <LockIcon className="w-5 h-5" />
                </div>
                <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="block w-full pl-10 pr-4 py-3 bg-white dark:bg-black/30 border border-stone-200 dark:border-white/10 rounded-xl text-stone-900 dark:text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder-stone-300"
                />
             </div>
           </div>

           {message && (
             <div className={`p-3 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                {message.text}
             </div>
           )}

           <div className="pt-2 flex gap-3">
             <button 
                type="submit" 
                disabled={isSaving}
                className="flex-1 bg-stone-900 dark:bg-white text-white dark:text-stone-900 py-3.5 rounded-xl font-bold shadow-lg hover:shadow-xl hover:bg-stone-800 dark:hover:bg-stone-200 transition-all hover:-translate-y-0.5 disabled:opacity-50"
             >
                {isSaving ? 'Saving...' : 'Save Changes'}
             </button>
           </div>
        </form>

        <div className="mt-6 pt-6 border-t border-stone-200 dark:border-white/10">
            <button 
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 text-red-600 dark:text-red-400 font-bold py-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors text-sm uppercase tracking-wide"
            >
                <LogoutIcon className="w-4 h-4" />
                Lock Library
            </button>
        </div>

      </div>
    </div>
  );
};