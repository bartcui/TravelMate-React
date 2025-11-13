import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  useEffect,
} from "react";
import { Alert } from "react-native";
import {
  collection,
  doc,
  getDocs,
  updateDoc,
  setDoc,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/firebaseConfig";

export type TripPrivacy = "private" | "friends" | "public";
export type TripStatus = "past" | "current" | "future";

export type TripStep = {
  id: string;
  tripId: string;
  title?: string;
  note?: string;
  photos?: string[];
  latitude?: number;
  longitude?: number;
  visitedAt?: string;
  lat?: number | null;
  lng?: number | null;
  endAt?: string | null;
};

export type Trip = {
  id: string;
  name: string;
  summary?: string | null;
  startDate?: string;
  endDate?: string | null;
  privacy: TripPrivacy;
  trackerEnabled: boolean;
  steps: TripStep[];
};

// helpers
const isoToDate = (iso?: string | null) => (iso ? new Date(iso) : undefined);

export function getTripStatus(t: Trip, now = new Date()): TripStatus {
  const start = isoToDate(t.startDate);
  const end = isoToDate(t.endDate ?? undefined);

  if (start && start > now) return "future";
  if (end && end < now) return "past";
  if (!start || start <= now) return "current";
  return "current";
}

// ---- Context shape ----
type TripContextValue = {
  trips: Trip[];
  loading: boolean;
  refreshTrips: () => Promise<void>;

  addTrip: (input: Omit<Trip, "id" | "steps">) => Promise<string>; // returns new id
  updateTrip: (
    id: string,
    patch: Partial<Omit<Trip, "id" | "steps">>
  ) => Promise<void>;
  removeTrip: (id: string) => Promise<void>;

  addStep: (
    tripId: string,
    step: Omit<TripStep, "id" | "tripId">
  ) => Promise<string>;
  getTripById: (id: string) => Trip | undefined;
  updateStep: (
    tripId: string,
    stepId: string,
    patch: Partial<Omit<TripStep, "id" | "tripId">>
  ) => Promise<void>;
  removeStep: (tripId: string, stepId: string) => Promise<void>;

  // convenience selectors
  pastTrips: Trip[];
  currentTrips: Trip[];
  futureTrips: Trip[];
};

const TripContext = createContext<TripContextValue | undefined>(undefined);

// ---- Provider ----
export const TripProvider: React.FC<{
  children: React.ReactNode;
  userId: string | null;
}> = ({ children, userId }) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);

  // Computed reference to this user's trips collection
  const tripsCollectionRef = useMemo(
    () => (userId ? collection(db, "users", userId, "trips") : null),
    [userId]
  );

  // Load all trips (and nested steps) for this user
  const refreshTrips = useCallback(async () => {
    if (!userId || !tripsCollectionRef) {
      setTrips([]);
      return;
    }

    setLoading(true);
    try {
      const tripSnapshot = await getDocs(tripsCollectionRef);

      const tripList: Trip[] = [];

      for (const tripDoc of tripSnapshot.docs) {
        const baseData = tripDoc.data() as Omit<Trip, "id" | "steps">;

        // Load steps as subcollection
        const stepsSnapshot = await getDocs(collection(tripDoc.ref, "steps"));

        const steps: TripStep[] = stepsSnapshot.docs.map((sd) => {
          const stepData = sd.data() as Omit<TripStep, "id" | "tripId">;
          return {
            id: sd.id,
            tripId: tripDoc.id,
            ...stepData,
          };
        });

        tripList.push({
          id: tripDoc.id,
          steps,
          ...baseData,
        });
      }

      setTrips(tripList);
    } catch (err: any) {
      console.error("Failed to load trips:", err);
      Alert.alert("Error", "Failed to load trips from the server.");
    } finally {
      setLoading(false);
    }
  }, [userId, tripsCollectionRef]);

  // Automatically load when userId changes
  useEffect(() => {
    void refreshTrips();
  }, [refreshTrips]);

  // Trip CRUD
  const addTrip: TripContextValue["addTrip"] = async (input) => {
    if (!userId || !tripsCollectionRef) {
      Alert.alert("Not signed in", "You must be logged in to create a trip.");
      throw new Error("No userId");
    }

    //generate auto-id
    const newTripRef = doc(collection(db, "users", userId, "trips"));
    const id = newTripRef.id;

    const trip: Trip = {
      id,
      steps: [],
      ...input,
    };

    try {
      const { steps, ...tripDocData } = trip;
      await setDoc(newTripRef, tripDocData);

      setTrips((prev) => [trip, ...prev]);
      return id;
    } catch (err: any) {
      console.error("Failed to add trip:", err);
      Alert.alert("Error", "Failed to create trip.");
      throw err;
    }
  };

  const updateTrip: TripContextValue["updateTrip"] = async (id, patch) => {
    if (!userId || !tripsCollectionRef) return;

    try {
      const tripRef = doc(tripsCollectionRef, id);
      await updateDoc(tripRef, patch as any);

      setTrips((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...patch } : t))
      );
    } catch (err: any) {
      console.error("Failed to update trip:", err);
      Alert.alert("Error", "Failed to update trip.");
      throw err;
    }
  };

  const removeTrip: TripContextValue["removeTrip"] = async (id) => {
    if (!userId || !tripsCollectionRef) return;

    try {
      const tripRef = doc(tripsCollectionRef, id);

      // Delete steps subcollection in a batch
      const stepsSnapshot = await getDocs(collection(tripRef, "steps"));
      const batch = writeBatch(db);

      stepsSnapshot.forEach((s) => batch.delete(s.ref));
      batch.delete(tripRef);

      await batch.commit();

      setTrips((prev) => prev.filter((t) => t.id !== id));
    } catch (err: any) {
      console.error("Failed to delete trip:", err);
      Alert.alert("Error", "Failed to delete trip.");
      throw err;
    }
  };

  // Step CRUD
  const addStep: TripContextValue["addStep"] = async (tripId, step) => {
    if (!userId || !tripsCollectionRef) {
      Alert.alert("Not signed in", "You must be logged in to add steps.");
      throw new Error("No userId");
    }

    //auto generate step id
    const tripRef = doc(tripsCollectionRef, tripId);

    const newStepref = doc(collection(tripRef, "steps"));
    const stepId = newStepref.id;

    const stepPayload: TripStep = {
      id: stepId,
      tripId,
      ...step,
    };

    try {
      await setDoc(newStepref, stepPayload);

      setTrips((prev) =>
        prev.map((t) =>
          t.id === tripId ? { ...t, steps: [stepPayload, ...t.steps] } : t
        )
      );
      return stepId;
    } catch (err: any) {
      console.error("Failed to add step:", err);
      Alert.alert("Error", "Failed to add trip step.");
      throw err;
    }
  };

  const updateStep: TripContextValue["updateStep"] = async (
    tripId,
    stepId,
    patch
  ) => {
    if (!userId || !tripsCollectionRef) return;

    try {
      const tripRef = doc(tripsCollectionRef, tripId);
      const stepRef = doc(collection(tripRef, "steps"), stepId);

      await updateDoc(stepRef, patch as any);

      setTrips((prev) =>
        prev.map((t) => {
          if (t.id !== tripId) return t;
          return {
            ...t,
            steps: t.steps.map((s) =>
              s.id === stepId ? { ...s, ...patch } : s
            ),
          };
        })
      );
    } catch (err: any) {
      console.error("Failed to update step:", err);
      Alert.alert("Error", "Failed to update trip step.");
      throw err;
    }
  };

  const removeStep: TripContextValue["removeStep"] = async (tripId, stepId) => {
    if (!userId || !tripsCollectionRef) return;

    try {
      const tripRef = doc(tripsCollectionRef, tripId);
      const stepRef = doc(collection(tripRef, "steps"), stepId);

      await deleteDoc(stepRef);

      setTrips((prev) =>
        prev.map((t) =>
          t.id === tripId
            ? { ...t, steps: t.steps.filter((s) => s.id !== stepId) }
            : t
        )
      );
    } catch (err: any) {
      console.error("Failed to delete step:", err);
      Alert.alert("Error", "Failed to delete trip step.");
      throw err;
    }
  };

  // getters and derived lists
  const getTripById = (id: string) => trips.find((t) => t.id === id);

  const pastTrips = useMemo(
    () => trips.filter((t) => getTripStatus(t) === "past"),
    [trips]
  );
  const currentTrips = useMemo(
    () => trips.filter((t) => getTripStatus(t) === "current"),
    [trips]
  );
  const futureTrips = useMemo(
    () => trips.filter((t) => getTripStatus(t) === "future"),
    [trips]
  );

  const value: TripContextValue = {
    trips,
    loading,
    refreshTrips,
    addTrip,
    updateTrip,
    removeTrip,
    addStep,
    updateStep,
    removeStep,
    getTripById,
    pastTrips,
    currentTrips,
    futureTrips,
  };

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
};

// ---- Hook ----
export const useTrips = () => {
  const ctx = useContext(TripContext);
  if (!ctx) {
    Alert.alert("TripContext not found", "Wrap app in <TripProvider>.");
    throw new Error("useTrips must be used within TripProvider");
  }
  return ctx;
};
