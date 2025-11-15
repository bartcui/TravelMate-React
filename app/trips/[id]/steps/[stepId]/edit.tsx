// app/trips/[id]/steps/[stepId]/edit.tsx
import React, { useEffect, useMemo, useState, useLayoutEffect } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { TripCalendarRangePicker } from "@/components/TripCalendarRangePicker";
import { useTrips } from "@/contexts/TripContext";
import { useColorScheme } from "react-native";
import { getTheme } from "@/styles/colors";
import { makeGlobalStyles } from "@/styles/globalStyles";
import { geocodePlace } from "@/utils/geocode";
import { HeaderBackButton } from "@react-navigation/elements";
import { useNavigation } from "expo-router";
import { parseISO, toISO } from "@/utils/dateUtils";

export default function EditStepScreen() {
  const { id, stepId } = useLocalSearchParams<{ id: string; stepId: string }>();
  const router = useRouter();
  const { getTripById, updateStep, removeStep } = useTrips();
  const navigation = useNavigation();

  const scheme = useColorScheme();
  const t = getTheme(scheme);
  const gs = makeGlobalStyles(t);

  // Look up trip & step (pure values; no early returns!)
  const trip = getTripById(id!);
  const step = useMemo(
    () => trip?.steps.find((s) => s.id === stepId),
    [trip, stepId]
  );

  // Local state: initialize with safe defaults; then hydrate from `step` in an effect
  const [place, setPlace] = useState("");
  const [whereStay, setWhereStay] = useState("");
  const [things, setThings] = useState("");
  const [start, setStart] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);

  // Hydrate state whenever `step` changes (first load or edit another step)
  useEffect(() => {
    if (!step) return;
    setPlace(step.title ?? "");
    const stayLine =
      step.note?.split("\n").find((l) => l.toLowerCase().startsWith("stay:")) ??
      "";
    const todoLine =
      step.note
        ?.split("\n")
        .find((l) => l.toLowerCase().startsWith("to do:")) ?? "";
    setWhereStay(stayLine.replace(/^stay:\s*/i, ""));
    setThings(todoLine.replace(/^to do:\s*/i, ""));
    setStart(parseISO(step.visitedAt as any));
    setEnd(parseISO((step as any).endAt));
  }, [step]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <HeaderBackButton
          onPress={() => navigation.goBack()}
          tintColor="#007AFF"
          label="Back"
        />
      ),
    });
  }, []);

  const onSave = async () => {
    if (!trip || !step || saving) return;

    if (!place.trim() || !start) {
      Alert.alert("Missing info", "Place and start date are required.");
      return;
    }

    setSaving(true);
    try {
      const parts: string[] = [];
      if (whereStay.trim()) parts.push(`Stay: ${whereStay.trim()}`);
      if (things.trim()) parts.push(`To do: ${things.trim()}`);
      if (start && end)
        parts.push(
          `Duration: (${start.toDateString()} – ${end.toDateString()})`
        );

      let nextLat: number | null | undefined = (step as any).lat ?? null;
      let nextLng: number | null | undefined = (step as any).lng ?? null;

      // if the place name changed or coords are missing, redo
      const placeChanged =
        (step.title ?? "").trim().toLowerCase() !== place.trim().toLowerCase();
      const coordsMissing =
        typeof nextLat !== "number" || typeof nextLng !== "number";

      if (placeChanged || coordsMissing) {
        const hit = await geocodePlace(place.trim());
        const fallback =
          !hit && !/,/.test(place)
            ? await geocodePlace(`${place.trim()}, Canada`)
            : null; //add bias
        const best = hit || fallback;

        if (best) {
          nextLat = best.lat;
          nextLng = best.lng;
          console.log(
            "Re-geocoded via Mapbox:",
            place,
            nextLat,
            nextLng,
            "→",
            best.name
          );
        } else {
          console.log("Re-geocode failed; keeping previous coords.");
        }
      }

      await updateStep(trip.id, step.id, {
        title: place.trim(),
        note: parts.join("\n"),
        visitedAt: toISO(start),
        ...(end ? ({ endAt: toISO(end) } as any) : ({ endAt: null } as any)),
        ...(typeof nextLat === "number" && typeof nextLng === "number"
          ? ({ lat: nextLat, lng: nextLng } as any)
          : {}),
      });

      router.back();
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    if (!trip || !step) return;
    Alert.alert("Delete destination?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          removeStep(trip.id, step.id);
          router.back();
        },
      },
    ]);
  };

  // Render fallbacks instead of early-returns to preserve hook order
  if (!trip) {
    return (
      <View style={[gs.screen, { justifyContent: "center" }]}>
        <Text style={gs.label}>Trip not found.</Text>
      </View>
    );
  }
  if (!step) {
    return (
      <View style={[gs.screen, { justifyContent: "center" }]}>
        <Text style={gs.label}>
          Destination not found (it may have been deleted).
        </Text>
      </View>
    );
  }

  return (
    <View style={gs.screen}>
      <Text style={gs.h1}>Edit Destination</Text>
      <Text style={gs.label}>
        City / Attraction<Text style={gs.asterisk}> *</Text>
      </Text>
      <TextInput
        placeholder="e.g., Tokyo Skytree"
        value={place}
        onChangeText={setPlace}
        style={gs.input}
        placeholderTextColor={t.textMuted}
      />

      {/* Dates */}
      <TripCalendarRangePicker
        startDate={start}
        endDate={end}
        minDate={parseISO(trip.startDate)}
        maxDate={parseISO(trip.endDate)}
        allowPast={trip?.tripStatus === "past" ? true : false}
        label="Select your destination dates"
        onChange={({ startDate, endDate }) => {
          setStart(startDate);
          setEnd(endDate);
        }}
      />

      <Text style={gs.label}>Where to stay</Text>
      <TextInput
        placeholder="Hotel / Hostel / Neighborhood"
        value={whereStay}
        onChangeText={setWhereStay}
        style={gs.input}
        placeholderTextColor={t.textMuted}
      />

      <Text style={gs.label}>Things to see & do</Text>
      <TextInput
        placeholder="Bullet points or comma-separated list"
        value={things}
        onChangeText={setThings}
        style={[gs.input, { height: 100 }]}
        multiline
        placeholderTextColor={t.textMuted}
      />

      <Pressable style={gs.primaryButton} onPress={onSave} disabled={saving}>
        <Text style={gs.primaryButtonText}>
          {saving ? "Saving..." : "Save"}
        </Text>
      </Pressable>
      <Pressable
        style={[gs.primaryButton, { backgroundColor: "#eb5757", marginTop: 8 }]}
        onPress={onDelete}
      >
        <Text style={gs.primaryButtonText}>Delete</Text>
      </Pressable>
    </View>
  );
}
