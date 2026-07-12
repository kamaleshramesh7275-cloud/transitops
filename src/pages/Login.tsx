import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser } from '../services/auth';
import { Input } from '../components/ui/Input';
import { AlertTriangle, Grid } from 'lucide-react';

export const Login: React.FC = () => {
  const { isMock } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('dispatcher');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-fill email based on role selection in mock mode to make testing easy
  useEffect(() => {
    if (isMock) {
      if (role === 'fleet_manager') setEmail('fleet@transitops.in');
      else if (role === 'dispatcher') setEmail('dispatch@transitops.in');
      else if (role === 'safety_officer') setEmail('safety@transitops.in');
      else if (role === 'financial_analyst') setEmail('finance@transitops.in');
      else setEmail('');
    }
  }, [role, isMock]);

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
      // Redirect based on the actual session role
      if (session.role === 'fleet_manager') navigate('/vehicles');
      else if (session.role === 'dispatcher') navigate('/dashboard');
      else if (session.role === 'safety_officer') navigate('/drivers');
      else if (session.role === 'financial_analyst') navigate('/reports');
      else if (session.role === 'driver') navigate('/driver-portal');
      else navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Invalid credentials. Account locked after 5 failed attempts.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#0f172a] font-sans">
      
      {/* Left Side: Light panel */}
      <div className="w-full md:w-[45%] bg-[#cbd5e1] p-10 flex flex-col justify-between text-slate-800">
        <div>
          <div className="flex flex-col gap-2 mb-12 mt-10">
            <div className="w-12 h-12 bg-amber-600/20 border-2 border-amber-600 rounded grid place-items-center mb-2">
              <Grid className="text-amber-700" size={24} />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">TransitOps</h1>
            <p className="text-sm font-medium text-slate-600 tracking-wide uppercase">Smart Transport Operations Platform</p>
          </div>

          <div className="mt-16">
            <h2 className="text-xl font-bold mb-6">One login, four roles:</h2>
            <ul className="flex flex-col gap-4 text-base font-medium">
              <li className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-amber-600 shrink-0"></span>
                Fleet Manager
              </li>
              <li className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-amber-600 shrink-0"></span>
                Dispatcher
              </li>
              <li className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-amber-600 shrink-0"></span>
                Safety Officer
              </li>
              <li className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-amber-600 shrink-0"></span>
                Financial Analyst
              </li>
            </ul>
          </div>
        </div>

        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-20">
          TransitOps © 2026 • RBAC Enabled
        </div>
      </div>

      {/* Right Side: Login form */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-32 relative">
        <div className="max-w-md w-full mx-auto">
          
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-white mb-2">Sign in to your account</h2>
            <p className="text-sm text-zinc-400">Enter your credentials to continue</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg border border-red-500/30 bg-red-500/10 flex items-start gap-3 text-red-200 text-sm">
              <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-400 mb-1">Error state</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Input
              label="EMAIL"
              type="email"
              placeholder="name@transitops.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="PASSWORD"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              helperText={isMock ? "Any password works in Mock Mode." : undefined}
            />

            <div className="w-full flex flex-col gap-1.5">
              <label htmlFor="role-select" className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                ROLE (RBAC)
              </label>
              <div className="relative">
                <select
                  id="role-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-lg text-zinc-200 text-sm py-2.5 px-4 appearance-none focus:outline-none focus:border-brand-primary/80 focus:ring-1 focus:ring-brand-primary/30"
                >
                  <option value="fleet_manager">Fleet Manager</option>
                  <option value="dispatcher">Dispatcher</option>
                  <option value="safety_officer">Safety Officer</option>
                  <option value="financial_analyst">Financial Analyst</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-400">
                  <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded bg-[#18181b] border-[#27272a] text-amber-600 focus:ring-amber-600/30 focus:ring-offset-[#0f172a]" defaultChecked />
                <span className="text-sm text-zinc-300">Remember me</span>
              </label>
              <button type="button" className="text-sm font-medium text-blue-400 hover:text-blue-300">
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors mt-4 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center h-12"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[#27272a] text-xs text-zinc-400 leading-relaxed">
            <p className="mb-2 italic">Access is scoped by role after login:</p>
            <ul className="flex flex-col gap-1 pl-1">
              <li>• Fleet Manager → Fleet, Maintenance</li>
              <li>• Dispatcher → Dashboard, Trips</li>
              <li>• Safety Officer → Drivers, Compliance</li>
              <li>• Financial Analyst → Fuel & Expenses, Analytics</li>
            </ul>
          </div>
          
        </div>
      </div>
    </div>
  );
};
