import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToCollection, setDocData, addDocToCollection, deleteDocFromCollection, formatDateField } from '../services/db';
import type { DriverDoc, VehicleDoc } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Phone,
  Mail
} from 'lucide-react';

export const Drivers: React.FC = () => {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState<DriverDoc[]>([]);
  const [vehicles, setVehicles] = useState<VehicleDoc[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<DriverDoc | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseClass, setLicenseClass] = useState('Class A CDL');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [driverStatus, setDriverStatus] = useState<DriverDoc['status']>('available');
  const [assignedVehicleId, setAssignedVehicleId] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const canWrite = user && ['admin', 'manager', 'operator'].includes(user.role);

  useEffect(() => {
    const unsubDrivers = subscribeToCollection<DriverDoc>('drivers', setDrivers);
    const unsubVehicles = subscribeToCollection<VehicleDoc>('vehicles', setVehicles);
    return () => {
      unsubDrivers();
      unsubVehicles();
    };
  }, []);

  const getLicenseStatus = (expiryField: any): { daysLeft: number; label: string; style: string } => {
    const expiry = formatDateField(expiryField);
    const diffMs = expiry.getTime() - Date.now();
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) {
      return { daysLeft, label: 'Expired', style: 'bg-red-500/10 text-red-400 border-red-500/25' };
    } else if (daysLeft <= 30) {
      return { daysLeft, label: `Expiring in ${daysLeft}d`, style: 'bg-amber-500/10 text-amber-400 border-amber-500/25' };
    }
    return { daysLeft, label: 'Valid', style: 'bg-brand-primary/10 text-brand-primary border-emerald-500/25' };
  };

  const getStatusBadge = (s: DriverDoc['status']) => {
    const styles: Record<string, string> = {
      available: 'bg-brand-primary/10 text-brand-primary border-emerald-500/25',
      on_trip: 'bg-zinc-800 text-zinc-300 border-cyan-500/25',
      suspended: 'bg-red-500/10 text-red-400 border-red-500/25',
      off_duty: 'bg-slate-500/10 text-zinc-400 border-slate-500/25',
    };
    return (
      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${styles[s] || styles.off_duty}`}>
        {s.replace('_', ' ')}
      </span>
    );
  };

  const openAddModal = () => {
    if (!canWrite) return;
    setEditingDriver(null);
    setFullName(''); setEmail(''); setPhoneNumber('');
    setLicenseNumber(''); setLicenseClass('Class A CDL');
    setLicenseExpiry(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setDriverStatus('available'); setAssignedVehicleId('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (driver: DriverDoc) => {
    if (!canWrite) return;
    setEditingDriver(driver);
    setFullName(driver.fullName); setEmail(driver.email); setPhoneNumber(driver.phoneNumber);
    setLicenseNumber(driver.licenseNumber); setLicenseClass(driver.licenseClass);
    const expDate = formatDateField(driver.licenseExpiry);
    setLicenseExpiry(expDate.toISOString().split('T')[0]);
    setDriverStatus(driver.status);
    setAssignedVehicleId(driver.assignedVehicleId || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite) return;
    if (!fullName || !email || !licenseNumber) {
      setFormError('Full name, email, and license number are required.');
      return;
    }
    setFormError(null);
    setIsLoading(true);

    const payload = {
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phoneNumber: phoneNumber.trim(),
      licenseNumber: licenseNumber.trim().toUpperCase(),
      licenseClass: licenseClass.trim(),
      licenseExpiry: new Date(licenseExpiry),
      status: driverStatus,
      ...(assignedVehicleId ? { assignedVehicleId } : {}),
    };

    try {
      if (editingDriver) {
        await setDocData('drivers', editingDriver.id, payload);
      } else {
        await addDocToCollection('drivers', payload);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save driver profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (driverId: string, name: string) => {
    if (!canWrite) return;
    if (window.confirm(`Remove driver profile for "${name}" from the registry?`)) {
      try {
        await deleteDocFromCollection('drivers', driverId);
      } catch (err) {
        alert('Could not remove driver profile.');
      }
    }
  };

  const filteredDrivers = drivers.filter((d) => {
    const matchesSearch =
      d.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // KPI stats
  const totalCount = drivers.length;
  const availableCount = drivers.filter(d => d.status === 'available').length;
  const criticalCount = drivers.filter(d => {
    const { daysLeft } = getLicenseStatus(d.licenseExpiry);
    return daysLeft <= 30;
  }).length;

  const availableVehicles = vehicles.filter(v => v.status === 'available');

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl md:text-2xl font-bold text-white">Driver Profiles</h2>
          <p className="text-zinc-400 text-xs md:text-sm">Manage CDL license compliance, contact records, and trip assignment history.</p>
        </div>
        {canWrite && (
          <Button variant="primary" onClick={openAddModal} leftIcon={<Plus size={16} />}>
            Register Driver
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glassmorphism p-4 rounded-xl border border-[#27272a] flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center text-zinc-300">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Total Drivers</p>
            <p className="text-xl font-bold text-white mt-0.5">{totalCount} Registered</p>
          </div>
        </div>
        <div className="glassmorphism p-4 rounded-xl border border-[#27272a] flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Stand-by / Available</p>
            <p className="text-xl font-bold text-white mt-0.5">{availableCount} Drivers</p>
          </div>
        </div>
        <div className={`glassmorphism p-4 rounded-xl border flex items-center gap-4 ${criticalCount > 0 ? 'border-red-500/30 bg-red-500/5' : 'border-[#27272a]'}`}>
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${criticalCount > 0 ? 'bg-red-500/10 text-red-400' : 'bg-slate-800 text-zinc-500'}`}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">License Compliance Issues</p>
            <p className={`text-xl font-bold mt-0.5 ${criticalCount > 0 ? 'text-red-400' : 'text-white'}`}>
              {criticalCount} {criticalCount === 1 ? 'Alert' : 'Alerts'}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glassmorphism rounded-xl p-4 border border-[#27272a] grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <div className="md:col-span-2">
          <Input
            placeholder="Search by name, email, or license number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={16} />}
          />
        </div>
        <Select
          options={[
            { value: 'all', label: 'All Statuses' },
            { value: 'available', label: 'Available' },
            { value: 'on_trip', label: 'On Trip' },
            { value: 'off_duty', label: 'Off Duty' },
            { value: 'suspended', label: 'Suspended' },
          ]}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        />
      </div>

      {/* Drivers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredDrivers.length === 0 ? (
          <div className="md:col-span-2 xl:col-span-3 glassmorphism rounded-xl p-12 border border-[#27272a] flex flex-col items-center gap-3 text-center">
            <Users size={32} className="text-slate-600" />
            <p className="text-sm font-semibold text-zinc-300">No drivers match your search.</p>
            <p className="text-xs text-zinc-500">Try adjusting your filters or register a new driver.</p>
          </div>
        ) : (
          filteredDrivers.map((driver) => {
            const licStatus = getLicenseStatus(driver.licenseExpiry);
            const assignedVehicle = vehicles.find(v => v.id === driver.assignedVehicleId);

            return (
              <div
                key={driver.id}
                className={`glassmorphism rounded-xl p-5 border flex flex-col gap-4 transition-all duration-200 hover:border-slate-700/80 ${licStatus.daysLeft < 0 ? 'border-red-500/20' : licStatus.daysLeft <= 30 ? 'border-amber-500/20' : 'border-[#27272a]'}`}
              >
                {/* Driver Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700/60 flex items-center justify-center text-zinc-300 font-bold text-sm shrink-0">
                      {driver.fullName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{driver.fullName}</h3>
                      {getStatusBadge(driver.status)}
                    </div>
                  </div>
                  {canWrite && (
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => openEditModal(driver)} className="p-1.5 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-colors" title="Edit driver">
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => handleDelete(driver.id, driver.fullName)} className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors" title="Remove driver">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Contact Info */}
                <div className="flex flex-col gap-1.5 text-xs text-zinc-400">
                  <div className="flex items-center gap-2">
                    <Mail size={12} className="text-zinc-500 shrink-0" />
                    <span className="truncate">{driver.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={12} className="text-zinc-500 shrink-0" />
                    <span>{driver.phoneNumber}</span>
                  </div>
                </div>

                {/* License Info */}
                <div className="p-3 rounded-lg bg-[#121212]/50 border border-[#27272a] flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">License Details</span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${licStatus.style}`}>
                      {licStatus.label}
                    </span>
                  </div>
                  <p className="text-xs font-mono font-bold text-zinc-200">{driver.licenseNumber}</p>
                  <p className="text-[10px] text-zinc-500">{driver.licenseClass} • Expires {formatDateField(driver.licenseExpiry).toLocaleDateString()}</p>
                  
                  {licStatus.daysLeft <= 30 && (
                    <Button
                      variant="ghost"
                      className="mt-1 w-full text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 border border-amber-400/20 h-7"
                      onClick={() => alert(`Mock Email reminder sent to ${driver.email} regarding license renewal.`)}
                    >
                      Send Renewal Reminder
                    </Button>
                  )}
                </div>

                {/* Assigned Vehicle */}
                {assignedVehicle && (
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <Clock size={12} className="text-zinc-500" />
                    <span>Default Vehicle: <span className="text-zinc-300 font-mono font-semibold">{assignedVehicle.plateNumber}</span></span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDriver ? `Edit Profile: ${fullName}` : 'Register New Driver'}
      >
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
          {formError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-300 flex items-start gap-2.5">
              <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <Input
            label="Full Legal Name *"
            placeholder="e.g. John A. Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email Address *"
              type="email"
              placeholder="driver@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Phone Number"
              placeholder="+1 (555) 000-0000"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="CDL License Number *"
              placeholder="DL-12345678-A"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              required
            />
            <Input
              label="License Class"
              placeholder="Class A CDL"
              value={licenseClass}
              onChange={(e) => setLicenseClass(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="License Expiry Date"
              type="date"
              value={licenseExpiry}
              onChange={(e) => setLicenseExpiry(e.target.value)}
            />
            <Select
              label="Operational Status"
              options={[
                { value: 'available', label: 'Available' },
                { value: 'on_trip', label: 'On Trip' },
                { value: 'off_duty', label: 'Off Duty' },
                { value: 'suspended', label: 'Suspended' },
              ]}
              value={driverStatus}
              onChange={(e) => setDriverStatus(e.target.value as any)}
            />
          </div>

          <Select
            label="Assign Default Vehicle (Optional)"
            options={[
              { value: '', label: 'None (Unassigned)' },
              ...availableVehicles.map(v => ({
                value: v.id,
                label: `${v.plateNumber} — ${v.make} ${v.model}`
              }))
            ]}
            value={assignedVehicleId}
            onChange={(e) => setAssignedVehicleId(e.target.value)}
          />

          <div className="flex justify-end gap-3 mt-4 border-t border-[#27272a] pt-4">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isLoading}>
              {editingDriver ? 'Save Profile' : 'Register Driver'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
