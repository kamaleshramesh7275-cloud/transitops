import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Truck,
  Users,
  Route,
  Wrench,
  Fuel,
  CreditCard,
  BarChart3,
  LogOut,
  Menu,
  X,
  User as UserIcon,
  Shield,
  Eye,
  MapPin
} from 'lucide-react';
import { NotificationCenter } from './layout/NotificationCenter';

interface SidebarItem {
  name: string;
  path: string;
  icon: React.ComponentType<any>;
  roles: ('admin' | 'manager' | 'operator')[];
}

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems: SidebarItem[] = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'manager', 'operator'],
    },
    {
      name: 'Vehicles',
      path: '/vehicles',
      icon: Truck,
      roles: ['admin', 'manager', 'operator'],
    },
    {
      name: 'Drivers',
      path: '/drivers',
      icon: Users,
      roles: ['admin', 'manager', 'operator'],
    },
    {
      name: 'Trips & Dispatch',
      path: '/trips',
      icon: Route,
      roles: ['admin', 'manager', 'operator'],
    },
    {
      name: 'Live Tracking',
      path: '/tracking',
      icon: MapPin,
      roles: ['admin', 'manager', 'operator'],
    },
    {
      name: 'Maintenance',
      path: '/maintenance',
      icon: Wrench,
      roles: ['admin', 'manager', 'operator'],
    },
    {
      name: 'Fuel Logs',
      path: '/fuel',
      icon: Fuel,
      roles: ['admin', 'manager', 'operator'],
    },
    {
      name: 'Expenses',
      path: '/expenses',
      icon: CreditCard,
      roles: ['admin', 'manager'],
    },
    {
      name: 'Reports & Analytics',
      path: '/reports',
      icon: BarChart3,
      roles: ['admin', 'manager'],
    },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const userRole = user?.role || 'driver';
  // Filter sidebar items by user role
  const allowedItems = navItems.filter((item) => item.roles.includes(userRole as any));

  const RoleBadge = () => {
    const colors = {
      admin: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      manager: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      operator: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      driver: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    };
    const colorClass = colors[userRole] || colors.driver;
    
    return (
      <span className={`px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full border ${colorClass}`}>
        {userRole}
      </span>
    );
  };

  return (
    <div className="h-[100dvh] bg-[#0f172a] text-slate-100 flex flex-col md:flex-row overflow-hidden">
      {/* Mobile Header */}
      <header className="md:hidden glassmorphism flex items-center justify-between px-4 py-3 z-30 sticky top-0">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center font-bold text-white text-base shadow-md shadow-emerald-500/20">
            T
          </div>
          <span className="font-semibold tracking-wide text-white">TransitOps</span>
        </div>
        <div className="flex items-center gap-2">
          <NotificationCenter />
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
          >
            {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Sidebar - Desktop & Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 glassmorphism border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out md:sticky md:top-0 md:h-screen md:translate-x-0
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo Section */}
        <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800/80">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-emerald-500/20">
            TO
          </div>
          <div>
            <h1 className="font-bold tracking-wider text-white text-base">TransitOps</h1>
            <p className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase">Fleet System</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          {allowedItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group
                  ${isActive
                    ? 'bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 text-emerald-400 border border-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                  }
                `}
              >
                <Icon size={18} className={isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-300'} />
                {item.name}
              </NavLink>
            );
          })}

          {/* Quick link to mock toggle / inspect driver portal if admin */}
          {userRole !== 'driver' && (
            <NavLink
              to="/driver-portal"
              onClick={() => setIsMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-300 hover:bg-slate-800/30 border border-transparent"
            >
              <Eye size={18} />
              Driver Portal <span className="text-[10px] bg-slate-800 text-slate-400 px-1 py-0.5 rounded">Preview</span>
            </NavLink>
          )}
        </nav>

        {/* User profile footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-300">
              <UserIcon size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">{user?.displayName}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <RoleBadge />
              </div>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-slate-800 hover:border-red-500/30 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-all duration-200"
          >
            <LogOut size={14} />
            Log Out
          </button>
        </div>
      </aside>

      {/* Backdrop for Mobile Menu */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-35 md:hidden"
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Top bar on desktop */}
        <header className="hidden md:flex items-center justify-between h-16 px-8 border-b border-slate-850 glassmorphism-light">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">Active Session:</span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 flex items-center gap-1 font-mono border border-slate-700">
              <Shield size={10} className="text-emerald-500" />
              {user?.email}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <NotificationCenter />
            <span className="text-xs text-slate-500">TransitOps Platform v1.0</span>
          </div>
        </header>

        {/* Viewport container */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
