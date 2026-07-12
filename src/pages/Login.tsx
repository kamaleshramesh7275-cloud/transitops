import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser } from '../services/auth';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { AlertTriangle, Lock, Mail, Key, Sparkles, Download, User, ShieldCheck } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface DemoAccount {
  role: string;
  email: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

export const Login: React.FC = () => {
  const { isMock } = useAuth();
  const navigate = useNavigate();
  const { isInstallable, installApp } = usePWAInstall();

  // Main login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Role credential modal state
  const [selectedAccount, setSelectedAccount] = useState<DemoAccount | null>(null);
  const [modalPassword, setModalPassword] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);

  const routeBasedOnRole = (role: string) => {
    if (role === 'fleet_manager') navigate('/vehicles');
    else if (role === 'dispatcher') navigate('/dashboard');
    else if (role === 'safety_officer') navigate('/drivers');
    else if (role === 'financial_analyst') navigate('/reports');
    else if (role === 'driver') navigate('/driver-portal');
    else navigate('/dashboard');
  };

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
      routeBasedOnRole(session.role);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const openRoleModal = (account: DemoAccount) => {
    setSelectedAccount(account);
    setModalPassword('');
    setModalError(null);
  };

  const closeRoleModal = () => {
    if (isModalLoading) return;
    setSelectedAccount(null);
    setModalPassword('');
    setModalError(null);
  };

  const handleRoleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;
    setModalError(null);
    setIsModalLoading(true);
    try {
      const session = await loginUser(selectedAccount.email, modalPassword || undefined);
      routeBasedOnRole(session.role);
    } catch (err: any) {
      setModalError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setIsModalLoading(false);
    }
  };

  const demoAccounts: DemoAccount[] = [
    {
      role: 'Fleet Manager',
      email: 'fleet@transitops.in',
      label: 'Vehicles & Maintenance',
      icon: <ShieldCheck size={14} />,
      color: 'emerald',
    },
    {
      role: 'Dispatcher',
      email: 'dispatch@transitops.in',
      label: 'Trips & Dispatch',
      icon: <Sparkles size={14} />,
      color: 'cyan',
    },
    {
      role: 'Safety Officer',
      email: 'safety@transitops.in',
      label: 'Drivers & Compliance',
      icon: <ShieldCheck size={14} />,
      color: 'amber',
    },
    {
      role: 'Financial Analyst',
      email: 'finance@transitops.in',
      label: 'Fuel & Expenses',
      icon: <User size={14} />,
      color: 'violet',
    },
  ];

  const colorMap: Record<string, string> = {
    emerald: 'hover:border-emerald-500/40 hover:bg-emerald-500/5 group-hover:text-emerald-400',
    cyan: 'hover:border-cyan-500/40 hover:bg-cyan-500/5 group-hover:text-cyan-400',
    amber: 'hover:border-amber-500/40 hover:bg-amber-500/5 group-hover:text-amber-400',
    violet: 'hover:border-violet-500/40 hover:bg-violet-500/5 group-hover:text-violet-400',
  };

  const badgeColorMap: Record<string, string> = {
    emerald: 'text-emerald-400',
    cyan: 'text-cyan-400',
    amber: 'text-amber-400',
    violet: 'text-violet-400',
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0f172a] relative overflow-hidden px-4">
      {/* Decorative background shapes */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[60%] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />

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

          <p className="text-slate-400 text-sm leading-relaxed max-w-md">
            Optimize dispatch logistics, monitor real-time vehicle metrics, track operational expenses, and streamline driver workflows on a singular serverless platform.
          </p>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800/80 flex flex-col gap-1">
              <span className="text-emerald-400 font-bold text-lg">0ms</span>
              <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Race Conditions</span>
            </div>
            <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800/80 flex flex-col gap-1">
              <span className="text-cyan-400 font-bold text-lg">100%</span>
              <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Serverless Architecture</span>
            </div>
          </div>

          {/* PWA Install Promo */}
          {isInstallable && (
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-center gap-4 justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-white font-bold text-sm">Install TransitOps App</span>
                <span className="text-xs text-slate-400">Get the native mobile experience with offline support.</span>
              </div>
              <Button onClick={installApp} variant="ghost" className="w-full sm:w-auto shrink-0 border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400 bg-emerald-500/5">
                <Download size={16} className="mr-2" />
                Install App
              </Button>
            </div>
          )}
        </div>

        {/* Right Side: Login card */}
        <div className="md:col-span-6">
          <div className="w-full glassmorphism rounded-2xl p-6 md:p-8 shadow-glass flex flex-col gap-6">
            <div className="flex flex-col gap-1.5 text-center md:text-left">
              <h3 className="text-xl font-bold text-white flex items-center gap-2 justify-center md:justify-start">
                System Access (RBAC)
                {isMock && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Mock Mode
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">Sign in with your role-specific account.</p>
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
                placeholder="you@transitops.in"
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
              <div className="flex flex-col gap-3 mt-2 border-t border-slate-800/80 pt-4">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <Key size={12} className="text-amber-500" />
                  Quick Access — Select a Role to Sign In
                </span>

                <div className="grid grid-cols-2 gap-2.5">
                  {demoAccounts.map((account) => (
                    <button
                      key={account.role}
                      onClick={() => openRoleModal(account)}
                      disabled={isLoading}
                      className={`p-3 rounded-lg border border-slate-800 bg-slate-900/50 text-left transition-all duration-200 group active:scale-[0.98] ${colorMap[account.color]}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold text-slate-200 transition-colors ${badgeColorMap[account.color].replace('text-', 'group-hover:text-')}`}>
                          {account.role}
                        </span>
                        <span className={`transition-colors text-slate-600 ${badgeColorMap[account.color].replace('text-', 'group-hover:text-')}`}>
                          {account.icon}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 block truncate mt-0.5">{account.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Role Credential Modal */}
      <Modal
        isOpen={!!selectedAccount}
        onClose={closeRoleModal}
        title={`Sign in as ${selectedAccount?.role ?? ''}`}
      >
        <form onSubmit={handleRoleLogin} className="flex flex-col gap-5">
          {/* Role badge */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck size={16} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white">{selectedAccount?.role}</span>
              <span className="text-[10px] text-slate-500">{selectedAccount?.label}</span>
            </div>
          </div>

          {/* Pre-filled email (read-only) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Email Address</label>
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900/50">
              <Mail size={14} className="text-slate-500 shrink-0" />
              <span className="text-sm text-slate-300 font-mono">{selectedAccount?.email}</span>
            </div>
          </div>

          {/* Password field */}
          <Input
            label="Password"
            placeholder="••••••••"
            type="password"
            value={modalPassword}
            onChange={(e) => setModalPassword(e.target.value)}
            leftIcon={<Lock size={16} />}
            helperText={isMock ? 'Mock Mode: leave blank or enter anything.' : undefined}
            autoFocus
          />

          {modalError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-300 flex items-start gap-2.5">
              <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
              <span>{modalError}</span>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={closeRoleModal}
              disabled={isModalLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isModalLoading}
              className="flex-1"
            >
              Sign In
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
