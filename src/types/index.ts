export interface FirebaseTimestamp {
  seconds: number;
  nanoseconds: number;
  toDate: () => Date;
}

export type AppDate = Date | FirebaseTimestamp;

export interface UserDoc {
  uid: string;
  email: string;
  fullName: string;
  role: 'admin' | 'manager' | 'operator' | 'driver';
  phoneNumber?: string;
  status: 'active' | 'suspended';
  createdAt: AppDate;
  updatedAt: AppDate;
}

export interface VehicleDoc {
  id: string;
  plateNumber: string; // Unique index
  make: string;
  model: string;
  year: number;
  type: 'truck' | 'van' | 'car' | 'trailer';
  cargoCapacityKg: number;
  fuelType: 'diesel' | 'gasoline' | 'electric' | 'hybrid';
  status: 'available' | 'on_trip' | 'maintenance' | 'retired';
  currentMileage: number;
  insuranceExpiry: AppDate;
  createdAt: AppDate;
  updatedAt: AppDate;
}

export interface DriverDoc {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  licenseNumber: string;
  licenseClass: string;
  licenseExpiry: AppDate;
  status: 'available' | 'on_trip' | 'suspended' | 'off_duty';
  assignedVehicleId?: string; // Optional default vehicle assignment
  createdAt: AppDate;
  updatedAt: AppDate;
}

export interface TripDoc {
  id: string;
  tripNumber: string;
  vehicleId: string;
  driverId: string;
  status: 'scheduled' | 'on_trip' | 'completed' | 'cancelled';
  origin: string;
  destination: string;
  cargoDescription: string;
  cargoWeightKg: number;
  departureTime?: AppDate;
  arrivalTime?: AppDate;
  estimatedDistanceKm: number;
  actualDistanceKm?: number;
  fuelConsumedLiters?: number;
  notes?: string;
  createdAt: AppDate;
  updatedAt: AppDate;
}

export interface MaintenanceLogDoc {
  id: string;
  vehicleId: string;
  type: 'routine' | 'repair' | 'inspection' | 'breakdown';
  description: string;
  status: 'scheduled' | 'in_progress' | 'completed';
  cost: number;
  scheduledDate: AppDate;
  startDate?: AppDate;
  completionDate?: AppDate;
  odometerReading: number;
  performedBy: string;
  createdAt: AppDate;
  updatedAt: AppDate;
}

export interface FuelLogDoc {
  id: string;
  vehicleId: string;
  driverId: string;
  tripId?: string;
  date: AppDate;
  liters: number;
  costPerLiter: number;
  totalCost: number;
  odometerReading: number;
  fuelStation: string;
  createdAt: AppDate;
  updatedAt: AppDate;
}

export interface ExpenseDoc {
  id: string;
  category: 'fuel' | 'maintenance' | 'toll' | 'driver_allowance' | 'insurance' | 'permit' | 'other';
  amount: number;
  date: AppDate;
  vehicleId?: string;
  driverId?: string;
  tripId?: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  invoiceUrl?: string;
  createdAt: AppDate;
  updatedAt: AppDate;
}
