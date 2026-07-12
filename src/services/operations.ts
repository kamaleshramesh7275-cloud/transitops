import { db, isFirebaseConfigured } from './firebase';
import { doc, runTransaction, collection, serverTimestamp } from 'firebase/firestore';
import { getMockTransaction } from './db';

// ──────────────────────────────────────────────
// Atomic: Dispatch a New Trip
// Validates vehicle & driver availability + cargo weight before committing.
// ──────────────────────────────────────────────
export async function dispatchTrip(tripData: {
  origin: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoDescription: string;
  cargoWeightKg: number;
  estimatedDistanceKm: number;
  notes?: string;
}): Promise<string> {
  if (isFirebaseConfigured && db) {
    return runTransaction(db, async (transaction) => {
      const vehicleRef = doc(db!, 'vehicles', tripData.vehicleId);
      const driverRef = doc(db!, 'drivers', tripData.driverId);
      const tripRef = doc(collection(db!, 'trips'));

      const vehicleSnap = await transaction.get(vehicleRef);
      const driverSnap = await transaction.get(driverRef);

      if (!vehicleSnap.exists() || vehicleSnap.data().status !== 'available') {
        throw new Error('Vehicle is no longer available for dispatch.');
      }
      if (!driverSnap.exists() || driverSnap.data().status !== 'available') {
        throw new Error('Driver is no longer available for dispatch.');
      }
      if (tripData.cargoWeightKg > vehicleSnap.data().cargoCapacityKg) {
        throw new Error(`Cargo weight (${tripData.cargoWeightKg}kg) exceeds vehicle capacity (${vehicleSnap.data().cargoCapacityKg}kg).`);
      }

      const tripNumber = `TRIP-${Date.now().toString().slice(-6)}`;

      transaction.set(tripRef, {
        ...tripData,
        tripNumber,
        status: 'on_trip',
        departureTime: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      transaction.update(vehicleRef, { status: 'on_trip', updatedAt: serverTimestamp() });
      transaction.update(driverRef, { status: 'on_trip', updatedAt: serverTimestamp() });

      return tripRef.id;
    });
  } else {
    // Mock atomic transaction using helper
    return getMockTransaction(async (mockDb) => {
      const vehicle = mockDb.getDoc('vehicles', tripData.vehicleId);
      const driver = mockDb.getDoc('drivers', tripData.driverId);

      if (!vehicle || vehicle.status !== 'available') {
        throw new Error('Vehicle is no longer available for dispatch.');
      }
      if (!driver || driver.status !== 'available') {
        throw new Error('Driver is no longer available for dispatch.');
      }
      if (tripData.cargoWeightKg > vehicle.cargoCapacityKg) {
        throw new Error(`Cargo weight (${tripData.cargoWeightKg}kg) exceeds vehicle capacity (${vehicle.cargoCapacityKg}kg).`);
      }

      const tripNumber = `TRIP-${Date.now().toString().slice(-6)}`;
      const tripId = mockDb.addDoc('trips', {
        ...tripData,
        tripNumber,
        status: 'on_trip',
        departureTime: new Date().toISOString(),
      });

      mockDb.updateDoc('vehicles', tripData.vehicleId, { status: 'on_trip' });
      mockDb.updateDoc('drivers', tripData.driverId, { status: 'on_trip' });

      return tripId;
    });
  }
}

// ──────────────────────────────────────────────
// Atomic: Complete a Trip
// Sets trip to completed, frees vehicle & driver back to available.
// ──────────────────────────────────────────────
export async function completeTrip(tripId: string, completionData: {
  actualDistanceKm?: number;
  fuelConsumedLiters?: number;
  revenue?: number;
  notes?: string;
}): Promise<void> {
  if (isFirebaseConfigured && db) {
    return runTransaction(db, async (transaction) => {
      const tripRef = doc(db!, 'trips', tripId);
      const tripSnap = await transaction.get(tripRef);

      if (!tripSnap.exists()) throw new Error('Trip not found.');
      const tripDoc = tripSnap.data();
      if (tripDoc.status !== 'on_trip') throw new Error('Only active trips can be completed.');

      const vehicleRef = doc(db!, 'vehicles', tripDoc.vehicleId);
      const driverRef = doc(db!, 'drivers', tripDoc.driverId);

      transaction.update(tripRef, {
        status: 'completed',
        arrivalTime: serverTimestamp(),
        ...completionData,
        updatedAt: serverTimestamp(),
      });
      transaction.update(vehicleRef, { status: 'available', updatedAt: serverTimestamp() });
      transaction.update(driverRef, { status: 'available', updatedAt: serverTimestamp() });
    });
  } else {
    return getMockTransaction(async (mockDb) => {
      const trip = mockDb.getDoc('trips', tripId);
      if (!trip) throw new Error('Trip not found.');
      if (trip.status !== 'on_trip') throw new Error('Only active trips can be completed.');

      mockDb.updateDoc('trips', tripId, {
        status: 'completed',
        arrivalTime: new Date().toISOString(),
        ...completionData,
      });
      mockDb.updateDoc('vehicles', trip.vehicleId, { status: 'available' });
      mockDb.updateDoc('drivers', trip.driverId, { status: 'available' });
    });
  }
}

// ──────────────────────────────────────────────
// Atomic: Cancel a Trip
// ──────────────────────────────────────────────
export async function cancelTrip(tripId: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    return runTransaction(db, async (transaction) => {
      const tripRef = doc(db!, 'trips', tripId);
      const tripSnap = await transaction.get(tripRef);

      if (!tripSnap.exists()) throw new Error('Trip not found.');
      const tripDoc = tripSnap.data();

      if (!['scheduled', 'on_trip'].includes(tripDoc.status)) {
        throw new Error('Only scheduled or active trips can be cancelled.');
      }

      const vehicleRef = doc(db!, 'vehicles', tripDoc.vehicleId);
      const driverRef = doc(db!, 'drivers', tripDoc.driverId);

      transaction.update(tripRef, { status: 'cancelled', updatedAt: serverTimestamp() });
      transaction.update(vehicleRef, { status: 'available', updatedAt: serverTimestamp() });
      transaction.update(driverRef, { status: 'available', updatedAt: serverTimestamp() });
    });
  } else {
    return getMockTransaction(async (mockDb) => {
      const trip = mockDb.getDoc('trips', tripId);
      if (!trip) throw new Error('Trip not found.');
      if (!['scheduled', 'on_trip'].includes(trip.status)) {
        throw new Error('Only scheduled or active trips can be cancelled.');
      }
      mockDb.updateDoc('trips', tripId, { status: 'cancelled' });
      mockDb.updateDoc('vehicles', trip.vehicleId, { status: 'available' });
      mockDb.updateDoc('drivers', trip.driverId, { status: 'available' });
    });
  }
}

// ──────────────────────────────────────────────
// Atomic: Send Vehicle to Maintenance
// Locks vehicle from dispatch (sets status to 'maintenance').
// ──────────────────────────────────────────────
export async function sendVehicleToMaintenance(vehicleId: string, logData: {
  type: 'routine' | 'repair' | 'inspection' | 'breakdown';
  description: string;
  cost: number;
  scheduledDate: string;
  odometerReading: number;
  performedBy: string;
}): Promise<string> {
  if (isFirebaseConfigured && db) {
    return runTransaction(db, async (transaction) => {
      const vehicleRef = doc(db!, 'vehicles', vehicleId);
      const vehicleSnap = await transaction.get(vehicleRef);

      if (!vehicleSnap.exists()) throw new Error('Vehicle not found.');
      if (vehicleSnap.data().status === 'on_trip') {
        throw new Error('Cannot schedule maintenance for a vehicle currently on a trip.');
      }

      const logRef = doc(collection(db!, 'maintenanceLogs'));
      transaction.set(logRef, {
        vehicleId,
        ...logData,
        scheduledDate: new Date(logData.scheduledDate),
        status: 'in_progress',
        startDate: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      transaction.update(vehicleRef, { status: 'maintenance', updatedAt: serverTimestamp() });
      return logRef.id;
    });
  } else {
    return getMockTransaction(async (mockDb) => {
      const vehicle = mockDb.getDoc('vehicles', vehicleId);
      if (!vehicle) throw new Error('Vehicle not found.');
      if (vehicle.status === 'on_trip') {
        throw new Error('Cannot schedule maintenance for a vehicle currently on a trip.');
      }

      const logId = mockDb.addDoc('maintenanceLogs', {
        vehicleId,
        ...logData,
        scheduledDate: new Date(logData.scheduledDate).toISOString(),
        status: 'in_progress',
        startDate: new Date().toISOString(),
      });
      mockDb.updateDoc('vehicles', vehicleId, { status: 'maintenance' });
      return logId;
    });
  }
}

// ──────────────────────────────────────────────
// Atomic: Complete Maintenance
// Marks log completed and returns vehicle to 'available'.
// ──────────────────────────────────────────────
export async function completeMaintenance(logId: string, vehicleId: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    return runTransaction(db, async (transaction) => {
      const logRef = doc(db!, 'maintenanceLogs', logId);
      const vehicleRef = doc(db!, 'vehicles', vehicleId);

      transaction.update(logRef, {
        status: 'completed',
        completionDate: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      transaction.update(vehicleRef, { status: 'available', updatedAt: serverTimestamp() });
    });
  } else {
    return getMockTransaction(async (mockDb) => {
      mockDb.updateDoc('maintenanceLogs', logId, {
        status: 'completed',
        completionDate: new Date().toISOString(),
      });
      mockDb.updateDoc('vehicles', vehicleId, { status: 'available' });
    });
  }
}
