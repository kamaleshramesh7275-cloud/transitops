import React, { useState, useEffect } from 'react';
import { subscribeToCollection } from '../services/db';
import type { TripDoc, ExpenseDoc, FuelLogDoc, MaintenanceLogDoc } from '../types';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { formatCurrency, formatNumber, bucketByMonth } from '../utils/format';
import { exportToPDF } from '../utils/export';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  Legend, ResponsiveContainer, LineChart, Line
} from 'recharts';
import { DownloadCloud, BarChart3, TrendingUp, DollarSign } from 'lucide-react';

export const Reports: React.FC = () => {
  const [trips, setTrips] = useState<TripDoc[]>([]);
  const [expenses, setExpenses] = useState<ExpenseDoc[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLogDoc[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLogDoc[]>([]);
  
  const [timeRange, setTimeRange] = useState<'3m' | '6m' | '12m'>('6m');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const unsub1 = subscribeToCollection<TripDoc>('trips', setTrips);
    const unsub2 = subscribeToCollection<ExpenseDoc>('expenses', setExpenses);
    const unsub3 = subscribeToCollection<FuelLogDoc>('fuelLogs', setFuelLogs);
    const unsub4 = subscribeToCollection<MaintenanceLogDoc>('maintenanceLogs', setMaintenanceLogs);
    return () => { unsub1(); unsub2(); unsub3(); unsub4(); };
  }, []);

  // Aggregation
  const completedTrips = trips.filter(t => t.status === 'completed');
  const approvedExpenses = expenses.filter(e => e.status === 'approved');
  const completedMaintenance = maintenanceLogs.filter(m => m.status === 'completed');

  const tripDistances = bucketByMonth(completedTrips, 'arrivalTime', 'estimatedDistanceKm');
  const expenseAmounts = bucketByMonth(approvedExpenses, 'date', 'amount');
  const fuelCosts = bucketByMonth(fuelLogs, 'date', 'totalCost');
  const maintenanceCosts = bucketByMonth(completedMaintenance, 'completionDate', 'cost');

  // Merge buckets for unified chart
  const monthsSet = new Set([...tripDistances, ...expenseAmounts, ...fuelCosts, ...maintenanceCosts].map(b => b.month));
  // Sort months chronologically (rough sort assuming 'Mon YY' format)
  const sortedMonths = Array.from(monthsSet).sort((a, b) => {
    const [mA, yA] = a.split(' ');
    const [mB, yB] = b.split(' ');
    return new Date(`${mA} 1, 20${yA}`).getTime() - new Date(`${mB} 1, 20${yB}`).getTime();
  });

  const chartData = sortedMonths.map(month => {
    const distance = tripDistances.find(d => d.month === month)?.value || 0;
    const expense = expenseAmounts.find(d => d.month === month)?.value || 0;
    const fuel = fuelCosts.find(d => d.month === month)?.value || 0;
    const maint = maintenanceCosts.find(d => d.month === month)?.value || 0;
    return {
      month,
      distance,
      totalCost: expense + fuel + maint,
      expense,
      fuel,
      maint
    };
  });

  // Take the last N months based on timeRange
  const monthsCount = timeRange === '3m' ? 3 : timeRange === '6m' ? 6 : 12;
  const filteredChartData = chartData.slice(-monthsCount);

  // Totals for the selected range
  const rangeTotalCost = filteredChartData.reduce((s, d) => s + d.totalCost, 0);
  const rangeDistance = filteredChartData.reduce((s, d) => s + d.distance, 0);
  const costPerKm = rangeDistance > 0 ? rangeTotalCost / rangeDistance : 0;

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const rows = filteredChartData.map(d => [
        d.month,
        formatNumber(d.distance),
        formatCurrency(d.fuel),
        formatCurrency(d.maint),
        formatCurrency(d.expense),
        formatCurrency(d.totalCost),
        formatCurrency(d.distance > 0 ? d.totalCost / d.distance : 0)
      ]);
      await exportToPDF(
        'Operational Analytics Report',
        ['Month', 'Distance (km)', 'Fuel Cost', 'Maintenance', 'Expenses', 'Total Cost', 'Cost/km'],
        rows,
        'transitops-analytics'
      );
    } catch (err) {
      alert('Failed to generate PDF. Make sure jspdf is installed.');
    } finally {
      setIsExporting(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl text-xs">
          <p className="font-bold text-slate-200 mb-2 border-b border-slate-700 pb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex justify-between gap-4 py-0.5">
              <span style={{ color: entry.color }}>{entry.name}:</span>
              <span className="font-mono font-semibold text-slate-300">
                {entry.name.includes('Distance') ? `${formatNumber(entry.value)} km` : formatCurrency(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white">Reports & Analytics</h2>
          <p className="text-slate-400 text-xs md:text-sm">Comprehensive financial overviews, cost-per-kilometer metrics, and utilization trends.</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            options={[
              { value: '3m', label: 'Last 3 Months' },
              { value: '6m', label: 'Last 6 Months' },
              { value: '12m', label: 'Last 12 Months' },
            ]}
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
          />
          <Button variant="primary" onClick={handleExportPDF} isLoading={isExporting} leftIcon={<DownloadCloud size={16} />}>
            Export PDF
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glassmorphism p-4 rounded-xl border border-rose-500/20 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
            <DollarSign size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Operational Cost</p>
            <p className="text-xl font-bold text-white mt-0.5">{formatCurrency(rangeTotalCost)}</p>
          </div>
        </div>
        <div className="glassmorphism p-4 rounded-xl border border-cyan-500/20 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
            <TrendingUp size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Distance Travelled</p>
            <p className="text-xl font-bold text-white mt-0.5">{formatNumber(rangeDistance)} km</p>
          </div>
        </div>
        <div className="glassmorphism p-4 rounded-xl border border-emerald-500/20 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <BarChart3 size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Fleet Cost Efficiency</p>
            <p className="text-xl font-bold text-white mt-0.5">{formatCurrency(costPerKm)} <span className="text-sm font-normal text-slate-400">/ km</span></p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Breakdown Bar Chart */}
        <div className="glassmorphism rounded-xl border border-slate-800/80 p-5 flex flex-col gap-4">
          <div>
            <h3 className="font-semibold text-white">Monthly Cost Breakdown</h3>
            <p className="text-xs text-slate-400">Distribution of expenses across fuel, maintenance, and other costs.</p>
          </div>
          <div className="h-72 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                <Bar dataKey="fuel" name="Fuel Costs" stackId="a" fill="#0ea5e9" radius={[0, 0, 4, 4]} />
                <Bar dataKey="maint" name="Maintenance" stackId="a" fill="#f59e0b" />
                <Bar dataKey="expense" name="Other Expenses" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distance Trend Line Chart */}
        <div className="glassmorphism rounded-xl border border-slate-800/80 p-5 flex flex-col gap-4">
          <div>
            <h3 className="font-semibold text-white">Distance vs Total Cost Trend</h3>
            <p className="text-xs text-slate-400">Tracking kilometers driven against overall operational spending.</p>
          </div>
          <div className="h-72 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}km`} />
                <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                <Line yAxisId="left" type="monotone" dataKey="distance" name="Distance (km)" stroke="#c084fc" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line yAxisId="right" type="monotone" dataKey="totalCost" name="Total Cost" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Tabular Data Preview */}
      <div className="glassmorphism rounded-xl border border-slate-800/80 overflow-hidden">
        <div className="p-4 border-b border-slate-800/80">
          <h3 className="font-semibold text-white text-sm">Monthly Aggregates Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/30 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="py-3 px-5">Month</th>
                <th className="py-3 px-5 text-right">Distance (km)</th>
                <th className="py-3 px-5 text-right">Fuel Cost</th>
                <th className="py-3 px-5 text-right">Maintenance</th>
                <th className="py-3 px-5 text-right">Other Expenses</th>
                <th className="py-3 px-5 text-right">Total Cost</th>
                <th className="py-3 px-5 text-right">Cost / km</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/60 text-xs">
              {filteredChartData.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-slate-500">No data available for the selected period.</td></tr>
              ) : (
                filteredChartData.map((d, i) => (
                  <tr key={i} className="hover:bg-slate-900/20 transition-colors">
                    <td className="py-3 px-5 font-semibold text-slate-300">{d.month}</td>
                    <td className="py-3 px-5 text-right text-cyan-400 font-mono">{formatNumber(d.distance)}</td>
                    <td className="py-3 px-5 text-right text-slate-400">{formatCurrency(d.fuel)}</td>
                    <td className="py-3 px-5 text-right text-slate-400">{formatCurrency(d.maint)}</td>
                    <td className="py-3 px-5 text-right text-slate-400">{formatCurrency(d.expense)}</td>
                    <td className="py-3 px-5 text-right font-bold text-rose-400">{formatCurrency(d.totalCost)}</td>
                    <td className="py-3 px-5 text-right text-emerald-400 font-mono">{formatCurrency(d.distance > 0 ? d.totalCost / d.distance : 0)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
