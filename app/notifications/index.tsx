import React, { useMemo } from "react";
import { View, Text, Pressable, FlatList, StyleSheet } from "react-native";
import { useTrips } from "../../contexts/TripContext";
import { getTripAlerts, TripAlert } from "../../utils/notifications";
import { useRouter } from "expo-router";
import { useColorScheme } from "react-native";
import { getTheme } from "../../styles/colors";
import { makeGlobalStyles } from "../../styles/globalStyles";

function niceWhen(a: TripAlert) {
  if (a.daysUntil === 0) return "starts today";
  if (a.daysUntil === 1) return "starts tomorrow";
  return `starts in ${a.daysUntil} days`;
}

export default function NotificationsScreen() {
  const { trips } = useTrips();
  const router = useRouter();

  const scheme = useColorScheme();
  const t = getTheme(scheme);
  const gs = makeGlobalStyles(t);

  const alerts = useMemo(() => getTripAlerts(trips), [trips]);

  return (
    <View style={gs.screen}>
      <Text style={gs.h1}>Notifications</Text>

      {alerts.length === 0 ? (
        <Text style={gs.label}>No upcoming trips in the next 7 days.</Text>
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(a) => `${a.tripId}:${a.startDateISO}`}
          contentContainerStyle={{ gap: 10, paddingVertical: 8 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/trips/${item.tripId}`)}
              style={[styles.card, { borderColor: t.border, backgroundColor: t.surface }]}
            >
              <Text style={[styles.title, { color: t.text }]}>{item.tripName}</Text>
              <Text style={[styles.subtitle, { color: t.textMuted }]}>
                {niceWhen(item)} ({new Date(item.startDateISO).toDateString()})
              </Text>
              <Text style={[styles.badge, item.kind === "day" ? { backgroundColor: "#ff6b6b" } : { backgroundColor: "#f4a261" }]}>
                {item.kind === "day" ? (item.daysUntil === 0 ? "Today" : "Tomorrow") : "This week"}
              </Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12, borderRadius: 10, borderWidth: 1, position: "relative" },
  title: { fontWeight: "700", fontSize: 16, marginBottom: 4 },
  subtitle: { fontSize: 13 },
  badge: {
    position: "absolute",
    right: 10,
    top: 10,
    color: "white",
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: "hidden",
    fontSize: 12,
  },
});