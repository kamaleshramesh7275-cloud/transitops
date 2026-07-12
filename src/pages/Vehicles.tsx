import React, { useState, useEffect } from 'react';
import { subscribeToCollection, addDocToCollection, updateDocData, deleteDocFromCollection, formatDateField } from '../services/db';
import type { VehicleDoc } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Plus, Edit2, Trash2, Truck } from 'lucide-react';

// form state type
type VehicleForm = Omit<VehicleDoc, 'id' | 'createdAt' | 'updatedAt'>;

const emptyForm: VehicleForm = {
  plateNumber: '',
  make: '',
  model: '',
  year: new Date().getFullYear(),
  type: 'truck',
  cargoCapacityKg: 0,
  fuelType: 'diesel',
  status: 'available',
  currentMileage: 0,
  insuranceExpiry: new Date().toISOString().split('T')[0] as any, // Simple string representation for input
};

export const Vehicles: React.FC = () => {
  const [vehicles, setVehicles] = useState<VehicleDoc[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<VehicleForm>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToCollection<VehicleDoc>('vehicles', (data) => {
      setVehicles(data);
    });
    return () => unsubscribe();
  }, []);

  const handleOpenModal = (vehicle?: VehicleDoc) => {
    if (vehicle) {
      setEditingId(vehicle.id);
      setFormData({
        ...vehicle,
        insuranceExpiry: formatDateField(vehicle.insuranceExpiry).toISOString().split('T')[0] as any
      });
    } else {
      setEditingId(null);
      setFormData(emptyForm);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const submitData = {
        ...formData,
        insuranceExpiry: new Date(formData.insuranceExpiry as unknown as string).toISOString(),
      };
      
      if (editingId) {
        await updateDocData('vehicles', editingId, submitData);
      } else {
        await addDocToCollection('vehicles', submitData);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to save vehicle", error);
      alert("Failed to save vehicle.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this vehicle? This action cannot be undone.")) {
      try {
        await deleteDocFromCollection('vehicles', id);
      } catch (error) {
        console.error("Failed to delete vehicle", error);
      }
    }
  };

  const getStatusBadge = (status: VehicleDoc['status']) => {
    switch(status) {
      case 'available': return <Badge variant="success">Available</Badge>;
      case 'on_trip': return <Badge variant="info">On Trip</Badge>;
      case 'maintenance': return <Badge variant="warning">Maintenance</Badge>;
      case 'retired': return <Badge variant="danger">Retired</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-xl md:text-2xl font-bold text-white">Vehicle Registry</h2>
          <p className="text-slate-400 text-xs md:text-sm">Manage and monitor vehicle statuses, specifications, and mileage details.</p>
        </div>
        <Button onClick={() => handleOpenModal()} leftIcon={<Plus size={16} />}>
          Add Vehicle
        </Button>
      </div>

      <div className="glassmorphism rounded-xl border border-slate-800/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/50 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800/80">
              <tr>
                <th className="px-6 py-4">Vehicle</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Mileage</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {vehicles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <Truck size={32} className="mx-auto mb-3 opacity-50" />
                    <p>No vehicles found. Add one to get started.</p>
                  </td>
                </tr>
              ) : (
                vehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-200">{vehicle.plateNumber}</span>
                        <span className="text-xs text-slate-500">{vehicle.year} {vehicle.make} {vehicle.model}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 capitalize">{vehicle.type}</td>
                    <td className="px-6 py-4">{getStatusBadge(vehicle.status)}</td>
                    <td className="px-6 py-4">{vehicle.currentMileage.toLocaleString()} km</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenModal(vehicle)}
                          className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(vehicle.id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingId ? 'Edit Vehicle' : 'Add New Vehicle'}
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Plate Number" 
              required 
              value={formData.plateNumber}
              onChange={e => setFormData({...formData, plateNumber: e.target.value})}
              placeholder="e.g. TX-123-ABC"
            />
            <Select 
              label="Status" 
              options={[
                { label: 'Available', value: 'available' },
                { label: 'On Trip', value: 'on_trip' },
                { label: 'Maintenance', value: 'maintenance' },
                { label: 'Retired', value: 'retired' },
              ]}
              value={formData.status}
              onChange={e => setFormData({...formData, status: e.target.value as any})}
            />
            <Input 
              label="Make" 
              required 
              value={formData.make}
              onChange={e => setFormData({...formData, make: e.target.value})}
              placeholder="e.g. Volvo"
            />
            <Input 
              label="Model" 
              required 
              value={formData.model}
              onChange={e => setFormData({...formData, model: e.target.value})}
              placeholder="e.g. FH16"
            />
            <Input 
              label="Year" 
              type="number" 
              required 
              value={formData.year}
              onChange={e => setFormData({...formData, year: parseInt(e.target.value)})}
            />
            <Select 
              label="Type" 
              options={[
                { label: 'Truck', value: 'truck' },
                { label: 'Van', value: 'van' },
                { label: 'Car', value: 'car' },
                { label: 'Trailer', value: 'trailer' },
              ]}
              value={formData.type}
              onChange={e => setFormData({...formData, type: e.target.value as any})}
            />
            <Input 
              label="Cargo Capacity (Kg)" 
              type="number" 
              required 
              value={formData.cargoCapacityKg}
              onChange={e => setFormData({...formData, cargoCapacityKg: parseInt(e.target.value)})}
            />
            <Select 
              label="Fuel Type" 
              options={[
                { label: 'Diesel', value: 'diesel' },
                { label: 'Gasoline', value: 'gasoline' },
                { label: 'Electric', value: 'electric' },
                { label: 'Hybrid', value: 'hybrid' },
              ]}
              value={formData.fuelType}
              onChange={e => setFormData({...formData, fuelType: e.target.value as any})}
            />
            <Input 
              label="Current Mileage" 
              type="number" 
              required 
              value={formData.currentMileage}
              onChange={e => setFormData({...formData, currentMileage: parseInt(e.target.value)})}
            />
            <Input 
              label="Insurance Expiry" 
              type="date" 
              required 
              value={formData.insuranceExpiry as unknown as string}
              onChange={e => setFormData({...formData, insuranceExpiry: e.target.value as any})}
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/50">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingId ? 'Save Changes' : 'Add Vehicle'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
