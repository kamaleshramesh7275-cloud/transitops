import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser } from '../services/auth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Mail, Lock, Sparkles, Key, AlertTriangle, Download } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const Login: React.FC = () => {
  const { isMock } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isInstallable, installApp } = usePWAInstall();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Email address is required.');
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const session = await loginUser(email, password || undefined);
      // Redirect based on role
      if (session.role === 'driver') {
        navigate('/driver-portal');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (presetEmail: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const session = await loginUser(presetEmail);
      if (session.role === 'driver') {
        navigate('/driver-portal');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const demoAccounts = [
    { role: 'Admin', email: 'admin@transitops.com', label: 'Systems & Control' },
    { role: 'Manager', email: 'manager@transitops.com', label: 'Fleet & Finances' },
    { role: 'Operator', email: 'operator@transitops.com', label: 'Trips & Dispatch' },
    { role: 'Driver', email: 'driver@transitops.com', label: 'Mobile View Portal' }
  ];

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0f172a] relative overflow-hidden px-4">
      {/* Decorative background shapes */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] rounded-full bg-brand-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[60%] rounded-full bg-zinc-800 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-5xl grid md:grid-cols-12 gap-8 items-center z-10">
        
        {/* Left Side: Brand Value Proposition */}
        <div className="md:col-span-6 flex flex-col gap-6 text-left">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-emerald-500/20">
              TO
            </div>
            <span className="text-xl font-bold tracking-wider text-white">TransitOps</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-extrabold leading-tight tracking-tight text-white">
            Smart Fleet <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Operations Platform</span>
          </h2>
          
          <p className="text-zinc-400 text-sm leading-relaxed max-w-md">
            Optimize dispatch logistics, monitor real-time vehicle metrics, track operational expenses, and streamline driver workflows on a singular serverless platform.
          </p>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="p-4 rounded-lg bg-[#121212]/50 border border-[#27272a] flex flex-col gap-1">
              <span className="text-brand-primary font-bold text-lg">0ms</span>
              <span className="text-xs text-zinc-500 uppercase tracking-wide font-semibold">Race Conditions</span>
            </div>
            <div className="p-4 rounded-lg bg-[#121212]/50 border border-[#27272a] flex flex-col gap-1">
              <span className="text-zinc-300 font-bold text-lg">100%</span>
              <span className="text-xs text-zinc-500 uppercase tracking-wide font-semibold">Serverless Architecture</span>
            </div>
          </div>

          {/* PWA Install Promo */}
          <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-brand-primary/20 flex flex-col sm:flex-row items-center gap-4 justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-white font-bold text-sm">Install TransitOps App</span>
              <span className="text-xs text-zinc-400">Get the native mobile experience with offline support.</span>
            </div>
            <Button 
              onClick={installApp} 
              disabled={!isInstallable}
              variant="ghost" 
              className="w-full sm:w-auto shrink-0 border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400 bg-emerald-500/5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={16} className="mr-2" />
              Install App
            </Button>
          </div>
        </div>

        {/* Right Side: Login card */}
        <div className="md:col-span-6">
          <div className="w-full glassmorphism rounded-2xl p-6 md:p-8 shadow-glass flex flex-col gap-6">
            <div className="flex flex-col gap-1.5 text-center md:text-left">
              <h3 className="text-xl font-bold text-white flex items-center gap-2 justify-center md:justify-start">
                System Access
                {isMock && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-brand-primary/30">
                    Mock Database Mode
                  </span>
                )}
              </h3>
              <p className="text-xs text-zinc-400">Sign in to access your administrative dashboard.</p>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-300 flex items-start gap-2.5">
                <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                label="Email Address"
                placeholder="you@transitops.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail size={16} />}
                required
              />

              <Input
                label="Security Key / Password"
                placeholder="••••••••"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock size={16} />}
                helperText={isMock ? "Password ignored in Mock Mode. Any password works." : undefined}
              />

              <Button
                variant="primary"
                type="submit"
                isLoading={isLoading}
                className="w-full mt-2"
              >
                Authenticate Session
              </Button>
            </form>

            {/* Quick Login Section in Mock Mode */}
            {isMock && (
              <div className="flex flex-col gap-3 mt-2 border-t border-[#27272a] pt-4">
                <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                  <Key size={12} className="text-amber-500" />
                  Quick Access Demo Accounts (Single Click Logins)
                </span>
                
                <div className="grid grid-cols-2 gap-2.5">
                  {demoAccounts.map((account) => (
                    <button
                      key={account.role}
                      onClick={() => handleQuickLogin(account.email)}
                      disabled={isLoading}
                      className="p-3 rounded-lg border border-[#27272a] hover:border-brand-primary/30 bg-[#121212]/50 hover:bg-brand-primary/5 text-left transition-all duration-200 group active:scale-[0.98]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-200 group-hover:text-brand-primary transition-colors">
                          {account.role}
                        </span>
                        <Sparkles size={10} className="text-slate-600 group-hover:text-brand-primary transition-colors" />
                      </div>
                      <span className="text-[10px] text-zinc-500 block truncate mt-0.5">{account.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
