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

// Prepopulate data if not initialized
export function initializeMockData() {
  if (localStorage.getItem(MOCK_STORAGE_PREFIX + 'initialized')) {
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
      phoneNumber: '+1 (555) 019-2831',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      uid: 'user_manager',
      email: 'manager@transitops.com',
      fullName: 'Fleet Operations Manager',
      role: 'manager',
      phoneNumber: '+1 (555) 014-9988',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      uid: 'user_operator',
      email: 'operator@transitops.com',
      fullName: 'Lead Dispatcher / Operator',
      role: 'operator',
      phoneNumber: '+1 (555) 012-3456',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      uid: 'user_driver',
      email: 'driver@transitops.com',
      fullName: 'John Doe (Driver)',
      role: 'driver',
      phoneNumber: '+1 (555) 019-8765',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ];

  // Mock Drivers
  const mockDrivers = [
    {
      id: 'driver_john',
      fullName: 'John Doe',
      email: 'driver@transitops.com',
      phoneNumber: '+1 (555) 019-8765',
      licenseNumber: 'DL-98765432-A',
      licenseClass: 'Class A CDL',
      licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year out
      status: 'available',
      assignedVehicleId: 'veh_semi_1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'driver_jane',
      fullName: 'Jane Smith',
      email: 'jane.smith@transitops.com',
      phoneNumber: '+1 (555) 015-4321',
      licenseNumber: 'DL-43210987-B',
      licenseClass: 'Class B CDL',
      licenseExpiry: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // Expires in 15 days (Alert trigger)
      status: 'available',
      assignedVehicleId: 'veh_van_1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'driver_bob',
      fullName: 'Bob Johnson',
      email: 'bob.johnson@transitops.com',
      phoneNumber: '+1 (555) 011-2233',
      licenseNumber: 'DL-11223344-A',
      licenseClass: 'Class A CDL',
      licenseExpiry: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // Expired
      status: 'suspended',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'driver_sarah',
      fullName: 'Sarah Jenkins',
      email: 'sarah.jenkins@transitops.com',
      phoneNumber: '+1 (555) 017-8899',
      licenseNumber: 'DL-88991122-A',
      licenseClass: 'Class A CDL',
      licenseExpiry: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'on_trip',
      assignedVehicleId: 'veh_flatbed_1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ];

  // Mock Vehicles
  const mockVehicles = [
    {
      id: 'veh_semi_1',
      plateNumber: 'TX-987-CDL',
      make: 'Volvo',
      model: 'FH16 Semi',
      year: 2022,
      type: 'truck',
      cargoCapacityKg: 22000,
      fuelType: 'diesel',
      status: 'available',
      currentMileage: 124500,
      insuranceExpiry: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'veh_van_1',
      plateNumber: 'CA-102-VAN',
      make: 'Ford',
      model: 'Transit 350',
      year: 2021,
      type: 'van',
      cargoCapacityKg: 18000,
      fuelType: 'gasoline',
      status: 'available',
      currentMileage: 48900,
      insuranceExpiry: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'veh_flatbed_1',
      plateNumber: 'FL-445-FLT',
      make: 'Scania',
      model: 'R500 Flatbed',
      year: 2020,
      type: 'truck',
      cargoCapacityKg: 18000,
      fuelType: 'diesel',
      status: 'on_trip',
      currentMileage: 215300,
      insuranceExpiry: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // Expired
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'veh_ev_1',
      plateNumber: 'NY-303-RIV',
      make: 'Rivian',
      model: 'EDV 700',
      year: 2023,
      type: 'van',
      cargoCapacityKg: 1200,
      fuelType: 'electric',
      status: 'maintenance',
      currentMileage: 14200,
      insuranceExpiry: new Date(Date.now() + 240 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ];

  // Mock Trips
  const mockTrips = [
    {
      id: 'trip_1001',
      tripNumber: 'TRIP-1001',
      vehicleId: 'veh_flatbed_1',
      driverId: 'driver_sarah',
      status: 'on_trip',
      origin: 'Dallas, TX Logistical Hub',
      destination: 'Austin, TX Distribution Center',
      cargoDescription: 'Industrial CNC Metal Machinery',
      cargoWeightKg: 12500,
      departureTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      estimatedDistanceKm: 320,
      notes: 'Fragile cargo, maintain steady speed.',
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'trip_1002',
      tripNumber: 'TRIP-1002',
      vehicleId: 'veh_semi_1',
      driverId: 'driver_john',
      status: 'scheduled',
      origin: 'Houston Port Terminal 3',
      destination: 'El Paso Warehouse 4',
      cargoDescription: 'Bulk Consumer Electronics',
      cargoWeightKg: 16800,
      estimatedDistanceKm: 1100,
      notes: 'Scheduled for morning departure.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'trip_1000',
      tripNumber: 'TRIP-1000',
      vehicleId: 'veh_van_1',
      driverId: 'driver_jane',
      status: 'completed',
      origin: 'Los Angeles Depot',
      destination: 'Santa Monica Hub',
      cargoDescription: 'Medical Supplies & Equipment',
      cargoWeightKg: 650,
      departureTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      arrivalTime: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
      estimatedDistanceKm: 26,
      actualDistanceKm: 28,
      fuelConsumedLiters: 4.5,
      notes: 'Completed ahead of schedule.',
      createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
    }
  ];

  // Mock Maintenance Logs
  const mockMaintenance = [
    {
      id: 'maint_1',
      vehicleId: 'veh_ev_1',
      type: 'routine',
      description: 'Scheduled EV battery health check and motor diagnostics',
      status: 'in_progress',
      cost: 350.00,
      scheduledDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      startDate: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      odometerReading: 14180,
      performedBy: 'EcoCharge Specialized Motors',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'maint_2',
      vehicleId: 'veh_semi_1',
      type: 'inspection',
      description: 'Annual Department of Transportation safety certification',
      status: 'completed',
      cost: 180.00,
      scheduledDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      completionDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      odometerReading: 121000,
      performedBy: 'TX Truck Safety Authority',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    }
  ];

  // Mock Fuel Logs
  const mockFuel = [
    {
      id: 'fuel_1',
      vehicleId: 'veh_semi_1',
      driverId: 'driver_john',
      tripId: 'trip_1000',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      liters: 120,
      costPerLiter: 1.45,
      totalCost: 174.00,
      odometerReading: 124100,
      fuelStation: 'Love\'s Travel Stops #482',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ];

  // Mock Expenses
  const mockExpenses = [
    {
      id: 'exp_1',
      category: 'fuel',
      amount: 174.00,
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      vehicleId: 'veh_semi_1',
      driverId: 'driver_john',
      description: 'Diesel refueling 120L at Loves Station',
      status: 'approved',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'exp_2',
      category: 'toll',
      amount: 45.00,
      date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      vehicleId: 'veh_flatbed_1',
      driverId: 'driver_sarah',
      tripId: 'trip_1001',
      description: 'I-35 Texas Highway Toll Way bill',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'exp_3',
      category: 'maintenance',
      amount: 350.00,
      date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      vehicleId: 'veh_ev_1',
      description: 'Specialized Rivian diagnostic session payment',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ];

  // Set all items
  setMockCollection('users', mockUsers);
  setMockCollection('drivers', mockDrivers);
  setMockCollection('vehicles', mockVehicles);
  setMockCollection('trips', mockTrips);
  setMockCollection('maintenanceLogs', mockMaintenance);
  setMockCollection('fuelLogs', mockFuel);
  setMockCollection('expenses', mockExpenses);

  localStorage.setItem(MOCK_STORAGE_PREFIX + 'initialized', 'true');
  console.log('Mock database initialized successfully.');
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
