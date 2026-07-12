import React, { useState, useEffect } from 'react';
import { subscribeToCollection, addDocToCollection, updateDocData, deleteDocFromCollection, formatDateField } from '../services/db';
import type { DriverDoc, VehicleDoc } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Plus, Edit2, Trash2, Users } from 'lucide-react';

// form state type
type DriverForm = Omit<DriverDoc, 'id' | 'createdAt' | 'updatedAt'>;

const emptyForm: DriverForm = {
  fullName: '',
  email: '',
  phoneNumber: '',
  licenseNumber: '',
  licenseClass: '',
  licenseExpiry: new Date().toISOString().split('T')[0] as any,
  status: 'available',
  assignedVehicleId: '',
};

export const Drivers: React.FC = () => {
  const [drivers, setDrivers] = useState<DriverDoc[]>([]);
  const [vehicles, setVehicles] = useState<VehicleDoc[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<DriverForm>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribeDrivers = subscribeToCollection<DriverDoc>('drivers', (data) => {
      setDrivers(data);
    });
    
    // We only need vehicles for the assignment dropdown
    const unsubscribeVehicles = subscribeToCollection<VehicleDoc>('vehicles', (data) => {
      setVehicles(data);
    });

    return () => {
      unsubscribeDrivers();
      unsubscribeVehicles();
    };
  }, []);

  const handleOpenModal = (driver?: DriverDoc) => {
    if (driver) {
      setEditingId(driver.id);
      setFormData({
        ...driver,
        assignedVehicleId: driver.assignedVehicleId || '',
        licenseExpiry: formatDateField(driver.licenseExpiry).toISOString().split('T')[0] as any
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
        assignedVehicleId: formData.assignedVehicleId === '' ? null : formData.assignedVehicleId,
        licenseExpiry: new Date(formData.licenseExpiry as unknown as string).toISOString(),
      };
      
      if (editingId) {
        await updateDocData('drivers', editingId, submitData);
      } else {
        await addDocToCollection('drivers', submitData);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to save driver", error);
      alert("Failed to save driver.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this driver? This action cannot be undone.")) {
      try {
        await deleteDocFromCollection('drivers', id);
      } catch (error) {
        console.error("Failed to delete driver", error);
      }
    }
  };

  const getStatusBadge = (status: DriverDoc['status']) => {
    switch(status) {
      case 'available': return <Badge variant="success">Available</Badge>;
      case 'on_trip': return <Badge variant="info">On Trip</Badge>;
      case 'suspended': return <Badge variant="danger">Suspended</Badge>;
      case 'off_duty': return <Badge variant="warning">Off Duty</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const checkLicenseExpiry = (expiry: any) => {
    const expiryDate = formatDateField(expiry);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return <Badge variant="danger" className="ml-2">Expired</Badge>;
    } else if (diffDays <= 30) {
      return <Badge variant="warning" className="ml-2">Expires in {diffDays} days</Badge>;
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-xl md:text-2xl font-bold text-white">Driver Profiles</h2>
          <p className="text-slate-400 text-xs md:text-sm">Manage driver license logs, contact details, status, and assignments.</p>
        </div>
        <Button onClick={() => handleOpenModal()} leftIcon={<Plus size={16} />}>
          Add Driver
        </Button>
      </div>

      <div className="glassmorphism rounded-xl border border-slate-800/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/50 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800/80">
              <tr>
                <th className="px-6 py-4">Driver</th>
                <th className="px-6 py-4">License & Expiry</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Assigned Vehicle</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {drivers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <Users size={32} className="mx-auto mb-3 opacity-50" />
                    <p>No drivers found. Add one to get started.</p>
                  </td>
                </tr>
              ) : (
                drivers.map((driver) => {
                  const assignedVehicle = vehicles.find(v => v.id === driver.assignedVehicleId);
                  
                  return (
                    <tr key={driver.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-200">{driver.fullName}</span>
                          <span className="text-xs text-slate-500">{driver.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex flex-col">
                            <span className="text-slate-300">{driver.licenseNumber}</span>
                            <span className="text-xs text-slate-500">{driver.licenseClass}</span>
                          </div>
                          {checkLicenseExpiry(driver.licenseExpiry)}
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(driver.status)}</td>
                      <td className="px-6 py-4">
                        {assignedVehicle ? (
                          <div className="flex items-center gap-2">
                            <Badge variant="neutral">{assignedVehicle.plateNumber}</Badge>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-xs italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleOpenModal(driver)}
                            className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(driver.id)}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingId ? 'Edit Driver' : 'Add New Driver'}
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Full Name" 
              required 
              value={formData.fullName}
              onChange={e => setFormData({...formData, fullName: e.target.value})}
              placeholder="e.g. John Doe"
            />
            <Input 
              label="Email" 
              type="email"
              required 
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              placeholder="e.g. driver@transitops.com"
            />
            <Input 
              label="Phone Number" 
              required 
              value={formData.phoneNumber}
              onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
              placeholder="e.g. +1 (555) 123-4567"
            />
            <Select 
              label="Status" 
              options={[
                { label: 'Available', value: 'available' },
                { label: 'On Trip', value: 'on_trip' },
                { label: 'Off Duty', value: 'off_duty' },
                { label: 'Suspended', value: 'suspended' },
              ]}
              value={formData.status}
              onChange={e => setFormData({...formData, status: e.target.value as any})}
            />
            <Input 
              label="License Number" 
              required 
              value={formData.licenseNumber}
              onChange={e => setFormData({...formData, licenseNumber: e.target.value})}
            />
            <Input 
              label="License Class" 
              required 
              value={formData.licenseClass}
              onChange={e => setFormData({...formData, licenseClass: e.target.value})}
              placeholder="e.g. Class A CDL"
            />
            <Input 
              label="License Expiry" 
              type="date" 
              required 
              value={formData.licenseExpiry as unknown as string}
              onChange={e => setFormData({...formData, licenseExpiry: e.target.value as any})}
            />
            <Select 
              label="Assigned Vehicle (Optional)" 
              options={[
                { label: '-- No Vehicle Assigned --', value: '' },
                ...vehicles.map(v => ({
                  label: `${v.plateNumber} (${v.make} ${v.model})`,
                  value: v.id
                }))
              ]}
              value={formData.assignedVehicleId || ''}
              onChange={e => setFormData({...formData, assignedVehicleId: e.target.value})}
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/50">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingId ? 'Save Changes' : 'Add Driver'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
