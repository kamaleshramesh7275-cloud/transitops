import { db, isFirebaseConfigured } from './firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import type { QueryConstraint } from 'firebase/firestore';

// Helper to check and convert dates
export function formatDateField(dateField: any): Date {
  if (!dateField) return new Date();
  if (typeof dateField.toDate === 'function') {
    return dateField.toDate();
  }
  if (dateField instanceof Date) {
    return dateField;
  }
  if (dateField.seconds !== undefined) {
    return new Date(dateField.seconds * 1000);
  }
  return new Date(dateField);
}

// Observer registry for Mock real-time updates
type SubCallback = (data: any[]) => void;
const subscribers = new Map<string, Set<SubCallback>>();

function notifySubscribers(collectionName: string) {
  const collectionSubs = subscribers.get(collectionName);
  if (collectionSubs) {
    const items = getMockCollection(collectionName);
    collectionSubs.forEach(callback => callback(items));
  }
}

// Local Storage Mock Helpers
const MOCK_STORAGE_PREFIX = 'transitops_mock_';

function getMockCollection(collectionName: string): any[] {
  const data = localStorage.getItem(MOCK_STORAGE_PREFIX + collectionName);
  return data ? JSON.parse(data) : [];
}

function setMockCollection(collectionName: string, data: any[]) {
  localStorage.setItem(MOCK_STORAGE_PREFIX + collectionName, JSON.stringify(data));
  notifySubscribers(collectionName);
}

// Mock atomic transaction context
interface MockTransactionContext {
  getDoc: (collectionName: string, docId: string) => any | null;
  addDoc: (collectionName: string, data: any) => string;
  updateDoc: (collectionName: string, docId: string, data: any) => void;
}

