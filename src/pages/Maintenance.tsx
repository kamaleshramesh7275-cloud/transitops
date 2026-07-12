import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToCollection, formatDateField } from '../services/db';
import { sendVehicleToMaintenance, completeMaintenance } from '../services/operations';
import type { MaintenanceLogDoc, VehicleDoc } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import {
  Wrench, Plus, CheckCircle2, AlertCircle,
  ClipboardList, Clock, Search, Truck, DollarSign
} from 'lucide-react';

export const Maintenance: React.FC = () => {
  const { user } = useAuth();
  const canWrite = user && ['admin', 'manager', 'operator'].includes(user.role);

  const [logs, setLogs] = useState<MaintenanceLogDoc[]>([]);
  const [vehicles, setVehicles] = useState<VehicleDoc[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Schedule modal
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [schedVehicleId, setSchedVehicleId] = useState('');
  const [schedType, setSchedType] = useState<'routine' | 'repair' | 'inspection' | 'breakdown'>('routine');
  const [schedDescription, setSchedDescription] = useState('');
  const [schedCost, setSchedCost] = useState(0);
  const [schedDate, setSchedDate] = useState(new Date().toISOString().split('T')[0]);
  const [schedOdometer, setSchedOdometer] = useState(0);
  const [schedPerformedBy, setSchedPerformedBy] = useState('');
  const [schedError, setSchedError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const unsubLogs = subscribeToCollection<MaintenanceLogDoc>('maintenanceLogs', setLogs);
    const unsubVehicles = subscribeToCollection<VehicleDoc>('vehicles', setVehicles);
    return () => { unsubLogs(); unsubVehicles(); };
  }, []);

  const eligibleVehicles = vehicles.filter(v => v.status !== 'on_trip');

  const openScheduleModal = () => {
    if (!canWrite) return;
    setSchedVehicleId(eligibleVehicles[0]?.id || '');
    setSchedType('routine');
    setSchedDescription('');
    setSchedCost(0);
    setSchedDate(new Date().toISOString().split('T')[0]);
    const preVehicle = eligibleVehicles[0];
    setSchedOdometer(preVehicle ? preVehicle.currentMileage : 0);
    setSchedPerformedBy('');
    setSchedError(null);
    setIsScheduleOpen(true);
  };

  // Pre-fill odometer when vehicle selection changes
  const handleVehicleChange = (vid: string) => {
    setSchedVehicleId(vid);
    const v = vehicles.find(v => v.id === vid);
    if (v) setSchedOdometer(v.currentMileage);
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedVehicleId || !schedDescription.trim() || !schedPerformedBy.trim()) {
      setSchedError('Vehicle, description, and service provider are required.');
      return;
    }
    setSchedError(null);
    setIsLoading(true);
    try {
      await sendVehicleToMaintenance(schedVehicleId, {
        type: schedType,
        description: schedDescription.trim(),
        cost: Number(schedCost),
        scheduledDate: schedDate,
        odometerReading: Number(schedOdometer),
        performedBy: schedPerformedBy.trim(),
      });
      setIsScheduleOpen(false);
    } catch (err: any) {
      setSchedError(err.message || 'Failed to schedule maintenance.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteMaintenance = async (log: MaintenanceLogDoc) => {
    if (!window.confirm(`Mark maintenance for vehicle as completed? The vehicle will return to Available status.`)) return;
    try {
      await completeMaintenance(log.id, log.vehicleId);
    } catch (err: any) {
      alert(err.message || 'Failed to complete maintenance.');
    }
  };

  const filteredLogs = logs.filter(log => {
    const vehicle = vehicles.find(v => v.id === log.vehicleId);
    const q = searchQuery.toLowerCase();
    const matchSearch =
      log.description.toLowerCase().includes(q) ||
      log.performedBy.toLowerCase().includes(q) ||
      vehicle?.plateNumber.toLowerCase().includes(q) ||
      false;
    const matchStatus = statusFilter === 'all' || log.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Sort: in_progress first
  const sortedLogs = [...filteredLogs].sort((a, b) => {
    const order: Record<string, number> = { in_progress: 0, scheduled: 1, completed: 2 };
    return (order[a.status] ?? 9) - (order[b.status] ?? 9);
  });

  const getStatusBadge = (s: MaintenanceLogDoc['status']) => {
    const styles: Record<string, string> = {
      scheduled: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
      in_progress: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25',
      completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    };
    const labels: Record<string, string> = { scheduled: 'Scheduled', in_progress: 'In Progress', completed: 'Completed' };
    return (
      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${styles[s] || ''}`}>
        {labels[s] || s}
      </span>
    );
  };

  const getTypeBadge = (t: MaintenanceLogDoc['type']) => {
    const styles: Record<string, string> = {
      routine: 'text-slate-400 bg-slate-800/80',
      repair: 'text-rose-400 bg-rose-500/10',
      inspection: 'text-indigo-400 bg-indigo-500/10',
      breakdown: 'text-red-400 bg-red-500/10',
    };
    return (
      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded ${styles[t] || ''}`}>
        {t}
      </span>
    );
  };

  const activeCount = logs.filter(l => l.status === 'in_progress').length;
  const scheduledCount = logs.filter(l => l.status === 'scheduled').length;
  const totalCost = logs.filter(l => l.status === 'completed').reduce((sum, l) => sum + l.cost, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white">Maintenance Logs</h2>
          <p className="text-slate-400 text-xs md:text-sm">Schedule vehicle checkups, track repair costs, and manage shop availability locks.</p>
        </div>
        {canWrite && (
          <Button variant="primary" onClick={openScheduleModal} leftIcon={<Plus size={16} />}>
            Schedule Maintenance
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glassmorphism p-4 rounded-xl border border-cyan-500/20 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
            <Wrench size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Currently In Shop</p>
            <p className="text-xl font-bold text-white mt-0.5">{activeCount} Vehicle{activeCount !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="glassmorphism p-4 rounded-xl border border-amber-500/20 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Queued Maintenance</p>
            <p className="text-xl font-bold text-white mt-0.5">{scheduledCount} Scheduled</p>
          </div>
        </div>
        <div className="glassmorphism p-4 rounded-xl border border-slate-800/80 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
            <DollarSign size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Maintenance Cost</p>
            <p className="text-xl font-bold text-white mt-0.5">${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glassmorphism rounded-xl p-4 border border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Input
            placeholder="Search by description, service provider, or plate..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={16} />}
          />
        </div>
        <Select
          options={[
            { value: 'all', label: 'All Statuses' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'scheduled', label: 'Scheduled' },
            { value: 'completed', label: 'Completed' },
          ]}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        />
      </div>

      {/* Maintenance Log Cards */}
      <div className="flex flex-col gap-3">
        {sortedLogs.length === 0 ? (
          <div className="glassmorphism rounded-xl p-12 border border-slate-800/80 flex flex-col items-center gap-3 text-center">
            <ClipboardList size={32} className="text-slate-600" />
            <p className="text-sm font-semibold text-slate-300">No maintenance logs found.</p>
            <p className="text-xs text-slate-500">Schedule a maintenance session to get started.</p>
          </div>
        ) : (
          sortedLogs.map((log) => {
            const vehicle = vehicles.find(v => v.id === log.vehicleId);
            const schedDate = formatDateField(log.scheduledDate);
            const startDate = log.startDate ? formatDateField(log.startDate) : null;

            return (
              <div
                key={log.id}
                className={`glassmorphism rounded-xl p-5 border flex flex-col md:flex-row justify-between gap-4 transition-colors
                  ${log.status === 'in_progress' ? 'border-cyan-500/20 bg-cyan-500/3' : 'border-slate-800/80'}`}
              >
                {/* Left: Log Details */}
                <div className="flex flex-col gap-2 flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    {getTypeBadge(log.type)}
                    {getStatusBadge(log.status)}
                    {vehicle && (
                      <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-300">
                        <Truck size={12} className="text-slate-500" />
                        {vehicle.plateNumber} — {vehicle.make} {vehicle.model}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-slate-200">{log.description}</p>
                  <div className="flex flex-wrap gap-4 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1"><ClipboardList size={11} /> By: <span className="text-slate-400">{log.performedBy}</span></span>
                    <span className="flex items-center gap-1"><Clock size={11} /> Scheduled: <span className="text-slate-400">{schedDate.toLocaleDateString()}</span></span>
                    {startDate && <span className="flex items-center gap-1"><Wrench size={11} /> Started: <span className="text-slate-400">{startDate.toLocaleDateString()}</span></span>}
                    <span className="flex items-center gap-1"><DollarSign size={11} /> Cost: <span className="text-slate-400">${log.cost.toLocaleString()}</span></span>
                    <span className="flex items-center gap-1">Odometer: <span className="text-slate-400">{log.odometerReading.toLocaleString()} km</span></span>
                  </div>
                </div>

                {/* Right: Actions */}
                {canWrite && log.status === 'in_progress' && (
                  <div className="flex items-start md:items-center shrink-0">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleCompleteMaintenance(log)}
                      leftIcon={<CheckCircle2 size={14} />}
                    >
                      Mark Complete
                    </Button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Schedule Maintenance Modal */}
      <Modal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        title="Schedule Maintenance"
      >
        <form onSubmit={handleScheduleSubmit} className="flex flex-col gap-4">
          {schedError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-300 flex items-start gap-2">
              <AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
              <span>{schedError}</span>
            </div>
          )}

          <Select
            label="Select Vehicle *"
            options={
              eligibleVehicles.length === 0
                ? [{ value: '', label: 'No eligible vehicles (all on trip)' }]
                : eligibleVehicles.map(v => ({
                    value: v.id,
                    label: `${v.plateNumber} — ${v.make} ${v.model} (${v.status})`
                  }))
            }
            value={schedVehicleId}
            onChange={(e) => handleVehicleChange(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Maintenance Type"
              options={[
                { value: 'routine', label: 'Routine Servicing' },
                { value: 'inspection', label: 'Safety Inspection' },
                { value: 'repair', label: 'Mechanical Repair' },
                { value: 'breakdown', label: 'Emergency Breakdown' },
              ]}
              value={schedType}
              onChange={(e) => setSchedType(e.target.value as any)}
            />
            <Input
              label="Scheduled Date"
              type="date"
              value={schedDate}
              onChange={(e) => setSchedDate(e.target.value)}
            />
          </div>

          <Input
            label="Description *"
            placeholder="e.g. Annual DOT safety inspection and brake check"
            value={schedDescription}
            onChange={(e) => setSchedDescription(e.target.value)}
            required
          />

          <Input
            label="Service Provider / Facility *"
            placeholder="e.g. TX Truck Safety Authority"
            value={schedPerformedBy}
            onChange={(e) => setSchedPerformedBy(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Estimated Cost ($)"
              type="number"
              value={schedCost}
              onChange={(e) => setSchedCost(Number(e.target.value))}
            />
            <Input
              label="Odometer Reading (km)"
              type="number"
              value={schedOdometer}
              onChange={(e) => setSchedOdometer(Number(e.target.value))}
            />
          </div>

          <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs text-amber-400">
            ⚠ Scheduling maintenance will lock this vehicle from dispatch until the maintenance is marked complete.
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/80">
            <Button variant="ghost" type="button" onClick={() => setIsScheduleOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" isLoading={isLoading} leftIcon={<Wrench size={14} />}>
              Schedule & Lock Vehicle
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
