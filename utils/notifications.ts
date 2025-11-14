import { Trip } from "../contexts/TripContext";

export type TripAlert = {
  tripId: string;
  tripName: string;
  startDateISO: string;
  daysUntil: number; 
  kind: "day" | "week";
};

const MS_DAY = 24 * 60 * 60 * 1000;

function daysUntil(dateISO?: string | null, now = new Date()) {
  if (!dateISO) return Number.POSITIVE_INFINITY;
  const start = new Date(dateISO);
  const diff = Math.floor((start.getTime() - now.getTime()) / MS_DAY);
  return diff;
}

export function getTripAlerts(trips: Trip[], now = new Date()): TripAlert[] {
  const alerts: TripAlert[] = [];
  for (const t of trips) {
    const d = daysUntil(t.startDate, now);
    if (d === 0 || d === 1) {
      alerts.push({
        tripId: t.id,
        tripName: t.name || "Upcoming trip",
        startDateISO: t.startDate!,
        daysUntil: d,
        kind: "day",
      });
    } else if (d > 1 && d <= 7) {
      alerts.push({
        tripId: t.id,
        tripName: t.name || "Upcoming trip",
        startDateISO: t.startDate!,
        daysUntil: d,
        kind: "week",
      });
    }
  }
  alerts.sort((a, b) => (a.kind === b.kind ? a.daysUntil - b.daysUntil : a.kind === "day" ? -1 : 1));
  return alerts;
}