export async function getMockTransaction<T>(
  fn: (mockDb: MockTransactionContext) => Promise<T>
): Promise<T> {
  // Capture state snapshots before running (for rollback on error)
  const snapshots = new Map<string, any[]>();
  const changes: Array<{ type: 'add' | 'update'; collection: string; id?: string; data: any }> = [];

  const mockDb: MockTransactionContext = {
    getDoc: (collectionName, docId) => {
      if (!snapshots.has(collectionName)) {
        snapshots.set(collectionName, JSON.parse(JSON.stringify(getMockCollection(collectionName))));
      }
      const snap = snapshots.get(collectionName)!;
      return snap.find((item: any) => item.id === docId || item.uid === docId) || null;
    },
    addDoc: (collectionName, data) => {
      if (!snapshots.has(collectionName)) {
        snapshots.set(collectionName, JSON.parse(JSON.stringify(getMockCollection(collectionName))));
      }
      const newId = `${collectionName.slice(0, 4)}_${Math.random().toString(36).substr(2, 9)}`;
      const newRecord = { id: newId, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      snapshots.get(collectionName)!.push(newRecord);
      changes.push({ type: 'add', collection: collectionName, id: newId, data: newRecord });
      return newId;
    },
    updateDoc: (collectionName, docId, data) => {
      if (!snapshots.has(collectionName)) {
        snapshots.set(collectionName, JSON.parse(JSON.stringify(getMockCollection(collectionName))));
      }
      const snap = snapshots.get(collectionName)!;
      const docKey = collectionName === 'users' ? 'uid' : 'id';
      const idx = snap.findIndex((item: any) => item[docKey] === docId);
      if (idx >= 0) {
        snap[idx] = { ...snap[idx], ...data, updatedAt: new Date().toISOString() };
      }
      changes.push({ type: 'update', collection: collectionName, id: docId, data });
    }
  };

  try {
    const result = await fn(mockDb);
    // Commit all changes
    for (const [collectionName, data] of snapshots.entries()) {
      setMockCollection(collectionName, data);
    }
    return result;
  } catch (error) {
    // Transaction failed, do not commit (snapshots discarded)
    throw error;
  }
}

// Prepopulate data if not initialized
export function initializeMockData() {
  if (localStorage.getItem(MOCK_STORAGE_PREFIX + 'initialized_v3')) {
    return;
  }

  console.log('Pre-populating mock data in localStorage...');

  // Mock Users
  const mockUsers = [
    {
      uid: 'user_admin',
      email: 'admin@transitops.com',
      fullName: 'Chief Operations Officer (Admin)',
      role: 'admin',
      phoneNumber: '+91 98765 43210',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      uid: 'user_manager',
      email: 'manager@transitops.com',
      fullName: 'Fleet Operations Manager',
      role: 'manager',
      phoneNumber: '+91 87654 32109',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      uid: 'user_operator',
      email: 'operator@transitops.com',
      fullName: 'Lead Dispatcher / Operator',
      role: 'operator',
      phoneNumber: '+91 76543 21098',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      uid: 'user_driver',
      email: 'driver@transitops.com',
      fullName: 'Karthik Subramanian (Driver)',
      role: 'driver',
      phoneNumber: '+91 65432 10987',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ];

  // Mock Drivers (10 South Indian Drivers)
  const mockDrivers = [
    { id: 'driver_1', fullName: 'Karthik Subramanian', email: 'karthik@transitops.com', phoneNumber: '+91 91234 56780', licenseNumber: 'DL-TN01-1234', licenseClass: 'Heavy Transport', licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), status: 'available', assignedVehicleId: 'veh_1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'driver_2', fullName: 'Ramesh Krishnan', email: 'ramesh@transitops.com', phoneNumber: '+91 92345 67891', licenseNumber: 'DL-TN02-2345', licenseClass: 'Light Transport', licenseExpiry: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), status: 'on_trip', assignedVehicleId: 'veh_2', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'driver_3', fullName: 'Suresh Natarajan', email: 'suresh@transitops.com', phoneNumber: '+91 93456 78912', licenseNumber: 'DL-TN03-3456', licenseClass: 'Heavy Transport', licenseExpiry: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), status: 'suspended', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'driver_4', fullName: 'Venkatesh Rao', email: 'venkatesh@transitops.com', phoneNumber: '+91 94567 89123', licenseNumber: 'DL-KA04-4567', licenseClass: 'Heavy Transport', licenseExpiry: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000).toISOString(), status: 'available', assignedVehicleId: 'veh_4', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'driver_5', fullName: 'Lakshmi Narayanan', email: 'lakshmi@transitops.com', phoneNumber: '+91 95678 91234', licenseNumber: 'DL-KA05-5678', licenseClass: 'Light Transport', licenseExpiry: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000).toISOString(), status: 'on_trip', assignedVehicleId: 'veh_5', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'driver_6', fullName: 'Ananya Reddy', email: 'ananya@transitops.com', phoneNumber: '+91 96789 12345', licenseNumber: 'DL-AP09-6789', licenseClass: 'Heavy Transport', licenseExpiry: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(), status: 'available', assignedVehicleId: 'veh_6', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'driver_7', fullName: 'Arjun Naidu', email: 'arjun@transitops.com', phoneNumber: '+91 97891 23456', licenseNumber: 'DL-AP10-7890', licenseClass: 'Heavy Transport', licenseExpiry: new Date(Date.now() + 80 * 24 * 60 * 60 * 1000).toISOString(), status: 'on_trip', assignedVehicleId: 'veh_7', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'driver_8', fullName: 'Krishna Menon', email: 'krishna@transitops.com', phoneNumber: '+91 98912 34567', licenseNumber: 'DL-KL01-8901', licenseClass: 'Light Transport', licenseExpiry: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), status: 'available', assignedVehicleId: 'veh_8', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'driver_9', fullName: 'Balaji Srinivasan', email: 'balaji@transitops.com', phoneNumber: '+91 99123 45678', licenseNumber: 'DL-KL02-9012', licenseClass: 'Heavy Transport', licenseExpiry: new Date(Date.now() + 400 * 24 * 60 * 60 * 1000).toISOString(), status: 'on_trip', assignedVehicleId: 'veh_9', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'driver_10', fullName: 'Srinivas Iyer', email: 'srinivas@transitops.com', phoneNumber: '+91 90123 45678', licenseNumber: 'DL-TN07-0123', licenseClass: 'Heavy Transport', licenseExpiry: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000).toISOString(), status: 'available', assignedVehicleId: 'veh_10', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  ];

  // Mock Vehicles (10 Vehicles)
  const mockVehicles = [
    { id: 'veh_1', plateNumber: 'TN-01-AB-1234', make: 'Tata', model: 'Signa 4923', year: 2022, type: 'truck', cargoCapacityKg: 49000, fuelType: 'diesel', acquisitionCost: 3433205, documents: [], status: 'available', currentMileage: 45000, insuranceExpiry: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'veh_2', plateNumber: 'TN-02-CD-2345', make: 'Ashok Leyland', model: 'Dost+', year: 2021, type: 'van', cargoCapacityKg: 1500, fuelType: 'diesel', acquisitionCost: 1891562, documents: [], status: 'on_trip', currentMileage: 85000, insuranceExpiry: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'veh_3', plateNumber: 'KA-04-EF-3456', make: 'Mahindra', model: 'Blazo X', year: 2020, type: 'truck', cargoCapacityKg: 28000, fuelType: 'diesel', acquisitionCost: 3123115, documents: [], status: 'maintenance', currentMileage: 120000, insuranceExpiry: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'veh_4', plateNumber: 'KA-05-GH-4567', make: 'Tata', model: 'Ace Gold', year: 2023, type: 'van', cargoCapacityKg: 750, fuelType: 'cng', acquisitionCost: 3414413, documents: [], status: 'available', currentMileage: 15000, insuranceExpiry: new Date(Date.now() + 240 * 24 * 60 * 60 * 1000).toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'veh_5', plateNumber: 'AP-09-IJ-5678', make: 'BharatBenz', model: '2823C', year: 2021, type: 'truck', cargoCapacityKg: 28000, fuelType: 'diesel', acquisitionCost: 1747788, documents: [], status: 'on_trip', currentMileage: 95000, insuranceExpiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'veh_6', plateNumber: 'AP-10-KL-6789', make: 'Maruti Suzuki', model: 'Super Carry', year: 2022, type: 'van', cargoCapacityKg: 740, fuelType: 'cng', acquisitionCost: 1542695, documents: [], status: 'available', currentMileage: 32000, insuranceExpiry: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'veh_7', plateNumber: 'KL-01-MN-7890', make: 'Eicher', model: 'Pro 3015', year: 2020, type: 'truck', cargoCapacityKg: 15000, fuelType: 'diesel', acquisitionCost: 3749647, documents: [], status: 'on_trip', currentMileage: 145000, insuranceExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'veh_8', plateNumber: 'KL-02-OP-8901', make: 'Tata', model: 'Yodha Pickup', year: 2023, type: 'van', cargoCapacityKg: 1700, fuelType: 'diesel', acquisitionCost: 1865520, documents: [], status: 'available', currentMileage: 12000, insuranceExpiry: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000).toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'veh_9', plateNumber: 'TN-07-QR-9012', make: 'Ashok Leyland', model: 'Bada Dost', year: 2021, type: 'van', cargoCapacityKg: 1860, fuelType: 'diesel', acquisitionCost: 1835974, documents: [], status: 'on_trip', currentMileage: 78000, insuranceExpiry: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'veh_10', plateNumber: 'KA-01-ST-0123', make: 'Tata', model: 'Prima 5530', year: 2022, type: 'truck', cargoCapacityKg: 55000, fuelType: 'diesel', acquisitionCost: 2456223, documents: [], status: 'available', currentMileage: 62000, insuranceExpiry: new Date(Date.now() + 210 * 24 * 60 * 60 * 1000).toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  ];

  // Mock Trips (10 Trips)
  const mockTrips = [
    { id: 'trip_1', tripNumber: 'TRIP-CH-BLR-01', vehicleId: 'veh_2', driverId: 'driver_2', status: 'on_trip', origin: 'Chennai Port', destination: 'Electronic City, Bangalore', cargoDescription: 'Electronics Components', cargoWeightKg: 1200, departureTime: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), estimatedDistanceKm: 350, notes: 'Fragile items', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'trip_2', tripNumber: 'TRIP-HYD-VJY-02', vehicleId: 'veh_5', driverId: 'driver_5', status: 'on_trip', origin: 'Jubilee Hills, Hyderabad', destination: 'Auto Nagar, Vijayawada', cargoDescription: 'Pharmaceuticals', cargoWeightKg: 18000, departureTime: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), estimatedDistanceKm: 275, notes: 'Temperature controlled', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'trip_3', tripNumber: 'TRIP-KOC-CBE-03', vehicleId: 'veh_7', driverId: 'driver_7', status: 'on_trip', origin: 'Kochi Harbour', destination: 'Peelamedu, Coimbatore', cargoDescription: 'Textiles', cargoWeightKg: 8000, departureTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), estimatedDistanceKm: 190, notes: 'Standard delivery', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'trip_4', tripNumber: 'TRIP-MDU-SLM-04', vehicleId: 'veh_9', driverId: 'driver_9', status: 'on_trip', origin: 'Mattuthavani, Madurai', destination: 'Steel Plant, Salem', cargoDescription: 'Auto Spares', cargoWeightKg: 1500, departureTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), estimatedDistanceKm: 230, notes: 'Express delivery', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'trip_5', tripNumber: 'TRIP-BLR-MYS-05', vehicleId: 'veh_1', driverId: 'driver_1', status: 'scheduled', origin: 'Peenya, Bangalore', destination: 'Metagalli, Mysore', cargoDescription: 'Industrial Machinery', cargoWeightKg: 25000, estimatedDistanceKm: 150, notes: 'Heavy load, night transit preferred', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'trip_6', tripNumber: 'TRIP-TVM-KOC-06', vehicleId: 'veh_8', driverId: 'driver_8', status: 'scheduled', origin: 'Technopark, Trivandrum', destination: 'Kakkanad, Kochi', cargoDescription: 'IT Equipment', cargoWeightKg: 800, estimatedDistanceKm: 210, notes: 'Handle with care', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'trip_7', tripNumber: 'TRIP-CH-MDU-07', vehicleId: 'veh_10', driverId: 'driver_10', status: 'scheduled', origin: 'Guindy, Chennai', destination: 'Tirumangalam, Madurai', cargoDescription: 'FMCG Goods', cargoWeightKg: 35000, estimatedDistanceKm: 460, notes: 'Standard goods', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'trip_8', tripNumber: 'TRIP-VJY-HYD-08', vehicleId: 'veh_4', driverId: 'driver_4', status: 'completed', origin: 'Bhavanipuram, Vijayawada', destination: 'Secunderabad, Hyderabad', cargoDescription: 'Groceries', cargoWeightKg: 650, departureTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), arrivalTime: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(), estimatedDistanceKm: 280, actualDistanceKm: 285, fuelConsumedLiters: 20, revenue: 20001, notes: 'Completed on time', createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), updatedAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString() },
    { id: 'trip_9', tripNumber: 'TRIP-SLM-CH-09', vehicleId: 'veh_6', driverId: 'driver_6', status: 'completed', origin: 'Meyyanur, Salem', destination: 'Tambaram, Chennai', cargoDescription: 'Agricultural Produce', cargoWeightKg: 700, departureTime: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), arrivalTime: new Date(Date.now() - 41 * 60 * 60 * 1000).toISOString(), estimatedDistanceKm: 340, actualDistanceKm: 342, fuelConsumedLiters: 25, revenue: 23831, notes: 'Delivered safely', createdAt: new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString(), updatedAt: new Date(Date.now() - 41 * 60 * 60 * 1000).toISOString() },
    { id: 'trip_10', tripNumber: 'TRIP-MYS-BLR-10', vehicleId: 'veh_3', driverId: 'driver_3', status: 'completed', origin: 'Hebbal, Mysore', destination: 'Whitefield, Bangalore', cargoDescription: 'Silk Garments', cargoWeightKg: 2000, departureTime: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(), arrivalTime: new Date(Date.now() - 69 * 60 * 60 * 1000).toISOString(), estimatedDistanceKm: 160, actualDistanceKm: 165, fuelConsumedLiters: 15, revenue: 10334, notes: 'No issues', createdAt: new Date(Date.now() - 75 * 60 * 60 * 1000).toISOString(), updatedAt: new Date(Date.now() - 69 * 60 * 60 * 1000).toISOString() }
  ];

  // Mock Maintenance Logs
  const mockMaintenance = [
    { id: 'maint_1', vehicleId: 'veh_3', type: 'repair', description: 'Engine Overhaul and Clutch Plate Replacement', status: 'in_progress', cost: 45000.00, scheduledDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), startDate: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), odometerReading: 120000, performedBy: 'Mahindra Authorized Service Center, Bangalore', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), updatedAt: new Date().toISOString() },
    { id: 'maint_2', vehicleId: 'veh_1', type: 'routine', description: 'General Service and Oil Change', status: 'scheduled', cost: 12000.00, scheduledDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), odometerReading: 45000, performedBy: 'Tata Motors Workshop, Chennai', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'maint_3', vehicleId: 'veh_5', type: 'inspection', description: 'Brake Inspection and Tyre Rotation', status: 'completed', cost: 8500.00, scheduledDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), completionDate: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(), odometerReading: 94000, performedBy: 'BharatBenz Hub, Hyderabad', createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), updatedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString() }
  ];

  // Mock Fuel Logs
  const mockFuel = [
    { id: 'fuel_1', vehicleId: 'veh_2', driverId: 'driver_2', tripId: 'trip_1', date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), liters: 40, costPerLiter: 92.50, totalCost: 3700.00, odometerReading: 85000, fuelStation: 'IndianOil, Kanchipuram Highway', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'fuel_2', vehicleId: 'veh_5', driverId: 'driver_5', tripId: 'trip_2', date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), liters: 150, costPerLiter: 94.20, totalCost: 14130.00, odometerReading: 95000, fuelStation: 'Bharat Petroleum, Suryapet', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'fuel_3', vehicleId: 'veh_4', driverId: 'driver_4', tripId: 'trip_8', date: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(), liters: 12, costPerLiter: 85.00, totalCost: 1020.00, odometerReading: 15000, fuelStation: 'HP CNG Station, Vijayawada', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'fuel_4', vehicleId: 'veh_6', driverId: 'driver_6', tripId: 'trip_9', date: new Date(Date.now() - 46 * 60 * 60 * 1000).toISOString(), liters: 15, costPerLiter: 85.00, totalCost: 1275.00, odometerReading: 32000, fuelStation: 'HP CNG Station, Salem Bypass', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'fuel_5', vehicleId: 'veh_3', driverId: 'driver_3', tripId: 'trip_10', date: new Date(Date.now() - 71 * 60 * 60 * 1000).toISOString(), liters: 35, costPerLiter: 93.00, totalCost: 3255.00, odometerReading: 119500, fuelStation: 'Reliance Petrol Pump, Mandya', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  ];

  // Mock Expenses
  const mockExpenses = [
    { id: 'exp_1', category: 'fuel', amount: 3700.00, date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), vehicleId: 'veh_2', driverId: 'driver_2', description: 'Diesel refill for Chennai-BLR trip', status: 'approved', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'exp_2', category: 'toll', amount: 850.00, date: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), vehicleId: 'veh_2', driverId: 'driver_2', tripId: 'trip_1', description: 'Sriperumbudur Toll Plaza', status: 'pending', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'exp_3', category: 'maintenance', amount: 45000.00, date: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), vehicleId: 'veh_3', description: 'Advance payment for Engine Overhaul', status: 'approved', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'exp_4', category: 'toll', amount: 1200.00, date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), vehicleId: 'veh_5', driverId: 'driver_5', tripId: 'trip_2', description: 'Pantangi Toll Plaza (HYD-VJY Highway)', status: 'approved', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'exp_5', category: 'other', amount: 450.00, date: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(), vehicleId: 'veh_4', driverId: 'driver_4', tripId: 'trip_8', description: 'Parking fee at Secunderabad Hub', status: 'pending', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  ];

  // Set all items
  setMockCollection('users', mockUsers);
  setMockCollection('drivers', mockDrivers);
  setMockCollection('vehicles', mockVehicles);
  setMockCollection('trips', mockTrips);
  setMockCollection('maintenanceLogs', mockMaintenance);
  setMockCollection('fuelLogs', mockFuel);
  setMockCollection('expenses', mockExpenses);

  localStorage.setItem(MOCK_STORAGE_PREFIX + 'initialized_v3', 'true');
  console.log('Mock database initialized successfully with South Indian demo data.');
}

