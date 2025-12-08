// Home Screen
import React, { useState, useMemo, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Modal,
  StyleSheet,
  Image,
  Animated,
  PanResponder,
  Dimensions,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { useColorScheme } from "react-native";
import { getTheme } from "../styles/colors";
import { makeGlobalStyles } from "../styles/globalStyles";
import { useTrips, getTripStatus, Trip } from "../contexts/TripContext";
import { useUser } from "../contexts/UserContext";
import MapPreview from "../components/MapPreview";
import { getTripAlerts } from "../utils/notifications";
import { SCREEN_HEIGHT } from "../utils/constants";

export default function HomeScreen() {
  // snap *top* positions for the sheet (smaller top => more visible)
  const TOP_FULL = SCREEN_HEIGHT * 0.1; // sheet fills screen
  const TOP_MID = SCREEN_HEIGHT * 0.5; // 50% visible
  const TOP_PEEK = SCREEN_HEIGHT * 0.8; // only ~20% visible
  const MIN_TOP = TOP_FULL;
  const MAX_TOP = TOP_PEEK;
  // Bottom sheet logic
  const initialTop = TOP_MID; // start at 50%

  const scheme = useColorScheme();
  const t = getTheme(scheme);
  const gs = makeGlobalStyles(t);

  const router = useRouter();
  const { trips } = useTrips();
  const hasAlerts = React.useMemo(
    () => getTripAlerts(trips).length > 0,
    [trips]
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const { user, baseAvatarUri } = useUser();
  const displayName = user?.displayName || "Traveler";

  const currentTop = useRef(initialTop);
  const sheetTop = useRef(new Animated.Value(initialTop)).current;

  const snapTo = (targetTop: number) => {
    Animated.spring(sheetTop, {
      toValue: targetTop,
      useNativeDriver: false,
      bounciness: 4,
    }).start();
    currentTop.current = targetTop;
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 5,
      onPanResponderMove: (_, gestureState) => {
        const newTop = currentTop.current + gestureState.dy;
        // clamp between full and peek
        const clamped = Math.min(Math.max(newTop, MIN_TOP), MAX_TOP);
        sheetTop.setValue(clamped);
      },
      onPanResponderRelease: (_, gestureState) => {
        const newTop = currentTop.current + gestureState.dy;
        const clamped = Math.min(Math.max(newTop, MIN_TOP), MAX_TOP);

        // choose closest snap point
        const candidates = [TOP_FULL, TOP_MID, TOP_PEEK];
        let best = candidates[0];
        let bestDist = Math.abs(clamped - best);
        for (let i = 1; i < candidates.length; i++) {
          const d = Math.abs(clamped - candidates[i]);
          if (d < bestDist) {
            best = candidates[i];
            bestDist = d;
          }
        }
        snapTo(best);
      },
    })
  ).current;

  const sortedTrips = useMemo(() => {
    return [...trips].sort((a, b) => {
      const da = a.startDate ? new Date(a.startDate).getTime() : 0;
      const db = b.startDate ? new Date(b.startDate).getTime() : 0;
      return db - da || a.name.localeCompare(b.name);
    });
  }, [trips]);

  const renderTrip = ({ item }: { item: Trip }) => {
    const status = getTripStatus(item);
    return (
      <Pressable
        style={[styles(t).card]}
        onPress={() => router.push(`/trips/${item.id}`)}
      >
        <Text style={[styles(t).cardTitle]}>{item.name}</Text>
        <Text style={[styles(t).cardSubtitle]}>
          {item.startDate ? new Date(item.startDate).toDateString() : "—"} →{" "}
          {item.endDate ? new Date(item.endDate).toDateString() : "—"} •{" "}
          {status.toUpperCase()}
        </Text>
        {!!item.summary && (
          <Text style={[styles(t).cardSummary]}>{item.summary}</Text>
        )}
      </Pressable>
    );
  };

  return (
    <View style={gs.homeScreen}>
      {/* Map fills the background area; sheet will float on top */}
      <View style={gs.mapContainer}>
        <MapPreview />
      </View>

      {/* Draggable bottom sheet (card with trips) */}
      <Animated.View
        style={[
          gs.bottomSheet,
          {
            top: sheetTop,
          },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Handle bar */}
        <View style={gs.sheetHandle} />

        {/* Header: avatar + name + settings + notification */}
        <View style={styles(t).headerRow}>
          <View style={styles(t).profileRow}>
            <Image source={{ uri: baseAvatarUri }} style={styles(t).avatar} />
            <View>
              <Text style={styles(t).hello}>Hello,</Text>
              <Text style={styles(t).name}>{displayName}</Text>
            </View>
          </View>
          <View style={styles(t).rightIcons}>
            <Link href="/profile" asChild>
              <Pressable style={styles(t).settingsBtn}>
                <Text style={styles(t).settingsTxt}>
                  <Ionicons
                    name="person-circle-outline"
                    size={32}
                    color="#4b5563"
                  />
                </Text>
              </Pressable>
            </Link>

            <Link href="/notifications" asChild>
              <Pressable style={styles(t).settingsBtn}>
                <Text style={styles(t).settingsTxt}>
                  <Ionicons
                    name="notifications-circle"
                    size={32}
                    color="#4b5563"
                  />
                </Text>
                {hasAlerts && (
                  <View
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      width: 9,
                      height: 9,
                      borderRadius: 5,
                      backgroundColor: "#ff3b30",
                      borderWidth: 1,
                      borderColor: "white",
                    }}
                  />
                )}
              </Pressable>
            </Link>
          </View>
        </View>
        {/* Add Trip */}
        <Pressable style={gs.primaryButton} onPress={() => setPickerOpen(true)}>
          <Text style={gs.primaryButtonText}>＋ Add Trip</Text>
        </Pressable>

        {/* Trips list */}
        <FlatList
          data={sortedTrips}
          keyExtractor={(tr) => tr.id}
          renderItem={renderTrip}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={
            <Text style={styles(t).empty}>
              Your travel story starts here. Tap “Add Trip”.
            </Text>
          }
        />
      </Animated.View>

      {/* Add Trip Type Picker (Past / Current / Future) */}
      <Modal
        visible={pickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerOpen(false)}
      >
        <View style={styles(t).modalBackdrop}>
          <View style={styles(t).modalCard}>
            <Text style={styles(t).modalTitle}>When is the trip?</Text>
            <Pressable
              style={styles(t).modalBtn}
              onPress={() => {
                setPickerOpen(false);
                router.push("/trips/create?status=future");
              }}
            >
              <Text style={styles(t).modalBtnTxt}>Future Trip</Text>
            </Pressable>
            <Pressable
              style={styles(t).modalBtn}
              onPress={() => {
                setPickerOpen(false);
                router.push("/trips/create?status=current");
              }}
            >
              <Text style={styles(t).modalBtnTxt}>Current Trip</Text>
            </Pressable>
            <Pressable
              style={styles(t).modalBtn}
              onPress={() => {
                setPickerOpen(false);
                router.push("/trips/create?status=past");
              }}
            >
              <Text style={styles(t).modalBtnTxt}>Past Trip</Text>
            </Pressable>
            <Pressable
              style={[styles(t).modalBtn, styles(t).modalCancel]}
              onPress={() => setPickerOpen(false)}
            >
              <Text style={[styles(t).modalBtnTxt, { opacity: 0.7 }]}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = (t: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    profileRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    rightIcons: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 8 },
    hello: { fontSize: 12, color: t.textMuted },
    name: { fontSize: 18, fontWeight: "700", color: t.text },
    settingsBtn: { padding: 8 },
    settingsTxt: { fontSize: 20 },

    card: {
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 12,
      padding: 12,
      marginVertical: 6,
      backgroundColor: t.surface,
    },
    cardTitle: { fontSize: 16, fontWeight: "700", color: t.text },
    cardSubtitle: { fontSize: 12, color: t.textMuted, marginTop: 4 },
    cardSummary: { fontSize: 13, color: t.text, marginTop: 6 },
    empty: { textAlign: "center", marginTop: 40, color: t.textMuted },

    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.25)",
      justifyContent: "center",
      padding: 24,
    },
    modalCard: {
      backgroundColor: t.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: t.border,
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: "700",
      marginBottom: 8,
      color: t.text,
    },
    modalBtn: { paddingVertical: 12, alignItems: "center" },
    modalBtnTxt: { fontWeight: "600", color: t.text },
    modalCancel: { borderTopWidth: 1, borderTopColor: t.border, marginTop: 8 },
  });
