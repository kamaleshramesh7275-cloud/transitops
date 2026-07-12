import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToCollection, formatDateField } from '../services/db';
import { dispatchTrip, completeTrip, cancelTrip } from '../services/operations';
import type { TripDoc, VehicleDoc, DriverDoc } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import {
  Plus, Search, CheckCircle2, XCircle,
  Route, Compass, Clock, AlertCircle,
  MapPin, Truck, Users, Package, ChevronRight, ChevronLeft
} from 'lucide-react';

type DispatchStep = 1 | 2 | 3;

export const Trips: React.FC = () => {
  const { user } = useAuth();
  const canWrite = user && user.role === 'dispatcher';

  const [trips, setTrips] = useState<TripDoc[]>([]);
  const [vehicles, setVehicles] = useState<VehicleDoc[]>([]);
  const [drivers, setDrivers] = useState<DriverDoc[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Dispatch Wizard modal
  const [isDispatchOpen, setIsDispatchOpen] = useState(false);
  const [dispatchStep, setDispatchStep] = useState<DispatchStep>(1);

  // Step 1: Route details
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [estimatedDistanceKm, setEstimatedDistanceKm] = useState(100);
  const [notes, setNotes] = useState('');

  // Step 2: Cargo details
  const [cargoDescription, setCargoDescription] = useState('');
  const [cargoWeightKg, setCargoWeightKg] = useState(1000);

  // Step 3: Resource assignment
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');

  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Complete trip modal
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [completingTrip, setCompletingTrip] = useState<TripDoc | null>(null);
  const [actualDistanceKm, setActualDistanceKm] = useState('');
  const [fuelConsumedLiters, setFuelConsumedLiters] = useState('');
  const [revenue, setRevenue] = useState('');
  const [completionNotes, setCompletionNotes] = useState('');

  useEffect(() => {
    const unsubTrips = subscribeToCollection<TripDoc>('trips', setTrips);
    const unsubVehicles = subscribeToCollection<VehicleDoc>('vehicles', setVehicles);
    const unsubDrivers = subscribeToCollection<DriverDoc>('drivers', setDrivers);
    return () => { unsubTrips(); unsubVehicles(); unsubDrivers(); };
  }, []);

  const availableVehicles = vehicles.filter(v => v.status === 'available');
  const availableDrivers = drivers.filter(d => d.status === 'available');

  const selectedVehicle = vehicles.find(v => v.id === vehicleId);

  const openDispatchModal = () => {
    setDispatchStep(1);
    setOrigin(''); setDestination(''); setEstimatedDistanceKm(100); setNotes('');
    setCargoDescription(''); setCargoWeightKg(1000);
    setVehicleId(availableVehicles[0]?.id || '');
    setDriverId(availableDrivers[0]?.id || '');
    setDispatchError(null);
    setIsDispatchOpen(true);
  };

  const handleStepForward = () => {
    setDispatchError(null);
    if (dispatchStep === 1) {
      if (!origin.trim() || !destination.trim()) {
        setDispatchError('Origin and destination are required.');
        return;
      }
      setDispatchStep(2);
    } else if (dispatchStep === 2) {
      if (!cargoDescription.trim() || cargoWeightKg <= 0) {
        setDispatchError('Cargo description and a valid weight are required.');
        return;
      }
      setDispatchStep(3);
    }
  };

  const handleDispatch = async () => {
    if (!vehicleId || !driverId) {
      setDispatchError('Select both a vehicle and a driver to dispatch.');
      return;
    }
    // Weight validation against selected vehicle
    if (selectedVehicle && cargoWeightKg > selectedVehicle.cargoCapacityKg) {
      setDispatchError(`Cargo weight (${cargoWeightKg}kg) exceeds ${selectedVehicle.plateNumber} capacity (${selectedVehicle.cargoCapacityKg}kg).`);
      return;
    }
    setDispatchError(null);
    setIsLoading(true);
    try {
      await dispatchTrip({ origin, destination, vehicleId, driverId, cargoDescription, cargoWeightKg, estimatedDistanceKm, notes });
      setIsDispatchOpen(false);
    } catch (err: any) {
      setDispatchError(err.message || 'Dispatch failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const openCompleteModal = (trip: TripDoc) => {
    setCompletingTrip(trip);
    setActualDistanceKm(String(trip.estimatedDistanceKm));
    setFuelConsumedLiters('');
    setRevenue('');
    setCompletionNotes('');
    setIsCompleteOpen(true);
  };

  const handleCompleteTrip = async () => {
    if (!completingTrip) return;
    setIsLoading(true);
    try {
      await completeTrip(completingTrip.id, {
        actualDistanceKm: actualDistanceKm ? Number(actualDistanceKm) : undefined,
        fuelConsumedLiters: fuelConsumedLiters ? Number(fuelConsumedLiters) : undefined,
        revenue: revenue ? Number(revenue) : undefined,
        notes: completionNotes || undefined,
      });
      setIsCompleteOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to complete trip.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelTrip = async (trip: TripDoc) => {
    if (!window.confirm(`Cancel trip ${trip.tripNumber}? Vehicle and driver will be freed.`)) return;
    try {
      await cancelTrip(trip.id);
    } catch (err: any) {
      alert(err.message || 'Failed to cancel trip.');
    }
  };

  const filteredTrips = trips.filter(t => {
    const q = searchQuery.toLowerCase();
    const matchSearch = t.tripNumber?.toLowerCase().includes(q) ||
      t.origin.toLowerCase().includes(q) ||
      t.destination.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Sort: active first, then scheduled, completed, cancelled
  const statusOrder: Record<string, number> = { on_trip: 0, scheduled: 1, completed: 2, cancelled: 3 };
  const sortedTrips = [...filteredTrips].sort((a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9));

  const getStatusBadge = (s: TripDoc['status']) => {
    const styles: Record<string, string> = {
      on_trip: 'bg-brand-primary/10 text-brand-primary border-emerald-500/25',
      scheduled: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
      completed: 'bg-slate-500/10 text-zinc-400 border-slate-500/20',
      cancelled: 'bg-red-500/10 text-red-400 border-red-500/25',
    };
    return (
      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${styles[s] || ''}`}>
        {s.replace('_', ' ')}
      </span>
    );
  };

  const activeCount = trips.filter(t => t.status === 'on_trip').length;
  const scheduledCount = trips.filter(t => t.status === 'scheduled').length;
  const completedCount = trips.filter(t => t.status === 'completed').length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white">Trips & Dispatch</h2>
          <p className="text-zinc-400 text-xs md:text-sm">Coordinate fleet dispatches, monitor active journeys, and complete delivery records.</p>
        </div>
        {canWrite && (
          <Button variant="primary" onClick={openDispatchModal} leftIcon={<Plus size={16} />}>
            Dispatch New Trip
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glassmorphism p-4 rounded-xl border border-brand-primary/20 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary">
            <Compass size={20} />
          </div>
          <div>
            <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">In Transit Now</p>
            <p className="text-xl font-bold text-white mt-0.5">{activeCount} Active</p>
          </div>
        </div>
        <div className="glassmorphism p-4 rounded-xl border border-amber-500/20 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Scheduled Queue</p>
            <p className="text-xl font-bold text-white mt-0.5">{scheduledCount} Queued</p>
          </div>
        </div>
        <div className="glassmorphism p-4 rounded-xl border border-[#27272a] flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center text-zinc-400">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Completed Total</p>
            <p className="text-xl font-bold text-white mt-0.5">{completedCount} Done</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glassmorphism rounded-xl p-4 border border-[#27272a] grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Input
            placeholder="Search by trip number, origin, or destination..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={16} />}
          />
        </div>
        <Select
          options={[
            { value: 'all', label: 'All Statuses' },
            { value: 'on_trip', label: 'In Transit' },
            { value: 'scheduled', label: 'Scheduled' },
            { value: 'completed', label: 'Completed' },
            { value: 'cancelled', label: 'Cancelled' },
          ]}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        />
      </div>

      {/* Trip Table */}
      <div className="glassmorphism rounded-xl border border-[#27272a] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#27272a] bg-[#121212] text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                <th className="py-4 px-5">Trip #</th>
                <th className="py-4 px-5">Route</th>
                <th className="py-4 px-5">Cargo</th>
                <th className="py-4 px-5">Vehicle / Driver</th>
                <th className="py-4 px-5">Departure</th>
                <th className="py-4 px-5">Status</th>
                {canWrite && <th className="py-4 px-5 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/60 text-sm">
              {sortedTrips.length === 0 ? (
                <tr>
                  <td colSpan={canWrite ? 7 : 6} className="py-12 px-5 text-center text-zinc-500">
                    No trips found. Dispatch a new trip to get started.
                  </td>
                </tr>
              ) : (
                sortedTrips.map((trip) => {
                  const vehicle = vehicles.find(v => v.id === trip.vehicleId);
                  const driver = drivers.find(d => d.id === trip.driverId);
                  const depTime = trip.departureTime ? formatDateField(trip.departureTime) : null;

                  return (
                    <tr key={trip.id} className="hover:bg-[#121212] transition-colors group">
                      <td className="py-4 px-5 font-mono font-bold text-zinc-300 text-xs">{trip.tripNumber}</td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2 text-xs">
                          <MapPin size={12} className="text-zinc-500 shrink-0" />
                          <div>
                            <span className="font-semibold text-zinc-200 block">{trip.origin}</span>
                            <span className="text-zinc-500 block">→ {trip.destination}</span>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-600 mt-0.5 block">{trip.estimatedDistanceKm} km est.</span>
                      </td>
                      <td className="py-4 px-5">
                        <span className="text-xs text-zinc-300 font-medium block truncate max-w-[160px]">{trip.cargoDescription}</span>
                        <span className="text-[11px] text-zinc-500">{trip.cargoWeightKg.toLocaleString()} kg</span>
                      </td>
                      <td className="py-4 px-5">
                        {vehicle && (
                          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                            <Truck size={12} className="text-zinc-500 shrink-0" />
                            <span className="font-mono text-zinc-300">{vehicle.plateNumber}</span>
                          </div>
                        )}
                        {driver && (
                          <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-0.5">
                            <Users size={12} className="text-zinc-500 shrink-0" />
                            <span className="text-zinc-400">{driver.fullName}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-5 text-xs text-zinc-400">
                        {depTime ? depTime.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="py-4 px-5">{getStatusBadge(trip.status)}</td>
                      {canWrite && (
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {trip.status === 'on_trip' && (
                              <button
                                onClick={() => openCompleteModal(trip)}
                                className="px-2.5 py-1 text-[11px] font-semibold text-brand-primary border border-brand-primary/30 rounded hover:bg-brand-primary/10 transition-colors"
                              >
                                Complete
                              </button>
                            )}
                            {['on_trip', 'scheduled'].includes(trip.status) && (
                              <button
                                onClick={() => handleCancelTrip(trip)}
                                className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                title="Cancel trip"
                              >
                                <XCircle size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Dispatch Wizard Modal ─── */}
      <Modal
        isOpen={isDispatchOpen}
        onClose={() => setIsDispatchOpen(false)}
        title="Dispatch New Trip"
      >
        <div className="flex flex-col gap-5">
          {/* Step Progress Bar */}
          <div className="flex items-center gap-2 justify-center">
            {([1, 2, 3] as DispatchStep[]).map((step) => (
              <React.Fragment key={step}>
                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold border transition-all
                  ${dispatchStep === step ? 'bg-emerald-500 text-white border-emerald-500' :
                    dispatchStep > step ? 'bg-emerald-500/20 text-brand-primary border-emerald-500/40' :
                    'bg-slate-800 text-zinc-500 border-slate-700'}`}>
                  {step}
                </div>
                {step < 3 && <div className={`flex-1 h-px ${dispatchStep > step ? 'bg-emerald-500/40' : 'bg-slate-700'}`} />}
              </React.Fragment>
            ))}
          </div>
          <div className="text-center -mt-2">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              {dispatchStep === 1 ? 'Step 1: Route Details' : dispatchStep === 2 ? 'Step 2: Cargo Information' : 'Step 3: Assign Resources'}
            </p>
          </div>

          {dispatchError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-300 flex items-start gap-2">
              <AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
              <span>{dispatchError}</span>
            </div>
          )}

          {/* Step 1: Route */}
          {dispatchStep === 1 && (
            <div className="flex flex-col gap-4">
              <Input
                label="Origin Location *"
                placeholder="e.g. Dallas TX Logistics Hub"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                leftIcon={<MapPin size={15} />}
              />
              <Input
                label="Destination *"
                placeholder="e.g. Austin TX Distribution Center"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                leftIcon={<MapPin size={15} />}
              />
              <Input
                label="Estimated Distance (km)"
                type="number"
                value={estimatedDistanceKm}
                onChange={(e) => setEstimatedDistanceKm(Number(e.target.value))}
              />
              <Input
                label="Notes (Optional)"
                placeholder="Any special instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          )}

          {/* Step 2: Cargo */}
          {dispatchStep === 2 && (
            <div className="flex flex-col gap-4">
              <div className="p-3 rounded-lg bg-[#121212] border border-[#27272a] text-xs text-zinc-400">
                <span className="font-semibold text-zinc-300">Route: </span>{origin} → {destination} ({estimatedDistanceKm} km)
              </div>
              <Input
                label="Cargo Description *"
                placeholder="e.g. Industrial CNC Machinery"
                value={cargoDescription}
                onChange={(e) => setCargoDescription(e.target.value)}
                leftIcon={<Package size={15} />}
              />
              <Input
                label="Cargo Weight (kg) *"
                type="number"
                value={cargoWeightKg}
                onChange={(e) => setCargoWeightKg(Number(e.target.value))}
                helperText="Vehicle capacity will be checked at dispatch time."
              />
            </div>
          )}

          {/* Step 3: Assign */}
          {dispatchStep === 3 && (
            <div className="flex flex-col gap-4">
              <div className="p-3 rounded-lg bg-[#121212] border border-[#27272a] text-xs text-zinc-400 flex flex-col gap-0.5">
                <span><span className="font-semibold text-zinc-300">Route: </span>{origin} → {destination}</span>
                <span><span className="font-semibold text-zinc-300">Cargo: </span>{cargoDescription} ({cargoWeightKg.toLocaleString()} kg)</span>
              </div>

              <Select
                label="Available Vehicle *"
                options={
                  availableVehicles.length === 0
                    ? [{ value: '', label: 'No vehicles available' }]
                    : availableVehicles.map(v => ({
                        value: v.id,
                        label: `${v.plateNumber} — ${v.make} ${v.model} (Cap: ${v.cargoCapacityKg.toLocaleString()} kg)`
                      }))
                }
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
              />

              {selectedVehicle && cargoWeightKg > selectedVehicle.cargoCapacityKg && (
                <p className="text-xs text-red-400 flex items-center gap-1.5">
                  <AlertCircle size={12} /> Cargo exceeds this vehicle's capacity!
                </p>
              )}

              <Select
                label="Available Driver *"
                options={
                  availableDrivers.length === 0
                    ? [{ value: '', label: 'No drivers available' }]
                    : availableDrivers.map(d => ({
                        value: d.id,
                        label: `${d.fullName} — ${d.licenseClass}`
                      }))
                }
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
              />
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-[#27272a]">
            <Button
              variant="ghost"
              onClick={() => dispatchStep === 1 ? setIsDispatchOpen(false) : setDispatchStep((s) => (s - 1) as DispatchStep)}
              leftIcon={dispatchStep > 1 ? <ChevronLeft size={15} /> : undefined}
            >
              {dispatchStep === 1 ? 'Cancel' : 'Back'}
            </Button>
            {dispatchStep < 3 ? (
              <Button variant="primary" onClick={handleStepForward} rightIcon={<ChevronRight size={15} />}>
                Next Step
              </Button>
            ) : (
              <Button variant="primary" onClick={handleDispatch} isLoading={isLoading} leftIcon={<Route size={15} />}>
                Dispatch Trip
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* Complete Trip Modal */}
      <Modal
        isOpen={isCompleteOpen}
        onClose={() => setIsCompleteOpen(false)}
        title={`Complete Trip: ${completingTrip?.tripNumber}`}
      >
        <div className="flex flex-col gap-4">
          {completingTrip && (
            <div className="p-3 rounded-lg bg-[#121212] border border-[#27272a] text-xs text-zinc-400">
              <span className="font-semibold text-zinc-300 block mb-1">{completingTrip.origin} → {completingTrip.destination}</span>
              <span>Cargo: {completingTrip.cargoDescription} ({completingTrip.cargoWeightKg.toLocaleString()} kg)</span>
            </div>
          )}
          <Input
            label="Actual Distance Travelled (km)"
            type="number"
            value={actualDistanceKm}
            onChange={(e) => setActualDistanceKm(e.target.value)}
          />
          <Input
            label="Fuel Consumed (Liters)"
            type="number"
            placeholder="0.0"
            value={fuelConsumedLiters}
            onChange={(e) => setFuelConsumedLiters(e.target.value)}
          />
          <Input
            label="Generated Revenue ($)"
            type="number"
            placeholder="e.g. 500"
            value={revenue}
            onChange={(e) => setRevenue(e.target.value)}
          />
          <Input
            label="Completion Notes (Optional)"
            placeholder="e.g. Delivered ahead of schedule"
            value={completionNotes}
            onChange={(e) => setCompletionNotes(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-[#27272a]">
            <Button variant="ghost" onClick={() => setIsCompleteOpen(false)}>Cancel</Button>
            <Button variant="primary" isLoading={isLoading} onClick={handleCompleteTrip} leftIcon={<CheckCircle2 size={15} />}>
              Mark as Completed
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
