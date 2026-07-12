import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToCollection, addDocToCollection, formatDateField } from '../services/db';
import type { FuelLogDoc, VehicleDoc, DriverDoc, TripDoc } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { formatCurrency, formatNumber } from '../utils/format';
import { exportToCSV, prepareFuelCSV } from '../utils/export';
import {
  Fuel as FuelIcon, Plus, Search, DownloadCloud,
  TrendingDown, DropletIcon, DollarSign, AlertCircle, Calendar
} from 'lucide-react';

export const Fuel: React.FC = () => {
  const { user } = useAuth();
  const canWrite = user && user.role === 'financial_analyst';

  const [fuelLogs, setFuelLogs] = useState<FuelLogDoc[]>([]);
  const [vehicles, setVehicles] = useState<VehicleDoc[]>([]);
  const [drivers, setDrivers] = useState<DriverDoc[]>([]);
  const [trips, setTrips] = useState<TripDoc[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formVehicleId, setFormVehicleId] = useState('');
  const [formDriverId, setFormDriverId] = useState('');
  const [formTripId, setFormTripId] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formLiters, setFormLiters] = useState(50);
  const [formCostPerLiter, setFormCostPerLiter] = useState(1.45);
  const [formOdometer, setFormOdometer] = useState(0);
  const [formStation, setFormStation] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const u1 = subscribeToCollection<FuelLogDoc>('fuelLogs', setFuelLogs);
    const u2 = subscribeToCollection<VehicleDoc>('vehicles', setVehicles);
    const u3 = subscribeToCollection<DriverDoc>('drivers', setDrivers);
    const u4 = subscribeToCollection<TripDoc>('trips', setTrips);
    return () => { u1(); u2(); u3(); u4(); };
  }, []);

  const openModal = () => {
    setFormVehicleId(vehicles[0]?.id || '');
    setFormDriverId(drivers[0]?.id || '');
    setFormTripId('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormLiters(50);
    setFormCostPerLiter(1.45);
    const v = vehicles[0];
    setFormOdometer(v ? v.currentMileage : 0);
    setFormStation('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleVehicleChange = (vid: string) => {
    setFormVehicleId(vid);
    const v = vehicles.find(v => v.id === vid);
    if (v) setFormOdometer(v.currentMileage);
  };

  const totalCost = Number((formLiters * formCostPerLiter).toFixed(2));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formVehicleId || !formStation.trim()) {
      setFormError('Vehicle and fuel station are required.');
      return;
    }
    setFormError(null);
    setIsLoading(true);
    try {
      await addDocToCollection('fuelLogs', {
        vehicleId: formVehicleId,
        driverId: formDriverId,
        ...(formTripId ? { tripId: formTripId } : {}),
        date: new Date(formDate),
        liters: Number(formLiters),
        costPerLiter: Number(formCostPerLiter),
        totalCost,
        odometerReading: Number(formOdometer),
        fuelStation: formStation.trim(),
      });
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save fuel log.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    exportToCSV(prepareFuelCSV(fuelLogs, vehicles, drivers), 'fuel-logs');
  };

  const filteredLogs = fuelLogs.filter(log => {
    const v = vehicles.find(v => v.id === log.vehicleId);
    const d = drivers.find(d => d.id === log.driverId);
    const q = searchQuery.toLowerCase();
    return (
      v?.plateNumber.toLowerCase().includes(q) ||
      d?.fullName.toLowerCase().includes(q) ||
      log.fuelStation.toLowerCase().includes(q)
    );
  }).sort((a, b) => new Date(b.date as any).getTime() - new Date(a.date as any).getTime());

  // KPIs
  const totalLiters = fuelLogs.reduce((s, l) => s + l.liters, 0);
  const totalSpent = fuelLogs.reduce((s, l) => s + l.totalCost, 0);
  const avgCostPerLiter = fuelLogs.length ? fuelLogs.reduce((s, l) => s + l.costPerLiter, 0) / fuelLogs.length : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white">Fuel Logs</h2>
          <p className="text-zinc-400 text-xs md:text-sm">Track fleet refuelling events, consumption rates, and expenditure per station.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="glass" onClick={handleExportCSV} leftIcon={<DownloadCloud size={15} />} size="sm">Export CSV</Button>
          {canWrite && (
            <Button variant="primary" onClick={openModal} leftIcon={<Plus size={16} />}>Log Refuelling</Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glassmorphism p-4 rounded-xl border border-[#27272a] flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300">
            <DropletIcon size={20} />
          </div>
          <div>
            <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Total Fuel Consumed</p>
            <p className="text-xl font-bold text-white mt-0.5">{formatNumber(totalLiters, 1)} L</p>
          </div>
        </div>
        <div className="glassmorphism p-4 rounded-xl border border-[#27272a] flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300">
            <DollarSign size={20} />
          </div>
          <div>
            <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Total Fuel Cost</p>
            <p className="text-xl font-bold text-white mt-0.5">{formatCurrency(totalSpent)}</p>
          </div>
        </div>
        <div className="glassmorphism p-4 rounded-xl border border-[#27272a] flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary">
            <TrendingDown size={20} />
          </div>
          <div>
            <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Avg. Cost / Liter</p>
            <p className="text-xl font-bold text-white mt-0.5">{formatCurrency(avgCostPerLiter)}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="glassmorphism rounded-xl p-4 border border-[#27272a]">
        <Input
          placeholder="Search by vehicle plate, driver, or station..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search size={16} />}
        />
      </div>

      {/* Log Table */}
      <div className="glassmorphism rounded-xl border border-[#27272a] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#27272a] bg-[#121212] text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                <th className="py-4 px-5">Date</th>
                <th className="py-4 px-5">Vehicle</th>
                <th className="py-4 px-5">Driver</th>
                <th className="py-4 px-5">Station</th>
                <th className="py-4 px-5">Liters</th>
                <th className="py-4 px-5">Cost / L</th>
                <th className="py-4 px-5">Total Cost</th>
                <th className="py-4 px-5">Odometer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/60 text-sm">
              {filteredLogs.length === 0 ? (
                <tr><td colSpan={8} className="py-12 px-5 text-center text-zinc-500">No fuel logs found.</td></tr>
              ) : (
                filteredLogs.map(log => {
                  const v = vehicles.find(v => v.id === log.vehicleId);
                  const d = drivers.find(d => d.id === log.driverId);
                  const logDate = formatDateField(log.date);
                  return (
                    <tr key={log.id} className="hover:bg-[#121212] transition-colors">
                      <td className="py-3.5 px-5 text-xs text-zinc-400">
                        <div className="flex items-center gap-1.5"><Calendar size={12} />{logDate.toLocaleDateString()}</div>
                      </td>
                      <td className="py-3.5 px-5 font-mono font-bold text-zinc-300 text-xs">{v ? v.plateNumber : '—'}</td>
                      <td className="py-3.5 px-5 text-xs text-zinc-400">{d ? d.fullName : '—'}</td>
                      <td className="py-3.5 px-5 text-xs text-zinc-300">{log.fuelStation}</td>
                      <td className="py-3.5 px-5 text-sm font-semibold text-zinc-300">{formatNumber(log.liters, 1)} L</td>
                      <td className="py-3.5 px-5 text-xs text-zinc-400">{formatCurrency(log.costPerLiter)}</td>
                      <td className="py-3.5 px-5 text-sm font-semibold text-brand-primary">{formatCurrency(log.totalCost)}</td>
                      <td className="py-3.5 px-5 text-xs text-zinc-500 font-mono">{log.odometerReading.toLocaleString()} km</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Log Fuel Refuelling">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {formError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-300 flex items-start gap-2">
              <AlertCircle size={15} className="text-red-400 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Vehicle *"
              options={vehicles.map(v => ({ value: v.id, label: `${v.plateNumber} — ${v.make} ${v.model}` }))}
              value={formVehicleId}
              onChange={(e) => handleVehicleChange(e.target.value)}
            />
            <Select
              label="Driver"
              options={[{ value: '', label: 'None' }, ...drivers.map(d => ({ value: d.id, label: d.fullName }))]}
              value={formDriverId}
              onChange={(e) => setFormDriverId(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Linked Trip (Optional)"
              options={[
                { value: '', label: 'No trip link' },
                ...trips.filter(t => t.status === 'on_trip').map(t => ({ value: t.id, label: `${t.tripNumber} — ${t.origin} → ${t.destination}` }))
              ]}
              value={formTripId}
              onChange={(e) => setFormTripId(e.target.value)}
            />
            <Input label="Date" type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
          </div>

          <Input
            label="Fuel Station / Location *"
            placeholder="e.g. Love's Travel Stop #482"
            value={formStation}
            onChange={(e) => setFormStation(e.target.value)}
            required
          />

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Liters Filled"
              type="number"
              value={formLiters}
              onChange={(e) => setFormLiters(Number(e.target.value))}
            />
            <Input
              label="Cost per Liter ($)"
              type="number"
              value={formCostPerLiter}
              onChange={(e) => setFormCostPerLiter(Number(e.target.value))}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Total Cost</label>
              <div className="bg-[#18181b] border border-slate-700/80 rounded-lg py-2.5 px-4 text-sm font-bold text-brand-primary">
                {formatCurrency(totalCost)}
              </div>
            </div>
          </div>

          <Input
            label="Odometer Reading (km)"
            type="number"
            value={formOdometer}
            onChange={(e) => setFormOdometer(Number(e.target.value))}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-[#27272a]">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" isLoading={isLoading} leftIcon={<FuelIcon size={14} />}>Save Fuel Log</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
