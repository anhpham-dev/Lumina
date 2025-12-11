const AUTH_STORAGE_KEY = 'lumina_master_lock';
const SESSION_KEY = 'lumina_session';
const ATTEMPTS_KEY = 'lumina_login_attempts';
const SETTINGS_KEY = 'lumina_auth_settings';

interface AuthConfig {
  passwordHash: string;
}

interface AuthSettings {
  autoLockMinutes: number; // 0 = never
}

interface SessionData {
  expiresAt: number;
}

interface LoginAttempts {
  count: number;
  lockoutUntil: number;
}

// Client-side SHA-256 Hashing
async function hash(string: string) {
  const utf8 = new TextEncoder().encode(string);
  const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((bytes) => bytes.toString(16).padStart(2, '0')).join('');
}

export const authService = {
  async init() {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) {
      // Clean up old config if it exists
      localStorage.removeItem('lumina_auth_config');

      console.log("Initializing default master password...");
      const passwordHash = await hash('anhpham14079');
      const defaultConfig: AuthConfig = {
        passwordHash
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(defaultConfig));
    }

    // Init settings if missing
    if (!localStorage.getItem(SETTINGS_KEY)) {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify({ autoLockMinutes: 15 }));
    }
  },

  getSettings(): AuthSettings {
     const stored = localStorage.getItem(SETTINGS_KEY);
     return stored ? JSON.parse(stored) : { autoLockMinutes: 15 };
  },

  updateSettings(settings: Partial<AuthSettings>) {
      const current = this.getSettings();
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...current, ...settings }));
  },

  async login(password: string): Promise<{ success: boolean; error?: string; lockoutRemaining?: number }> {
    try {
      // 1. Check Brute Force Lockout
      const attemptsStr = localStorage.getItem(ATTEMPTS_KEY);
      let attempts: LoginAttempts = attemptsStr ? JSON.parse(attemptsStr) : { count: 0, lockoutUntil: 0 };

      if (Date.now() < attempts.lockoutUntil) {
          return { 
              success: false, 
              error: 'Too many attempts. Locked.', 
              lockoutRemaining: Math.ceil((attempts.lockoutUntil - Date.now()) / 1000) 
          };
      }

      // 2. Validate Password
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!stored) {
        await this.init();
        return this.login(password);
      }
      
      const config: AuthConfig = JSON.parse(stored);
      const inputHash = await hash(password);
      
      if (inputHash === config.passwordHash) {
          // Success: Reset attempts and start session
          localStorage.removeItem(ATTEMPTS_KEY);
          this.startSession();
          return { success: true };
      } else {
          // Failure: Increment attempts
          attempts.count += 1;
          if (attempts.count >= 5) {
              attempts.lockoutUntil = Date.now() + 30 * 1000; // 30 seconds lockout
              attempts.count = 0; // Reset count so they get another 5 tries after timeout
          }
          localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts));
          
          return { 
              success: false, 
              error: 'Incorrect password' 
          };
      }
    } catch (e) {
      console.error("Login error:", e);
      return { success: false, error: 'System error' };
    }
  },
  
  async updatePassword(password: string) {
     const stored = localStorage.getItem(AUTH_STORAGE_KEY);
     if (!stored) await this.init();

     if (password && password.trim() !== '') {
       const passwordHash = await hash(password);
       const config: AuthConfig = { passwordHash };
       localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(config));
       // Invalidate current session to force re-login with new password knowledge
       this.logout(); 
     }
  },

  // Session Management
  startSession() {
      // Session valid for 24 hours absolute, but auto-lock handles inactivity
      const session: SessionData = {
          expiresAt: Date.now() + (24 * 60 * 60 * 1000)
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  },

  checkSession(): boolean {
      const sessionStr = localStorage.getItem(SESSION_KEY);
      if (!sessionStr) return false;
      const session: SessionData = JSON.parse(sessionStr);
      if (Date.now() > session.expiresAt) {
          this.logout();
          return false;
      }
      return true;
  },

  logout() {
      localStorage.removeItem(SESSION_KEY);
  }
}