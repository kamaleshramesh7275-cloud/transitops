import { formatDate, capitalize } from './format';

// ──────────────────────────────────────────────
// CSV Export
// ──────────────────────────────────────────────
export function exportToCSV(data: Record<string, any>[], filename: string): void {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row =>
      headers.map(h => {
        const val = row[h] ?? '';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      }).join(',')
    )
  ];
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

// ──────────────────────────────────────────────
// PDF Export with jspdf + jspdf-autotable
// ──────────────────────────────────────────────
export async function exportToPDF(
  title: string,
  columns: string[],
  rows: (string | number)[][],
  filename: string
): Promise<void> {
  // Dynamic import to keep initial bundle size small
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  // Header band
  doc.setFillColor(15, 23, 42); // brand-dark
  doc.rect(0, 0, doc.internal.pageSize.width, 50, 'F');
  doc.setTextColor(248, 250, 252);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('TransitOps', 30, 32);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(title, 30, 46);
  doc.text(`Generated: ${formatDate(new Date())}`, doc.internal.pageSize.width - 30, 46, { align: 'right' });

  autoTable(doc, {
    startY: 60,
    head: [columns],
    body: rows.map(r => r.map(String)),
    styles: { fontSize: 8, cellPadding: 5, textColor: [30, 41, 59] },
    headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 30, right: 30 },
  });

  doc.save(`${filename}-${new Date().toISOString().split('T')[0]}.pdf`);
}

// ──────────────────────────────────────────────
// Expense Report Helpers
// ──────────────────────────────────────────────
export function prepareExpenseCSV(expenses: any[]): Record<string, any>[] {
  return expenses.map(e => ({
    'Date': formatDate(e.date),
    'Category': capitalize(e.category),
    'Description': e.description,
    'Amount ($)': e.amount.toFixed(2),
    'Status': capitalize(e.status),
  }));
}

export function prepareTripCSV(trips: any[], vehicles: any[], drivers: any[]): Record<string, any>[] {
  return trips.map(t => {
    const v = vehicles.find((v: any) => v.id === t.vehicleId);
    const d = drivers.find((d: any) => d.id === t.driverId);
    return {
      'Trip #': t.tripNumber,
      'Status': capitalize(t.status),
      'Origin': t.origin,
      'Destination': t.destination,
      'Cargo': t.cargoDescription,
      'Weight (kg)': t.cargoWeightKg,
      'Distance (km)': t.estimatedDistanceKm,
      'Fuel (L)': t.fuelConsumedLiters ?? '—',
      'Vehicle': v ? `${v.plateNumber} ${v.make} ${v.model}` : t.vehicleId,
      'Driver': d ? d.fullName : t.driverId,
    };
  });
}

export function prepareFuelCSV(fuelLogs: any[], vehicles: any[], drivers: any[]): Record<string, any>[] {
  return fuelLogs.map(f => {
    const v = vehicles.find((v: any) => v.id === f.vehicleId);
    const d = drivers.find((d: any) => d.id === f.driverId);
    return {
      'Date': formatDate(f.date),
      'Vehicle': v ? `${v.plateNumber} ${v.make} ${v.model}` : f.vehicleId,
      'Driver': d ? d.fullName : f.driverId,
      'Liters': f.liters,
      'Cost/L ($)': f.costPerLiter.toFixed(3),
      'Total Cost ($)': f.totalCost.toFixed(2),
      'Odometer (km)': f.odometerReading.toLocaleString(),
      'Station': f.fuelStation,
    };
  });
}
