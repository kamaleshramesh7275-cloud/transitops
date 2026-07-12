import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToCollection, getCollectionDocs } from '../services/db';
import type { TripDoc, DriverDoc } from '../types';
import { Compass, Calendar, ShieldCheck, MapPin, Truck, AlertCircle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DriverPortal: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [driverProfile, setDriverProfile] = useState<DriverDoc | null>(null);
  const [trips, setTrips] = useState<TripDoc[]>([]);

  useEffect(() => {
    // Resolve driver profile by matching logged-in user email
    const fetchProfile = async () => {
      try {
        const driversList = await getCollectionDocs<DriverDoc>('drivers');
        const profile = driversList.find(d => d.email.toLowerCase() === user?.email.toLowerCase());
        if (profile) {
          setDriverProfile(profile);
        }
      } catch (err) {
        console.error('Error fetching driver profile:', err);
      }
    };

    fetchProfile();
  }, [user]);

  useEffect(() => {
    if (!driverProfile) return;

    // Listen to trips where this driver is assigned
    const unsub = subscribeToCollection<TripDoc>('trips', (allTrips) => {
      const filtered = allTrips.filter(t => t.driverId === driverProfile.id);
      setTrips(filtered);
    });

    return () => unsub();
  }, [driverProfile]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const activeTrip = trips.find(t => t.status === 'on_trip');
  const upcomingTrips = trips.filter(t => t.status === 'scheduled');

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col max-w-md mx-auto border-x border-slate-800/80 shadow-2xl relative">
      {/* Driver Header */}
      <header className="glassmorphism p-5 flex items-center justify-between sticky top-0 z-20 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold border border-emerald-500/20">
            {user?.displayName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">{user?.displayName}</h1>
            <p className="text-[10px] text-emerald-400 font-semibold tracking-wide uppercase">Active Driver</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800/50 transition-colors"
        >
          <LogOut size={16} />
        </button>
      </header>

      {/* Main Scrollable Body */}
      <main className="flex-1 overflow-y-auto p-5 space-y-6">
        
        {/* Active Trip Card */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Compass size={14} className="text-emerald-400" />
            Current Assignment
          </h2>

          {activeTrip ? (
            <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 flex flex-col gap-4 shadow-lg shadow-emerald-500/5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-emerald-300">{activeTrip.tripNumber}</span>
                <span className="px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase rounded bg-emerald-400 text-slate-950">
                  IN TRANSIT
                </span>
              </div>

              <div className="flex flex-col gap-3 relative pl-4 border-l border-slate-800">
                <div className="absolute left-[-4.5px] top-[5px] h-2 w-2 rounded-full bg-emerald-500" />
                <div className="absolute left-[-4.5px] bottom-[5px] h-2 w-2 rounded-full bg-cyan-500" />
                
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Origin</span>
                  <span className="text-xs font-semibold text-slate-200">{activeTrip.origin}</span>
                </div>
                <div className="flex flex-col gap-0.5 pt-2">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Destination</span>
                  <span className="text-xs font-semibold text-slate-200">{activeTrip.destination}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-800/80 pt-4">
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <Truck size={14} className="text-slate-500" />
                  <div>
                    <p className="text-[9px] text-slate-500 uppercase font-semibold">Capacity</p>
                    <p className="text-[11px] font-bold text-slate-300">{activeTrip.cargoWeightKg} kg</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <MapPin size={14} className="text-slate-500" />
                  <div>
                    <p className="text-[9px] text-slate-500 uppercase font-semibold">Distance</p>
                    <p className="text-[11px] font-bold text-slate-300">{activeTrip.estimatedDistanceKm} km</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-850 flex flex-col items-center justify-center text-center py-10 gap-3">
              <ShieldCheck size={32} className="text-emerald-500" />
              <div>
                <p className="text-xs font-bold text-slate-200">No Active Trips</p>
                <p className="text-[10px] text-slate-500 mt-0.5">You are currently off-duty or awaiting dispatch.</p>
              </div>
            </div>
          )}
        </section>

        {/* Upcoming Tasks */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar size={14} className="text-slate-400" />
            Scheduled Assignments ({upcomingTrips.length})
          </h2>

          {upcomingTrips.length === 0 ? (
            <p className="text-[11px] text-slate-500 py-2">No upcoming jobs scheduled.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {upcomingTrips.map((trip) => (
                <div key={trip.id} className="p-4 rounded-lg bg-slate-900/40 border border-slate-800/80 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-300 truncate">{trip.origin} → {trip.destination}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{trip.tripNumber} • Cargo: {trip.cargoDescription}</p>
                  </div>
                  <span className="px-2 py-0.5 text-[9px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded">
                    Queued
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Compliance checklist info */}
        {driverProfile && (
          <section className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 flex items-start gap-3">
            <AlertCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <p className="text-xs font-bold text-slate-300">Driver License Status</p>
              <p className="text-[10px] text-slate-500">License: {driverProfile.licenseNumber} ({driverProfile.licenseClass})</p>
              <p className="text-[10px] text-slate-400 mt-1">
                Expiry: {new Date(driverProfile.licenseExpiry as any).toLocaleDateString()}
              </p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};
