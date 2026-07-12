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
  if (localStorage.getItem(MOCK_STORAGE_PREFIX + 'initialized_v6')) {
    return;
  }

  console.log('Pre-populating mock data in localStorage with South Indian demo generator...');

  // Mock Users
  const mockUsers = [
    {
      uid: 'user_fleet',
      email: 'fleet@transitops.in',
      fullName: 'Fleet Manager',
      role: 'fleet_manager',
      phoneNumber: '+91 98765 43210',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      uid: 'user_dispatch',
      email: 'dispatch@transitops.in',
      fullName: 'Lead Dispatcher',
      role: 'dispatcher',
      phoneNumber: '+91 87654 32109',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      uid: 'user_safety',
      email: 'safety@transitops.in',
      fullName: 'Safety Officer',
      role: 'safety_officer',
      phoneNumber: '+91 76543 21098',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      uid: 'user_finance',
      email: 'finance@transitops.in',
      fullName: 'Financial Analyst',
      role: 'financial_analyst',
      phoneNumber: '+91 65432 10987',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      uid: 'user_driver',
      email: 'driver@transitops.in',
      fullName: 'Karthik Subramanian',
      role: 'driver',
      phoneNumber: '+91 54321 09876',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ];

  // Pools for Data Generation
  const firstNames = ['Karthik', 'Ramesh', 'Suresh', 'Venkatesh', 'Lakshmi', 'Arjun', 'Krishna', 'Balaji', 'Srinivas', 'Anand', 'Murugan', 'Vijay', 'Prakash', 'Rajesh', 'Ganesh', 'Hari', 'Ashok', 'Murali', 'Gopal', 'Madhavan', 'Surya', 'Dhanush', 'Vikram'];
  const lastNames = ['Subramanian', 'Krishnan', 'Natarajan', 'Rao', 'Narayanan', 'Reddy', 'Naidu', 'Menon', 'Srinivasan', 'Iyer', 'Pillai', 'Nair', 'Chettiar', 'Gounder', 'Kumar', 'Rajan'];
  const cities = ['Chennai', 'Bangalore', 'Hyderabad', 'Kochi', 'Madurai', 'Coimbatore', 'Vijayawada', 'Trivandrum', 'Salem', 'Mysore', 'Visakhapatnam', 'Tiruchirappalli', 'Mangalore', 'Hubli', 'Warangal', 'Guntur'];
  const makes = ['Tata', 'Ashok Leyland', 'Mahindra', 'BharatBenz', 'Eicher', 'Maruti Suzuki', 'Volvo'];
  const models = ['Signa', 'Dost+', 'Blazo X', 'Ace Gold', '2823C', 'Super Carry', 'Pro 3015', 'Yodha', 'Bada Dost', 'Prima', 'FH16'];
  const statusesDriver = ['available', 'on_trip', 'on_leave', 'suspended'];
  const statusesVehicle = ['available', 'on_trip', 'maintenance', 'out_of_service'];
  const cargoTypes = ['Electronics', 'Pharmaceuticals', 'Textiles', 'Auto Spares', 'Machinery', 'FMCG Goods', 'Groceries', 'Agricultural Produce', 'Furniture', 'Building Materials'];
  const maintenanceTypes = ['routine', 'repair', 'inspection'];

  // Generators
  const randomElement = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
  const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  const randomDateStr = (daysOffsetMin: number, daysOffsetMax: number) => new Date(Date.now() + randomInt(daysOffsetMin, daysOffsetMax) * 24 * 60 * 60 * 1000).toISOString();

  const mockDrivers = Array.from({ length: 25 }, (_, i) => {
    const fn = randomElement(firstNames);
    const ln = randomElement(lastNames);
    return {
      id: `driver_${i + 1}`,
      fullName: `${fn} ${ln}`,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}@transitops.com`,
      phoneNumber: `+91 ${randomInt(90000, 99999)} ${randomInt(10000, 99999)}`,
      licenseNumber: `DL-${randomElement(['TN', 'KA', 'AP', 'KL', 'TS'])}${randomInt(10, 99)}-${randomInt(1000, 9999)}`,
      licenseClass: randomElement(['Light Transport', 'Heavy Transport']),
      licenseExpiry: randomDateStr(10, 1000),
      status: randomElement(statusesDriver),
      assignedVehicleId: Math.random() > 0.3 ? `veh_${randomInt(1, 20)}` : undefined,
      createdAt: randomDateStr(-300, -10),
      updatedAt: randomDateStr(-10, 0),
    };
  });

  const mockVehicles = Array.from({ length: 25 }, (_, i) => {
    const make = randomElement(makes);
    return {
      id: `veh_${i + 1}`,
      plateNumber: `${randomElement(['TN', 'KA', 'AP', 'KL', 'TS'])}-${randomInt(10, 99)}-${randomElement(['A', 'B', 'C', 'D'])}${randomElement(['A', 'B', 'C', 'D'])}-${randomInt(1000, 9999)}`,
      make,
      model: randomElement(models),
      year: randomInt(2018, 2024),
      type: randomElement(['truck', 'van']),
      cargoCapacityKg: randomInt(700, 50000),
      fuelType: randomElement(['diesel', 'cng', 'electric']),
      acquisitionCost: randomInt(1000000, 5000000),
      documents: [],
      status: randomElement(statusesVehicle),
      currentMileage: randomInt(5000, 200000),
      insuranceExpiry: randomDateStr(10, 365),
      createdAt: randomDateStr(-500, -50),
      updatedAt: randomDateStr(-10, 0),
    };
  });

  const mockTrips = Array.from({ length: 40 }, (_, i) => {
    const status = randomElement(['scheduled', 'on_trip', 'completed', 'cancelled']);
    const origin = randomElement(cities);
    let destination = randomElement(cities);
    while (origin === destination) { destination = randomElement(cities); }
    
    const isCompleted = status === 'completed';
    const departure = randomDateStr(-20, -1);
    
    return {
      id: `trip_${i + 1}`,
      tripNumber: `TRIP-${origin.substring(0,3).toUpperCase()}-${destination.substring(0,3).toUpperCase()}-${String(i+1).padStart(3, '0')}`,
      vehicleId: `veh_${randomInt(1, 25)}`,
      driverId: `driver_${randomInt(1, 25)}`,
      status,
      origin: `${origin} Hub`,
      destination: `${destination} Center`,
      cargoDescription: randomElement(cargoTypes),
      cargoWeightKg: randomInt(500, 25000),
      estimatedDistanceKm: randomInt(50, 800),
      departureTime: status !== 'scheduled' ? departure : undefined,
      arrivalTime: isCompleted ? randomDateStr(-1, 0) : undefined,
      actualDistanceKm: isCompleted ? randomInt(50, 800) : undefined,
      fuelConsumedLiters: isCompleted ? randomInt(10, 150) : undefined,
      revenue: isCompleted ? randomInt(5000, 50000) : undefined,
      notes: 'Generated trip data',
      createdAt: randomDateStr(-30, -20),
      updatedAt: new Date().toISOString(),
    };
  });

  const mockMaintenance = Array.from({ length: 30 }, (_, i) => {
    const status = randomElement(['scheduled', 'in_progress', 'completed']);
    return {
      id: `maint_${i + 1}`,
      vehicleId: `veh_${randomInt(1, 25)}`,
      type: randomElement(maintenanceTypes),
      description: `Routine maintenance and checks - ${randomElement(['Oil', 'Tyres', 'Engine', 'Brakes'])}`,
      status,
      cost: randomInt(2000, 50000),
      scheduledDate: randomDateStr(-10, 30),
      startDate: status !== 'scheduled' ? randomDateStr(-10, 0) : undefined,
      completionDate: status === 'completed' ? randomDateStr(-5, 0) : undefined,
      odometerReading: randomInt(10000, 150000),
      performedBy: 'Authorized Service Center',
      createdAt: randomDateStr(-40, -10),
      updatedAt: new Date().toISOString(),
    };
  });

  const mockFuel = Array.from({ length: 40 }, (_, i) => {
    const liters = randomInt(10, 200);
    const costPerLiter = randomElement([85.00, 92.50, 94.00, 96.20]);
    return {
      id: `fuel_${i + 1}`,
      vehicleId: `veh_${randomInt(1, 25)}`,
      driverId: `driver_${randomInt(1, 25)}`,
      tripId: `trip_${randomInt(1, 40)}`,
      date: randomDateStr(-30, 0),
      liters,
      costPerLiter,
      totalCost: liters * costPerLiter,
      odometerReading: randomInt(10000, 150000),
      fuelStation: `${randomElement(['IndianOil', 'Bharat Petroleum', 'Shell', 'HP', 'Nayara'])} Station, ${randomElement(cities)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  const mockExpenses = Array.from({ length: 40 }, (_, i) => {
    const category = randomElement(['toll', 'fuel', 'maintenance', 'fine', 'other']);
    return {
      id: `exp_${i + 1}`,
      category,
      amount: randomInt(100, 15000),
      date: randomDateStr(-30, 0),
      vehicleId: `veh_${randomInt(1, 25)}`,
      driverId: `driver_${randomInt(1, 25)}`,
      tripId: `trip_${randomInt(1, 40)}`,
      description: `Generated expense for ${category} at ${randomElement(cities)}`,
      status: randomElement(['pending', 'approved', 'rejected']),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  // Set all items
  setMockCollection('users', mockUsers);
  setMockCollection('drivers', mockDrivers);
  setMockCollection('vehicles', mockVehicles);
  setMockCollection('trips', mockTrips);
  setMockCollection('maintenanceLogs', mockMaintenance);
  setMockCollection('fuelLogs', mockFuel);
  setMockCollection('expenses', mockExpenses);

  localStorage.setItem(MOCK_STORAGE_PREFIX + 'initialized_v6', 'true');
  console.log('Mock database initialized successfully with extended South Indian demo generator.');
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
