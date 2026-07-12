import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToCollection, setDocData, addDocToCollection, deleteDocFromCollection, formatDateField } from '../services/db';
import type { VehicleDoc } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  Truck,
  Wrench,
  Activity,
  Calendar,
  FileText,
  UploadCloud
} from 'lucide-react';

export const Vehicles: React.FC = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<VehicleDoc[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal control states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleDoc | null>(null);

  // Form states
  const [plateNumber, setPlateNumber] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [type, setType] = useState<'truck' | 'van' | 'car' | 'trailer'>('truck');
  const [cargoCapacityKg, setCargoCapacityKg] = useState(15000);
  const [fuelType, setFuelType] = useState<'diesel' | 'gasoline' | 'electric' | 'hybrid'>('diesel');
  const [status, setStatus] = useState<VehicleDoc['status']>('available');
  const [currentMileage, setCurrentMileage] = useState(0);
  const [insuranceExpiry, setInsuranceExpiry] = useState(new Date().toISOString().split('T')[0]);
  const [acquisitionCost, setAcquisitionCost] = useState(0);
  const [documents, setDocuments] = useState<any[]>([]);

  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check RBAC permissions (fleet_manager can write)
  const canWrite = user && user.role === 'fleet_manager';

  useEffect(() => {
    const unsub = subscribeToCollection<VehicleDoc>('vehicles', setVehicles);
    return () => unsub();
  }, []);

  // Pre-fill form when editing
  const openEditModal = (vehicle: VehicleDoc) => {
    if (!canWrite) return;
    setEditingVehicle(vehicle);
    setPlateNumber(vehicle.plateNumber);
    setMake(vehicle.make);
    setModel(vehicle.model);
    setYear(vehicle.year);
    setType(vehicle.type);
    setCargoCapacityKg(vehicle.cargoCapacityKg);
    setFuelType(vehicle.fuelType);
    setStatus(vehicle.status);
    setCurrentMileage(vehicle.currentMileage);
    
    const expDate = formatDateField(vehicle.insuranceExpiry);
    setInsuranceExpiry(expDate.toISOString().split('T')[0]);
    setAcquisitionCost(vehicle.acquisitionCost || 0);
    setDocuments(vehicle.documents || []);
    
    setFormError(null);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    if (!canWrite) return;
    setEditingVehicle(null);
    setPlateNumber('');
    setMake('');
    setModel('');
    setYear(new Date().getFullYear());
    setType('truck');
    setCargoCapacityKg(5000);
    setFuelType('diesel');
    setStatus('available');
    setCurrentMileage(0);
    setInsuranceExpiry(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // 1 year ahead
    setAcquisitionCost(2000000);
    setDocuments([]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite) return;

    if (!plateNumber || !make || !model) {
      setFormError('Please fill out all required fields.');
      return;
    }

    // Plate uniqueness check
    const duplicate = vehicles.find(
      (v) =>
        v.plateNumber.toLowerCase().trim() === plateNumber.toLowerCase().trim() &&
        (!editingVehicle || v.id !== editingVehicle.id)
    );
    if (duplicate) {
      setFormError(`A vehicle with plate number '${plateNumber}' is already registered.`);
      return;
    }

    setFormError(null);
    setIsLoading(true);

    const vehiclePayload = {
      plateNumber: plateNumber.toUpperCase().trim(),
      make: make.trim(),
      model: model.trim(),
      year: Number(year),
      type,
      cargoCapacityKg: Number(cargoCapacityKg),
      fuelType,
      status,
      currentMileage: Number(currentMileage),
      insuranceExpiry: new Date(insuranceExpiry),
      acquisitionCost: Number(acquisitionCost),
      documents,
    };

    try {
      if (editingVehicle) {
        // Update document
        await setDocData('vehicles', editingVehicle.id, vehiclePayload);
      } else {
        // Add new document
        await addDocToCollection('vehicles', vehiclePayload);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'An error occurred while saving.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (vehicleId: string, plate: string) => {
    if (!canWrite) return;
    if (window.confirm(`Are you sure you want to delete vehicle ${plate} from the fleet registry?`)) {
      try {
        await deleteDocFromCollection('vehicles', vehicleId);
      } catch (err) {
        console.error('Error deleting vehicle:', err);
        alert('Could not delete vehicle.');
      }
    }
  };

  // Filter calculations
  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      v.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.model.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === 'all' || v.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusBadge = (vehStatus: VehicleDoc['status']) => {
    const styles = {
      available: 'bg-brand-primary/10 text-brand-primary border-emerald-500/25',
      on_trip: 'bg-zinc-800 text-zinc-300 border-cyan-500/25',
      maintenance: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
      retired: 'bg-red-500/10 text-red-400 border-red-500/25',
    };
    return (
      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${styles[vehStatus]}`}>
        {vehStatus.replace('_', ' ')}
      </span>
    );
  };

  // Header statistics calculation
  const totalCount = vehicles.length;
  const activeCount = vehicles.filter(v => v.status === 'on_trip').length;
  const maintCount = vehicles.filter(v => v.status === 'maintenance').length;

  return (
    <div className="flex flex-col gap-6">
      {/* Registry Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl md:text-2xl font-bold text-white">Vehicle Registry</h2>
          <p className="text-zinc-400 text-xs md:text-sm">Monitor fleet configurations, operational statuses, and compliance timelines.</p>
        </div>
        {canWrite && (
          <Button
            variant="primary"
            onClick={openAddModal}
            leftIcon={<Plus size={16} />}
          >
            Register Vehicle
          </Button>
        )}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glassmorphism p-4 rounded-xl border border-[#27272a] flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center text-zinc-300">
            <Truck size={20} />
          </div>
          <div>
            <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Total Registered</p>
            <p className="text-xl font-bold text-white mt-0.5">{totalCount} Vehicles</p>
          </div>
        </div>

        <div className="glassmorphism p-4 rounded-xl border border-[#27272a] flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-zinc-800 flex items-center justify-center text-cyan-450">
            <Activity size={20} />
          </div>
          <div>
            <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Active On-Trip</p>
            <p className="text-xl font-bold text-white mt-0.5">{activeCount} Vehicles</p>
          </div>
        </div>

        <div className="glassmorphism p-4 rounded-xl border border-[#27272a] flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-450">
            <Wrench size={20} />
          </div>
          <div>
            <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Under Maintenance</p>
            <p className="text-xl font-bold text-white mt-0.5">{maintCount} Vehicles</p>
          </div>
        </div>
      </div>

      {/* Control Filter Bar */}
      <div className="glassmorphism rounded-xl p-4 border border-[#27272a] grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        <div className="md:col-span-2">
          <Input
            placeholder="Search by plate number, make, or model..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={16} />}
          />
        </div>
        <div>
          <Select
            options={[
              { value: 'all', label: 'All Fleet Types' },
              { value: 'truck', label: 'Trucks' },
              { value: 'van', label: 'Vans' },
              { value: 'car', label: 'Cars' },
              { value: 'trailer', label: 'Trailers' },
            ]}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          />
        </div>
        <div>
          <Select
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'available', label: 'Available' },
              { value: 'on_trip', label: 'On Trip' },
              { value: 'maintenance', label: 'In Shop' },
              { value: 'retired', label: 'Retired' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Main Table Grid */}
      <div className="glassmorphism rounded-xl border border-[#27272a] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#27272a] bg-[#121212] text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                <th className="py-4 px-6">Plate Number</th>
                <th className="py-4 px-6">Specification</th>
                <th className="py-4 px-6">Category / Fuel</th>
                <th className="py-4 px-6">Mileage (km)</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Insurance Expiry</th>
                {canWrite && <th className="py-4 px-6 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/60 text-sm">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={canWrite ? 7 : 6} className="py-12 px-6 text-center text-zinc-500">
                    No vehicles found matching filters.
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((vehicle) => {
                  const insDate = formatDateField(vehicle.insuranceExpiry);
                  const isInsuranceExpired = insDate.getTime() < Date.now();
                  
                  return (
                    <tr key={vehicle.id} className="hover:bg-[#121212] transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-white">{vehicle.plateNumber}</td>
                      <td className="py-4 px-6">
                        <span className="font-semibold text-zinc-200">{vehicle.make} {vehicle.model}</span>
                        <span className="text-xs text-zinc-500 block mt-0.5">Year: {vehicle.year}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="capitalize text-zinc-300">{vehicle.type}</span>
                        <span className="text-xs text-zinc-500 block mt-0.5 capitalize">Capacity: {vehicle.cargoCapacityKg.toLocaleString()}kg • {vehicle.fuelType}</span>
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-350">{vehicle.currentMileage.toLocaleString()}</td>
                      <td className="py-4 px-6">{getStatusBadge(vehicle.status)}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} className={isInsuranceExpired ? 'text-red-400' : 'text-zinc-500'} />
                          <span className={isInsuranceExpired ? 'text-red-400 font-semibold' : 'text-zinc-300'}>
                            {insDate.toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      {canWrite && (
                        <td className="py-4 px-6 text-right">
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => openEditModal(vehicle)}
                              className="p-1.5 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-colors"
                              title="Edit specifications"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(vehicle.id, vehicle.plateNumber)}
                              className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                              title="Deregister vehicle"
                            >
                              <Trash2 size={14} />
                            </button>
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

      {/* CRUD Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingVehicle ? `Edit Specifications: ${plateNumber}` : 'Register New Vehicle'}
      >
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
          {formError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-300 flex items-start gap-2.5">
              <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Plate Number *"
              placeholder="e.g. TX-452-ABC"
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value)}
              required
            />
            <Input
              label="Manufacturing Year"
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Make *"
              placeholder="e.g. Volvo"
              value={make}
              onChange={(e) => setMake(e.target.value)}
              required
            />
            <Input
              label="Model *"
              placeholder="e.g. VNL 860"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Fleet Category"
              options={[
                { value: 'truck', label: 'Semi-Truck' },
                { value: 'van', label: 'Cargo Van' },
                { value: 'car', label: 'Sedan/SUV' },
                { value: 'trailer', label: 'Flatbed Trailer' },
              ]}
              value={type}
              onChange={(e) => setType(e.target.value as any)}
            />
            <Input
              label="Cargo Capacity (kg)"
              type="number"
              value={cargoCapacityKg}
              onChange={(e) => setCargoCapacityKg(Number(e.target.value))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Fuel Source"
              options={[
                { value: 'diesel', label: 'Diesel' },
                { value: 'gasoline', label: 'Gasoline' },
                { value: 'electric', label: 'Electric (EV)' },
                { value: 'hybrid', label: 'Hybrid' },
              ]}
              value={fuelType}
              onChange={(e) => setFuelType(e.target.value as any)}
            />
            <Input
              label="Current Odometer (km)"
              type="number"
              value={currentMileage}
              onChange={(e) => setCurrentMileage(Number(e.target.value))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Acquisition Cost ($)"
              type="number"
              value={acquisitionCost}
              onChange={(e) => setAcquisitionCost(Number(e.target.value))}
            />
            <Select
              label="Operational Status"
              options={[
                { value: 'available', label: 'Available' },
                { value: 'on_trip', label: 'On Trip' },
                { value: 'maintenance', label: 'In Shop (Maintenance)' },
                { value: 'retired', label: 'Retired' },
              ]}
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
            />
            <Input
              label="Insurance Expiry Date"
              type="date"
              value={insuranceExpiry}
              onChange={(e) => setInsuranceExpiry(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2 p-4 border border-[#27272a] rounded-lg bg-[#121212]/50 mt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <FileText size={14} /> Vehicle Documents
              </label>
              <Button
                variant="ghost"
                type="button"
                className="text-brand-primary text-xs py-1 px-2 h-auto"
                onClick={() => {
                  const newDoc = {
                    id: Math.random().toString(36).substr(2, 9),
                    name: `Document_${Math.floor(Math.random()*1000)}.pdf`,
                    url: '#',
                    uploadedAt: new Date().toISOString()
                  };
                  setDocuments([...documents, newDoc]);
                }}
              >
                <UploadCloud size={14} className="mr-1" /> Mock Upload
              </Button>
            </div>
            {documents.length === 0 ? (
              <p className="text-xs text-zinc-600 italic">No documents uploaded.</p>
            ) : (
              <div className="flex flex-col gap-2 mt-2">
                {documents.map(doc => (
                  <div key={doc.id} className="flex justify-between items-center text-xs bg-slate-800/50 p-2 rounded">
                    <span className="text-zinc-300">{doc.name}</span>
                    <button type="button" className="text-red-400 hover:text-red-300" onClick={() => setDocuments(documents.filter(d => d.id !== doc.id))}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-4 border-t border-[#27272a] pt-4">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={isLoading}
            >
              {editingVehicle ? 'Save Specifications' : 'Register Vehicle'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
