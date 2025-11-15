import { Trip } from "../contexts/TripContext";
import { Platform, Alert } from "react-native";
import * as Notifications from "expo-notifications";

type TripLike = {
  id: string;
  name?: string | null;
  startDate?: string | null;
  notificationIds?: string[] | null;
};
export type TripAlert = {
  tripId: string;
  tripName: string;
  startDateISO: string;
  daysUntil: number;
  kind: "day" | "week";
};

const MS_DAY = 24 * 60 * 60 * 1000;
const SEC_DAY = 24 * 60 * 60;
const NOTIFICATION_GRANTED = "granted";

function daysUntil(dateISO?: string | null, now = new Date()) {
  if (!dateISO) return Number.POSITIVE_INFINITY;
  let start = new Date(dateISO);
  start.setDate(start.getDate() + 1);
  const diff = Math.floor((start.getTime() - now.getTime()) / MS_DAY);
  return diff;
}

export function getTripAlertForTrip(
  trip: TripLike,
  now = new Date()
): TripAlert | null {
  const d = daysUntil(trip.startDate, now);
  if (!trip.startDate || d === Number.POSITIVE_INFINITY) return null;

  if (d === 0 || d === 1) {
    return {
      tripId: trip.id,
      tripName: trip.name || "Upcoming trip",
      startDateISO: trip.startDate!,
      daysUntil: d,
      kind: "day",
    };
  }

  if (d > 1 && d <= 7) {
    return {
      tripId: trip.id,
      tripName: trip.name || "Upcoming trip",
      startDateISO: trip.startDate!,
      daysUntil: d,
      kind: "week",
    };
  }

  return null;
}

export function getTripAlerts(
  trips: TripLike[],
  now = new Date()
): TripAlert[] {
  const alerts: TripAlert[] = [];

  for (const t of trips) {
    const alert = getTripAlertForTrip(t, now);
    if (alert) alerts.push(alert);
  }

  // Sort: day alerts (today/tomorrow) first, then week alerts
  alerts.sort((a, b) =>
    a.kind === b.kind ? a.daysUntil - b.daysUntil : a.kind === "day" ? -1 : 1
  );

  return alerts;
}

//local notifications
export async function initTripNotificationChannel() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("trip-reminders", {
      name: "Trip reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

async function ensureNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== NOTIFICATION_GRANTED) {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus == NOTIFICATION_GRANTED;
}

// Computes a human–friendly title/body from the alert
function buildNotificationContent(
  alert: TripAlert
): Notifications.NotificationContentInput {
  let title: string;
  let body: string;

  if (alert.kind === "day") {
    if (alert.daysUntil === 0) {
      title = "Your trip starts today 🎒";
      body = `${alert.tripName} starts today. Have a great journey!`;
    } else {
      title = "Your trip is tomorrow ✈️";
      body = `${alert.tripName} starts tomorrow. Time to pack!`;
    }
  } else {
    title = "Trip coming up this week 🌍";
    body = `${alert.tripName} starts in ${alert.daysUntil} days.`;
  }

  return {
    title,
    body,
    data: {
      tripId: alert.tripId,
      startDateISO: alert.startDateISO,
      daysUntil: alert.daysUntil,
      kind: alert.kind,
    },
  };
}

// Cancel only this trip's notifications
export async function cancelTripNotifications(
  notificationIds?: string[] | null
) {
  if (!notificationIds || notificationIds.length === 0) return;
  await Promise.all(
    notificationIds.map((id) =>
      Notifications.cancelScheduledNotificationAsync(id)
    )
  );
}

// Returns the new notificationIds to store in Firestore
export async function rescheduleTripNotificationsForTrip(
  trip: TripLike,
  now = new Date()
): Promise<string[]> {
  const hasPermission = await ensureNotificationPermissions();
  if (!hasPermission) {
    Alert.alert(
      "Notifications Disabled",
      "Please enable notification permissions in Settings to receive trip alerts."
    );
    return trip.notificationIds ?? [];
  }

  // cancel all existing notifications for this trip
  await cancelTripNotifications(trip.notificationIds);

  // sanity: if no startDate, nothing to schedule
  if (!trip.startDate) {
    return [];
  }

  const d = daysUntil(trip.startDate, now);

  // We only schedule when trip is within the next 7 days and not in the past
  if (d < 0 || d > 7) {
    return [];
  }

  const alertBase = getTripAlertForTrip(trip, now);
  if (!alertBase) {
    return [];
  }

  const newIds: string[] = [];

  // Immediate notification when update happens (within a week)
  {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: buildNotificationContent({
        ...alertBase,
      }),
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 1, // fire almost immediately
        channelId: Platform.OS === "android" ? "trip-reminders" : undefined,
      },
    });
    newIds.push(identifier);
  }

  // 3 days before start (if there is still time before that moment)
  if (d >= 3) {
    const secondsUntilThreeDaysBefore = (d - 3) * SEC_DAY;

    const identifier = await Notifications.scheduleNotificationAsync({
      content: buildNotificationContent({
        ...alertBase,
        daysUntil: 3,
        kind: "week",
      }),
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsUntilThreeDaysBefore,
        channelId: Platform.OS === "android" ? "trip-reminders" : undefined,
      },
    });

    newIds.push(identifier);
  }

  // 1 day before start (if there is still at least 1 day to go)
  if (d >= 1) {
    const secondsUntilOneDayBefore = (d - 1) * SEC_DAY;

    const identifier = await Notifications.scheduleNotificationAsync({
      content: buildNotificationContent({
        ...alertBase,
        daysUntil: 1,
        kind: "day", // tomorrow
      }),
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsUntilOneDayBefore,
        channelId: Platform.OS === "android" ? "trip-reminders" : undefined,
      },
    });

    newIds.push(identifier);
  }

  return newIds;
}