// Standard Firestore or Mock Database Access Operations
export async function getCollectionDocs<T>(collectionName: string): Promise<T[]> {
  if (isFirebaseConfigured && db) {
    const snap = await getDocs(collection(db, collectionName));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as T);
  } else {
    return getMockCollection(collectionName) as T[];
  }
}

export async function getDocById<T>(collectionName: string, docId: string): Promise<T | null> {
  if (isFirebaseConfigured && db) {
    const docRef = doc(db, collectionName, docId);
    const snap = await getDoc(docRef);
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as T) : null;
  } else {
    const collectionDocs = getMockCollection(collectionName);
    const found = collectionDocs.find(item => item.id === docId || item.uid === docId);
    return found ? (found as T) : null;
  }
}

export async function setDocData(collectionName: string, docId: string, data: any): Promise<void> {
  if (isFirebaseConfigured && db) {
    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
  } else {
    const collectionDocs = getMockCollection(collectionName);
    const index = collectionDocs.findIndex(item => item.id === docId || item.uid === docId);

    const docKey = collectionName === 'users' ? 'uid' : 'id';
    const updatedRecord = {
      [docKey]: docId,
      ...data,
      updatedAt: new Date().toISOString()
    };

    if (index >= 0) {
      collectionDocs[index] = { ...collectionDocs[index], ...updatedRecord };
    } else {
      updatedRecord.createdAt = new Date().toISOString();
      collectionDocs.push(updatedRecord);
    }
    setMockCollection(collectionName, collectionDocs);
  }
}

