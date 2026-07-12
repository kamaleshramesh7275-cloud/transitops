import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToCollection, addDocToCollection, setDocData, formatDateField } from '../services/db';
import type { ExpenseDoc, TripDoc, VehicleDoc } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { formatCurrency } from '../utils/format';
import { exportToCSV, prepareExpenseCSV } from '../utils/export';
import {
  CreditCard, Plus, Search, CheckCircle2,
  AlertCircle, XCircle, DollarSign, DownloadCloud,
  FileText, Calendar, Truck
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

export const Expenses: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const canApprove = isAdmin || isManager;
  const { addNotification } = useNotifications();

  const [expenses, setExpenses] = useState<ExpenseDoc[]>([]);
  const [trips, setTrips] = useState<TripDoc[]>([]);
  const [vehicles, setVehicles] = useState<VehicleDoc[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formCategory, setFormCategory] = useState<ExpenseDoc['category']>('toll');
  const [formAmount, setFormAmount] = useState(0);
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formDescription, setFormDescription] = useState('');
  const [formTripId, setFormTripId] = useState('');
  const [formVehicleId, setFormVehicleId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const unsubExp = subscribeToCollection<ExpenseDoc>('expenses', setExpenses);
    const unsubTrips = subscribeToCollection<TripDoc>('trips', setTrips);
    const unsubVehicles = subscribeToCollection<VehicleDoc>('vehicles', setVehicles);
    return () => { unsubExp(); unsubTrips(); unsubVehicles(); };
  }, []);

  const openModal = () => {
    setFormCategory('toll');
    setFormAmount(0);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormDescription('');
    setFormTripId('');
    setFormVehicleId('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDescription.trim() || formAmount <= 0) {
      setFormError('Valid description and positive amount required.');
      return;
    }
    setFormError(null);
    setIsLoading(true);
    try {
      await addDocToCollection('expenses', {
        category: formCategory,
        amount: Number(formAmount),
        date: new Date(formDate),
        description: formDescription.trim(),
        status: canApprove ? 'approved' : 'pending',
        submittedBy: user?.uid,
        ...(formTripId ? { tripId: formTripId } : {}),
        ...(formVehicleId ? { vehicleId: formVehicleId } : {}),
      });
      setIsModalOpen(false);
      
      if (!canApprove) {
        addNotification(
          'New Expense Pending',
          `An expense for $${formAmount} has been submitted for approval by ${user?.displayName || 'a driver'}.`,
          'info'
        );
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit expense.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (expId: string, status: 'approved' | 'rejected') => {
    if (!canApprove) return;
    try {
      await setDocData('expenses', expId, {
        status,
        approvedBy: user?.uid,
        approvalDate: new Date(),
      });
    } catch (err: any) {
      alert('Failed to update status.');
    }
  };

  const handleExportCSV = () => {
    exportToCSV(prepareExpenseCSV(expenses), 'expenses-report');
  };

  const filteredExpenses = expenses.filter(exp => {
    const q = searchQuery.toLowerCase();
    const matchSearch = exp.description.toLowerCase().includes(q) || exp.category.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || exp.status === statusFilter;
    return matchSearch && matchStatus;
  }).sort((a, b) => new Date(b.date as any).getTime() - new Date(a.date as any).getTime());

  // KPIs
  const totalApproved = expenses.filter(e => e.status === 'approved').reduce((s, e) => s + e.amount, 0);
  const pendingCount = expenses.filter(e => e.status === 'pending').length;
  const pendingAmount = expenses.filter(e => e.status === 'pending').reduce((s, e) => s + e.amount, 0);

  const getStatusBadge = (s: ExpenseDoc['status']) => {
    const styles: Record<string, string> = {
      pending: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
      approved: 'bg-brand-primary/10 text-brand-primary border-emerald-500/25',
      rejected: 'bg-red-500/10 text-red-400 border-red-500/25',
    };
    return <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${styles[s]}`}>{s.toUpperCase()}</span>;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white">Expenses & Billing</h2>
          <p className="text-zinc-400 text-xs md:text-sm">Manage operational costs, approve reimbursements, and export billing data.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="glass" onClick={handleExportCSV} leftIcon={<DownloadCloud size={15} />} size="sm">Export CSV</Button>
          <Button variant="primary" onClick={openModal} leftIcon={<Plus size={16} />}>Log Expense</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glassmorphism p-4 rounded-xl border border-brand-primary/20 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary">
            <DollarSign size={20} />
          </div>
          <div>
            <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Approved Total</p>
            <p className="text-xl font-bold text-white mt-0.5">{formatCurrency(totalApproved)}</p>
          </div>
        </div>
        <div className="glassmorphism p-4 rounded-xl border border-amber-500/20 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
            <AlertCircle size={20} />
          </div>
          <div>
            <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Pending Approval</p>
            <p className="text-xl font-bold text-white mt-0.5">{pendingCount} Item{pendingCount !== 1 && 's'}</p>
          </div>
        </div>
        <div className="glassmorphism p-4 rounded-xl border border-[#27272a] flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center text-zinc-400">
            <FileText size={20} />
          </div>
          <div>
            <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Pending Amount</p>
            <p className="text-xl font-bold text-white mt-0.5">{formatCurrency(pendingAmount)}</p>
          </div>
        </div>
      </div>

      <div className="glassmorphism rounded-xl p-4 border border-[#27272a] grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Input
            placeholder="Search descriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={16} />}
          />
        </div>
        <Select
          options={[
            { value: 'all', label: 'All Statuses' },
            { value: 'pending', label: 'Pending' },
            { value: 'approved', label: 'Approved' },
            { value: 'rejected', label: 'Rejected' },
          ]}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-3">
        {filteredExpenses.length === 0 ? (
          <div className="glassmorphism rounded-xl p-12 border border-[#27272a] text-center text-zinc-500">No expenses found.</div>
        ) : (
          filteredExpenses.map(exp => {
            const expDate = formatDateField(exp.date);
            return (
              <div key={exp.id} className="glassmorphism rounded-xl p-5 border border-[#27272a] flex flex-col md:flex-row justify-between gap-4">
                <div className="flex flex-col gap-2 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-zinc-300 rounded">{exp.category}</span>
                    {getStatusBadge(exp.status)}
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xl font-bold text-white">{formatCurrency(exp.amount)}</span>
                    <span className="text-sm font-medium text-zinc-300">{exp.description}</span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-zinc-500 mt-1">
                    <span className="flex items-center gap-1"><Calendar size={12} />{expDate.toLocaleDateString()}</span>
                    {exp.tripId && <span className="flex items-center gap-1 text-cyan-500/80"><FileText size={12} />Trip: {exp.tripId.slice(-6)}</span>}
                    {exp.vehicleId && <span className="flex items-center gap-1 text-zinc-400"><Truck size={12} />Veh: {vehicles.find(v=>v.id===exp.vehicleId)?.plateNumber}</span>}
                  </div>
                </div>

                {canApprove && exp.status === 'pending' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => handleStatusUpdate(exp.id, 'rejected')} leftIcon={<XCircle size={14} className="text-red-400" />}>Reject</Button>
                    <Button variant="primary" size="sm" onClick={() => handleStatusUpdate(exp.id, 'approved')} leftIcon={<CheckCircle2 size={14} />}>Approve</Button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Log New Expense">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {formError && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-300">{formError}</div>}
          
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Expense Category *"
              options={[
                { value: 'toll', label: 'Road Toll' },
                { value: 'parking', label: 'Parking Fee' },
                { value: 'maintenance', label: 'Maintenance / Parts' },
                { value: 'fine', label: 'Fine / Citation' },
                { value: 'other', label: 'Other' }
              ]}
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value as any)}
            />
            <Input label="Date" type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
          </div>

          <Input label="Amount ($) *" type="number" value={formAmount} onChange={(e) => setFormAmount(Number(e.target.value))} />
          <Input label="Description *" placeholder="e.g. Interstate 35 Toll" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Link to Trip (Optional)"
              options={[{ value: '', label: 'None' }, ...trips.map(t => ({ value: t.id, label: t.tripNumber }))]}
              value={formTripId}
              onChange={(e) => setFormTripId(e.target.value)}
            />
            <Select
              label="Link to Vehicle (Optional)"
              options={[{ value: '', label: 'None' }, ...vehicles.map(v => ({ value: v.id, label: v.plateNumber }))]}
              value={formVehicleId}
              onChange={(e) => setFormVehicleId(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#27272a]">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" isLoading={isLoading} leftIcon={<CreditCard size={14} />}>
              {canApprove ? 'Save & Approve' : 'Submit for Approval'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
