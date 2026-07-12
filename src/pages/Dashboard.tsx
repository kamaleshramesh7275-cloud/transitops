import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToCollection, formatDateField } from '../services/db';
import type { VehicleDoc, DriverDoc, TripDoc, ExpenseDoc } from '../types';
import {
  TrendingUp,
  Truck,
  Users,
  Compass,
  DollarSign,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Map as MapIcon
} from 'lucide-react';
import { CommandCenterMap } from '../components/CommandCenterMap';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<VehicleDoc[]>([]);
  const [drivers, setDrivers] = useState<DriverDoc[]>([]);
  const [trips, setTrips] = useState<TripDoc[]>([]);
  const [expenses, setExpenses] = useState<ExpenseDoc[]>([]);

  useEffect(() => {
    // Register listeners
    const unsubVehicles = subscribeToCollection<VehicleDoc>('vehicles', setVehicles);
    const unsubDrivers = subscribeToCollection<DriverDoc>('drivers', setDrivers);
    const unsubTrips = subscribeToCollection<TripDoc>('trips', setTrips);
    const unsubExpenses = subscribeToCollection<ExpenseDoc>('expenses', setExpenses);

    return () => {
      unsubVehicles();
      unsubDrivers();
      unsubTrips();
      unsubExpenses();
    };
  }, []);

  // calculations
  const activeVehicles = vehicles.filter(v => v.status === 'on_trip').length;
  const totalVehicles = vehicles.length;
  const utilizationRate = totalVehicles
    ? Math.round(((vehicles.filter(v => ['on_trip', 'maintenance'].includes(v.status)).length) / totalVehicles) * 100)
    : 0;

  const activeTrips = trips.filter(t => t.status === 'on_trip').length;
  const availableDrivers = drivers.filter(d => d.status === 'available').length;
  
  const approvedExpenses = expenses
    .filter(e => e.status === 'approved')
    .reduce((sum, exp) => sum + exp.amount, 0);

  // License Expirations checking (Alerts)
  const criticalDrivers = drivers.filter(d => {
    const expiry = formatDateField(d.licenseExpiry);
    const diffTime = expiry.getTime() - Date.now();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30; // Expires in 30 days or already expired
  });

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome Banner */}
      <div className="glassmorphism rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[30%] h-full bg-brand-primary/5 blur-[50px] pointer-events-none" />
        <div className="flex flex-col gap-1.5 z-10">
          <h2 className="text-xl md:text-2xl font-bold text-white">Welcome back, {user?.displayName}</h2>
          <p className="text-zinc-400 text-xs md:text-sm">
            Here's the current operational status for the TransitOps fleet network.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#18181b] border border-[#3f3f46] text-xs text-zinc-300 font-medium z-10 shadow-sm">
          <Calendar size={14} className="text-brand-primary" />
          {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Active Vehicles */}
        <div className="glassmorphism rounded-xl p-5 border border-[#27272a] flex flex-col gap-4 relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Active Vehicles</span>
            <div className="h-9 w-9 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary">
              <Truck size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">{activeVehicles}</span>
            <span className="text-xs text-zinc-500">/ {totalVehicles} in fleet</span>
          </div>
          <div className="text-[11px] text-zinc-400 flex items-center gap-1 border-t border-[#27272a] pt-3">
            <TrendingUp size={12} className="text-brand-primary" />
            <span>{utilizationRate}% Fleet utilization rate</span>
          </div>
        </div>

        {/* Card 2: Active Trips */}
        <div className="glassmorphism rounded-xl p-5 border border-[#27272a] flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Active Trips</span>
            <div className="h-9 w-9 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300">
              <Compass size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">{activeTrips}</span>
            <span className="text-xs text-zinc-500">trips in transit</span>
          </div>
          <div className="text-[11px] text-zinc-400 flex items-center gap-1 border-t border-[#27272a] pt-3">
            <CheckCircle2 size={12} className="text-zinc-300" />
            <span>Real-time dispatch streams active</span>
          </div>
        </div>

        {/* Card 3: Available Drivers */}
        <div className="glassmorphism rounded-xl p-5 border border-[#27272a] flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Available Drivers</span>
            <div className="h-9 w-9 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300">
              <Users size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">{availableDrivers}</span>
            <span className="text-xs text-zinc-500">drivers on stand-by</span>
          </div>
          <div className="text-[11px] text-zinc-400 flex items-center gap-1 border-t border-[#27272a] pt-3">
            <ShieldCheck size={12} className="text-zinc-300" />
            <span>All active sessions healthy</span>
          </div>
        </div>

        {/* Card 4: Monthly Operating Costs */}
        <div className="glassmorphism rounded-xl p-5 border border-[#27272a] flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Operating Costs</span>
            <div className="h-9 w-9 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">
              ${approvedExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="text-[11px] text-zinc-400 flex items-center gap-1 border-t border-[#27272a] pt-3">
            <ArrowUpRight size={12} className="text-zinc-300" />
            <span>Total approved expenses</span>
          </div>
        </div>

      </div>

      {/* Command Center Map */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <MapIcon size={20} className="text-brand-primary" />
          <h3 className="text-lg font-bold text-white tracking-wide">Command Center</h3>
        </div>
        <CommandCenterMap activeTrips={trips.filter(t => t.status === 'on_trip')} />
      </div>

      {/* Main Grid Area: Feed & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Trips Feed */}
        <div className="lg:col-span-2 glassmorphism rounded-xl p-6 border border-[#27272a] flex flex-col gap-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Active Trip Logs</h3>
          <div className="flex flex-col gap-3">
            {trips.length === 0 ? (
              <p className="text-xs text-zinc-500 py-6 text-center">No trips currently logged in system.</p>
            ) : (
              trips.map((trip) => (
                <div key={trip.id} className="p-4 rounded-lg bg-[#121212] border border-[#27272a] flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-xs font-mono font-bold text-zinc-400">{trip.tripNumber}</span>
                    <span className="text-sm text-zinc-200 truncate">{trip.origin} → {trip.destination}</span>
                    <span className="text-[11px] text-zinc-500 truncate">Cargo: {trip.cargoDescription} ({trip.cargoWeightKg} kg)</span>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full border
                      ${trip.status === 'on_trip' ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/20 animate-pulse-soft' : ''}
                      ${trip.status === 'scheduled' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : ''}
                      ${trip.status === 'completed' ? 'bg-slate-500/10 text-zinc-400 border-slate-500/20' : ''}
                      ${trip.status === 'cancelled' ? 'bg-red-500/10 text-red-400 border-red-500/20' : ''}
                    `}>
                      {trip.status.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-zinc-500">Est. {trip.estimatedDistanceKm} km</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Fleet Alerts / Compliance */}
        <div className="glassmorphism rounded-xl p-6 border border-[#27272a] flex flex-col gap-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Alerts & Compliance</h3>
          <div className="flex flex-col gap-3">
            {criticalDrivers.length === 0 ? (
              <div className="p-4 rounded-lg bg-[#121212]/40 border border-[#27272a] flex flex-col items-center justify-center py-8 text-center">
                <ShieldCheck size={28} className="text-brand-primary mb-2" />
                <p className="text-xs font-semibold text-zinc-200">System Fully Compliant</p>
                <p className="text-[10px] text-zinc-500 mt-1">All driver licenses & vehicle registrations healthy.</p>
              </div>
            ) : (
              criticalDrivers.map((driver) => {
                const expiry = formatDateField(driver.licenseExpiry);
                const isExpired = expiry.getTime() < Date.now();
                
                return (
                  <div key={driver.id} className="p-4 rounded-lg bg-red-500/5 border border-red-500/20 flex gap-3">
                    <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-zinc-200">License Expiring: {driver.fullName}</span>
                      <span className="text-[11px] text-zinc-400">License: {driver.licenseNumber} ({driver.licenseClass})</span>
                      <span className={`text-[10px] font-medium mt-1 ${isExpired ? 'text-red-400 font-bold' : 'text-amber-400'}`}>
                        {isExpired ? 'Expired' : 'Expires'} on {expiry.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
