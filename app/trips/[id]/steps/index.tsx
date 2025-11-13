import React from "react";
import { View, Text, FlatList, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTrips } from "@/contexts/TripContext";

export default function StepsIndex() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getTripById } = useTrips();
  const router = useRouter();

  const trip = getTripById(id!);
  if (!trip) return <Text style={{ padding: 16 }}>Trip not found.</Text>;

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontWeight: "800", fontSize: 18, marginBottom: 12 }}>
        Steps for {trip.name}
      </Text>
      <FlatList
        data={trip.steps}
        keyExtractor={(s) => s.id}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/trips/${trip.id}/steps/${item.id}/edit`)}>
            <Text style={{ fontWeight: "700" }}>{item.title || "Untitled"}</Text>
          </Pressable>
        )}
        ListEmptyComponent={<Text>No steps yet.</Text>}
      />
    </View>
  );
}
