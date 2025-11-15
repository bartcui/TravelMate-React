import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Image,
  Modal,
} from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useTrips } from "@/contexts/TripContext";
import { useColorScheme } from "react-native";
import { getTheme } from "@/styles/colors";
import { makeGlobalStyles } from "@/styles/globalStyles";
import { useRouter } from "expo-router";
import { Alert } from "react-native";

export default function TripDetailsScreen() {
  const scheme = useColorScheme();
  const t = getTheme(scheme);
  const gs = makeGlobalStyles(t);

  const router = useRouter();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getTripById } = useTrips();

  //console.log("tripId", id);
  const trip = getTripById(id!);
  const steps = useMemo(() => trip?.steps ?? [], [trip]);

  useEffect(() => {
    navigation.setOptions({
      title: trip?.name,
    });
  }, [trip]);

  //console.log("trip: ", trip);
  if (!trip) return <Text style={{ padding: 16 }}>Trip not found.</Text>;

  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerPhoto, setViewerPhoto] = useState<string | null>(null);

  const openPhotoViewer = (url: string) => {
    setViewerPhoto(url);
    setViewerVisible(true);
  };

  const closePhotoViewer = () => {
    setViewerVisible(false);
    setViewerPhoto(null);
  };

  const renderStep = ({ item }: { item: any }) => {
    const start = item.visitedAt ? new Date(item.visitedAt) : null;
    const end = item.endAt ? new Date(item.endAt) : null;

    const photos: string[] = item.photos ?? [];

    const thumbPhotos = photos.slice(0, 4);
    const extraCount = photos.length - thumbPhotos.length;

    return (
      <Pressable
        onPress={() => router.push(`/trips/${trip.id}/steps/${item.id}/edit`)}
      >
        <View style={styles(t).stepCard}>
          <Text style={styles(t).stepTitle}>
            {item.title || "Untitled destination"}
          </Text>
          {(start || end) && (
            <Text style={styles(t).stepDate}>
              {start ? start.toDateString() : "—"}
              {end ? ` – ${end.toDateString()}` : ""}
            </Text>
          )}
          {!!item.note && <Text style={styles(t).stepNote}>{item.note}</Text>}

          {/* photos grid */}
          {thumbPhotos.length > 0 && (
            <View style={gs.photosGrid}>
              {thumbPhotos.map((url: string, index: number) => {
                const isLast = index === thumbPhotos.length - 1;
                return (
                  <Pressable
                    key={url}
                    style={gs.photoWrapper}
                    onPress={(e) => {
                      // prevent triggering card onPress
                      e.stopPropagation?.();
                      openPhotoViewer(url);
                    }}
                  >
                    <Image source={{ uri: url }} style={gs.photoThumb} />
                    {isLast && extraCount > 0 && (
                      <View style={gs.extraOverlay}>
                        <Text style={gs.extraText}>+{extraCount}</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  const Header = () => (
    <View>
      {/* Trip starts */}
      <View style={styles(t).markerRow}>
        <Text style={styles(t).icon}>🏠</Text>
        <Text style={styles(t).markerText}>
          Trip starts{" "}
          {trip.startDate ? new Date(trip.startDate).toDateString() : ""}
        </Text>
      </View>

      {/* Add step (left-aligned, text to the right) */}
      <Pressable
        onPress={() => router.push(`/trips/${trip.id}/add-step`)}
        style={styles(t).addInlineRow}
      >
        <View style={styles(t).addCircle}>
          <Text style={styles(t).addPlus}>＋</Text>
        </View>
        <Text style={styles(t).addInlineText}>
          {steps.length === 0
            ? "Start building your itinerary"
            : "Add destinations"}
        </Text>
      </Pressable>
    </View>
  );
  const { removeTrip } = useTrips();

  const Footer = () => (
    <View>
      <View style={[styles(t).markerRow, { marginTop: 12 }]}>
        <Text style={styles(t).icon}>🏁</Text>
        <Text style={styles(t).markerText}>
          Trip finishes{" "}
          {trip.endDate ? new Date(trip.endDate).toDateString() : ""}
        </Text>
      </View>

      {/* Edit / Delete buttons */}
      <Pressable
        style={gs.primaryButton}
        onPress={() => router.push(`/trips/${trip.id}/edit`)}
      >
        <Text style={gs.primaryButtonText}>Edit Trip</Text>
      </Pressable>

      <Pressable
        style={[gs.primaryButton, { backgroundColor: "#eb5757", marginTop: 8 }]}
        onPress={() => {
          Alert.alert("Delete this trip?", "This cannot be undone.", [
            { text: "Cancel", style: "cancel" },
            {
              text: "Delete",
              style: "destructive",
              onPress: () => {
                removeTrip(trip.id); // <-- from TripContext
                router.replace("/"); // go back to Home
              },
            },
          ]);
        }}
      >
        <Text style={gs.primaryButtonText}>Delete Trip</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={[gs.screen, { paddingBottom: 16 }]}>
      <FlatList
        data={steps}
        keyExtractor={(s) => s.id}
        renderItem={renderStep}
        ListHeaderComponent={<Header />}
        ListFooterComponent={<Footer />}
        contentContainerStyle={{ paddingVertical: 8 }}
      />
      <Modal
        visible={viewerVisible}
        transparent
        animationType="fade"
        onRequestClose={closePhotoViewer}
      >
        <Pressable style={stylesFullScreen.backdrop} onPress={closePhotoViewer}>
          <View style={stylesFullScreen.center}>
            {viewerPhoto && (
              <Image
                source={{ uri: viewerPhoto }}
                style={stylesFullScreen.image}
                resizeMode="contain"
              />
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = (t: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    markerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 8,
      marginBottom: 12,
    },
    icon: { fontSize: 20 },
    markerText: { fontSize: 15, fontWeight: "600", color: t.text },

    stepCard: {
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 10,
      padding: 12,
      marginBottom: 10,
    },
    stepTitle: { fontWeight: "700", fontSize: 15, color: t.text },
    stepNote: { marginTop: 4, fontSize: 13, color: t.textMuted },
    stepDate: {
      marginTop: 4,
      fontSize: 12,
      color: t.textMuted,
      fontStyle: "italic",
    },

    // Inline add-step row (left-aligned + text to the right)
    addInlineRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 12,
    },
    addCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: t.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    addPlus: {
      color: t.primaryOn,
      fontSize: 22,
      fontWeight: "800",
      lineHeight: 22,
    },
    addInlineText: { color: t.text, fontSize: 14, fontWeight: "600" },
  });

const stylesFullScreen = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
