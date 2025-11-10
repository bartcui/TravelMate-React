import React, { createContext, useContext, useMemo, useState } from "react";
import { Alert } from "react-native";

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
};

export type Trip = {
  id: string;
  name: string;
  summary?: string;
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
  addTrip: (input: Omit<Trip, "id" | "steps">) => string; // returns new id
  updateTrip: (id: string, patch: Partial<Omit<Trip, "id" | "steps">>) => void;
  addStep: (tripId: string, step: Omit<TripStep, "id" | "tripId">) => string;
  removeTrip: (id: string) => void;
  getTripById: (id: string) => Trip | undefined;
  updateStep: (tripId: string, stepId: string, patch: Partial<Omit<TripStep, "id" | "tripId">>) => void;
  removeStep: (tripId: string, stepId: string) => void;
  // convenience selectors
  pastTrips: Trip[];
  currentTrips: Trip[];
  futureTrips: Trip[];
};

const TripContext = createContext<TripContextValue | undefined>(undefined);

// quick id helper
const uid = () => Math.random().toString(36).slice(2, 10);

// ---- Provider ----
export const TripProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [trips, setTrips] = useState<Trip[]>([]); // start empty; seed later if you want

  const addTrip: TripContextValue["addTrip"] = (input) => {
    const id = uid();
    const next: Trip = { id, steps: [], ...input };
    setTrips((prev) => [next, ...prev]);
    return id;
  };

  const updateTrip: TripContextValue["updateTrip"] = (id, patch) => {
    setTrips((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch } : t))
    );
  };

  const addStep: TripContextValue["addStep"] = (tripId, step) => {
    const stepId = uid();
    setTrips((prev) =>
      prev.map((t) =>
        t.id === tripId ? { ...t, steps: [{ id: stepId, tripId, ...step }, ...t.steps] } : t
      )
    );
    return stepId;
  };

  const removeTrip: TripContextValue["removeTrip"] = (id) => {
    setTrips((prev) => prev.filter((t) => t.id !== id));
  };

  const getTripById = (id: string) => trips.find((t) => t.id === id);

  const pastTrips   = useMemo(() => trips.filter((t) => getTripStatus(t) === "past"), [trips]);
  const currentTrips= useMemo(() => trips.filter((t) => getTripStatus(t) === "current"), [trips]);
  const futureTrips = useMemo(() => trips.filter((t) => getTripStatus(t) === "future"), [trips]);
  const updateStep: TripContextValue["updateStep"] = (tripId, stepId, patch) => {
    setTrips(prev =>
      prev.map(t => {
        if (t.id !== tripId) return t;
        return {
          ...t,
          steps: t.steps.map(s => (s.id === stepId ? { ...s, ...patch } : s)),
        };
      })
    );
  };

  const removeStep: TripContextValue["removeStep"] = (tripId, stepId) => {
    setTrips(prev =>
      prev.map(t => {
        if (t.id !== tripId) return t;
        return { ...t, steps: t.steps.filter(s => s.id !== stepId) };
      })
    );
  };

  const value: TripContextValue = {
    trips,
    addTrip,
    updateTrip,
    addStep,
    removeTrip,
    getTripById,
    pastTrips,
    currentTrips,
    futureTrips,
    updateStep,
    removeStep,
  };

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
};

// ---- Hook ----
export const useTrips = () => {
  const ctx = useContext(TripContext);
  if (!ctx) {
    Alert.alert("TripContext not found", "Wrap your app in <TripProvider>.");
    throw new Error("useTrips must be used within TripProvider");
  }
  return ctx;
};
