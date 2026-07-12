import React, { useState, useEffect } from 'react';
import { subscribeToCollection } from '../services/db';
import type { TripDoc, VehicleDoc, DriverDoc } from '../types';
import { CommandCenterMap } from '../components/CommandCenterMap';
import { MapPin, Radio, Truck, User, ArrowRight, Clock } from 'lucide-react';

export const LiveTracking: React.FC = () => {
  const [trips, setTrips] = useState<TripDoc[]>([]);
  const [vehicles, setVehicles] = useState<VehicleDoc[]>([]);
  const [drivers, setDrivers] = useState<DriverDoc[]>([]);

  useEffect(() => {
    const unsub1 = subscribeToCollection<TripDoc>('trips', setTrips);
    const unsub2 = subscribeToCollection<VehicleDoc>('vehicles', setVehicles);
    const unsub3 = subscribeToCollection<DriverDoc>('drivers', setDrivers);
    return () => { unsub1(); unsub2(); unsub3(); };
  }, []);

  const activeTrips = trips.filter(t => t.status === 'on_trip');
  const scheduledTrips = trips.filter(t => t.status === 'scheduled');
  const onTripVehicles = vehicles.filter(v => v.status === 'on_trip');

  const getVehiclePlate = (vehicleId: string) =>
    vehicles.find(v => v.id === vehicleId)?.plateNumber ?? vehicleId;

  const getDriverName = (driverId: string) =>
    drivers.find(d => d.id === driverId)?.fullName ?? driverId;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center">
            <MapPin size={20} className="text-brand-primary" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white">Live Tracking</h2>
            <p className="text-zinc-400 text-xs md:text-sm">Real-time fleet map — active routes and vehicle positions.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-primary/10 border border-brand-primary/20 text-xs font-bold text-brand-primary tracking-widest">
          <Radio size={12} className="animate-pulse" />
          LIVE
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glassmorphism rounded-xl p-4 border border-[#27272a] flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-brand-primary/10 flex items-center justify-center">
            <Truck size={18} className="text-brand-primary" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Active Routes</p>
            <p className="text-2xl font-extrabold text-white">{activeTrips.length}</p>
          </div>
        </div>
        <div className="glassmorphism rounded-xl p-4 border border-[#27272a] flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-zinc-800 flex items-center justify-center">
            <Clock size={18} className="text-zinc-300" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Scheduled</p>
            <p className="text-2xl font-extrabold text-white">{scheduledTrips.length}</p>
          </div>
        </div>
        <div className="glassmorphism rounded-xl p-4 border border-[#27272a] flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-zinc-800 flex items-center justify-center">
            <User size={18} className="text-zinc-300" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Vehicles Out</p>
            <p className="text-2xl font-extrabold text-white">{onTripVehicles.length}</p>
          </div>
        </div>
      </div>

      {/* Full-height Map */}
      <div className="glassmorphism rounded-xl border border-[#27272a] overflow-hidden">
        <div className="px-5 py-3 border-b border-[#27272a] flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Command Center Map</span>
          {activeTrips.length > 0 && (
            <span className="text-[10px] text-brand-primary font-bold tracking-wider animate-pulse">
              ● {activeTrips.length} ROUTE{activeTrips.length > 1 ? 'S' : ''} LIVE
            </span>
          )}
        </div>
        <div className="h-[500px]">
          <CommandCenterMap activeTrips={activeTrips} fullHeight />
        </div>
      </div>

      {/* Active Trip Cards */}
      <div className="glassmorphism rounded-xl border border-[#27272a] overflow-hidden">
        <div className="px-5 py-3 border-b border-[#27272a]">
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Active Trip Log</span>
        </div>
        <div className="divide-y divide-[#27272a]">
          {activeTrips.length === 0 ? (
            <div className="py-10 text-center text-zinc-500 text-sm">
              <MapPin size={28} className="mx-auto mb-2 opacity-30" />
              No active trips. All vehicles are currently idle.
            </div>
          ) : (
            activeTrips.map(trip => (
              <div key={trip.id} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 px-5 py-4 hover:bg-[#18181b] transition-colors">
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-[10px] font-mono font-bold text-zinc-500 tracking-widest">{trip.tripNumber}</span>
                  <div className="flex items-center gap-2 text-sm text-zinc-200 font-medium">
                    <span className="truncate max-w-[140px]">{trip.origin}</span>
                    <ArrowRight size={14} className="shrink-0 text-brand-primary" />
                    <span className="truncate max-w-[140px]">{trip.destination}</span>
                  </div>
                  <span className="text-xs text-zinc-500">{trip.cargoDescription} — {trip.cargoWeightKg} kg</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-zinc-500">Vehicle</p>
                    <p className="text-sm text-zinc-300 font-mono">{getVehiclePlate(trip.vehicleId)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-zinc-500">Driver</p>
                    <p className="text-sm text-zinc-300">{getDriverName(trip.driverId)}</p>
                  </div>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/20 font-bold tracking-wider uppercase">
                    On Trip
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