export async function addDocToCollection(collectionName: string, data: any): Promise<string> {
  if (isFirebaseConfigured && db) {
    const colRef = collection(db, collectionName);
    const ref = await addDoc(colRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return ref.id;
  } else {
    const collectionDocs = getMockCollection(collectionName);
    const newId = `${collectionName.slice(0, 4)}_${Math.random().toString(36).substr(2, 9)}`;

    const newRecord = {
      id: newId,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    collectionDocs.push(newRecord);
    setMockCollection(collectionName, collectionDocs);
    return newId;
  }
}

export async function updateDocData(collectionName: string, docId: string, data: any): Promise<void> {
  if (isFirebaseConfigured && db) {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
  } else {
    const collectionDocs = getMockCollection(collectionName);
    const docKey = collectionName === 'users' ? 'uid' : 'id';
    const index = collectionDocs.findIndex(item => item[docKey] === docId);

    if (index >= 0) {
      collectionDocs[index] = {
        ...collectionDocs[index],
        ...data,
        updatedAt: new Date().toISOString()
      };
      setMockCollection(collectionName, collectionDocs);
    } else {
      throw new Error(`Document with ID ${docId} not found in collection ${collectionName}`);
    }
  }
}

export async function deleteDocFromCollection(collectionName: string, docId: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } else {
    const collectionDocs = getMockCollection(collectionName);
    const docKey = collectionName === 'users' ? 'uid' : 'id';
    const filtered = collectionDocs.filter(item => item[docKey] !== docId);
    setMockCollection(collectionName, filtered);
  }
}

// Real-time listener registration
export function subscribeToCollection<T>(
  collectionName: string,
  callback: (items: T[]) => void,
  filters?: { field: string; operator: '==' | '>=' | '<=' | 'array-contains'; value: any }[]
): () => void {
  if (isFirebaseConfigured && db) {
    let q = query(collection(db, collectionName));
    if (filters) {
      const constraints: QueryConstraint[] = filters.map(f => where(f.field, f.operator, f.value));
      q = query(collection(db, collectionName), ...constraints);
    }

    return onSnapshot(q, (snap) => {
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as T);
      callback(docs);
    });
  } else {
    // Initial call
    let items = getMockCollection(collectionName);
    if (filters) {
      items = items.filter(item => {
        return filters.every(f => {
          const val = item[f.field];
          if (f.operator === '==') return val === f.value;
          if (f.operator === '>=') return val >= f.value;
          if (f.operator === '<=') return val <= f.value;
          if (f.operator === 'array-contains') return Array.isArray(val) && val.includes(f.value);
          return true;
        });
      });
    }
    callback(items as T[]);

    // Subscribe to updates
    if (!subscribers.has(collectionName)) {
      subscribers.set(collectionName, new Set());
    }

    const set = subscribers.get(collectionName)!;
    const filterCallback = (allData: any[]) => {
      let filteredData = allData;
      if (filters) {
        filteredData = allData.filter(item => {
          return filters.every(f => {
            const val = item[f.field];
            if (f.operator === '==') return val === f.value;
            if (f.operator === '>=') return val >= f.value;
            if (f.operator === '<=') return val <= f.value;
            if (f.operator === 'array-contains') return Array.isArray(val) && val.includes(f.value);
            return true;
          });
        });
      }
      callback(filteredData as T[]);
    };

    set.add(filterCallback);

    // Return unsubscriber function
    return () => {
      set.delete(filterCallback);
      if (set.size === 0) {
        subscribers.delete(collectionName);
      }
    };
  }
}
