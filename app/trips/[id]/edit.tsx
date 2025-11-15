// app/trips/[id]/edit.tsx
import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, Switch, Alert } from "react-native";
import { TripCalendarRangePicker } from "@/components/TripCalendarRangePicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTrips, TripPrivacy } from "@/contexts/TripContext";
import { useColorScheme } from "react-native";
import { getTheme } from "@/styles/colors";
import { makeGlobalStyles } from "@/styles/globalStyles";
import { toISO, parseISO } from "@/utils/dateUtils";

export default function EditTripScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const scheme = useColorScheme();
  const t = getTheme(scheme);
  const gs = makeGlobalStyles(t);

  const { getTripById, updateTrip } = useTrips();
  const trip = getTripById(id!);

  // Form state (prefill from trip)
  const [name, setName] = useState(trip?.name ?? "");
  const [summary, setSummary] = useState(trip?.summary ?? "");
  const [privacy, setPrivacy] = useState<TripPrivacy>(
    (trip?.privacy as TripPrivacy) ?? "private"
  );
  const [trackerEnabled, setTrackerEnabled] = useState<boolean>(
    !!trip?.trackerEnabled
  );
  const [startDate, setStartDate] = useState<Date | null>(
    parseISO(trip?.startDate)
  );
  const [endDate, setEndDate] = useState<Date | null>(
    parseISO(trip?.endDate ?? undefined)
  );
  const [saving, setSaving] = useState(false);

  if (!trip) {
    return (
      <View style={gs.screen}>
        <Text style={gs.label}>Trip not found.</Text>
      </View>
    );
  }

  const canSubmit = useMemo(() => {
    if (!name.trim()) return false;
    if (!startDate) return false;
    return true;
  }, [name, startDate, endDate]);

  const onSave = async () => {
    if (!canSubmit || saving) {
      Alert.alert("Missing info", "Please fill in name and dates.");
      return;
    }
    try {
      await updateTrip(trip.id, {
        name: name.trim(),
        summary: summary.trim() || null,
        startDate: toISO(startDate),
        endDate: toISO(endDate),
        privacy,
        trackerEnabled,
      } as any);

      router.back();
    } catch (err) {
      console.error("Failed to edit trip:", err);
      Alert.alert("Error", "Failed to edit trip. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={gs.screen}>
      <Text style={gs.h1}>Edit Trip</Text>

      <Text style={gs.label}>
        Trip name<Text style={gs.asterisk}> *</Text>
      </Text>
      <TextInput
        placeholder="e.g., Alps 2026"
        value={name}
        onChangeText={setName}
        style={gs.input}
        placeholderTextColor={t.textMuted}
      />

      <TripCalendarRangePicker
        startDate={startDate}
        endDate={endDate}
        allowPast={trip?.tripStatus === "past" ? true : false}
        label="Select your trip dates"
        onChange={({ startDate, endDate }) => {
          setStartDate(startDate);
          setEndDate(endDate);
        }}
      />

      <Text style={gs.label}>Short summary</Text>
      <TextInput
        placeholder="Optional — a few words about this trip"
        value={summary}
        onChangeText={setSummary}
        style={[gs.input, { height: 80 }]}
        multiline
        placeholderTextColor={t.textMuted}
      />

      <Text style={[gs.label, { marginTop: 8 }]}>Privacy</Text>
      <View style={gs.chipsRow}>
        {(["private", "friends", "public"] as TripPrivacy[]).map((p) => {
          const active = privacy === p;
          return (
            <Pressable
              key={p}
              style={[gs.chip, active && gs.chipActive]}
              onPress={() => setPrivacy(p)}
            >
              <Text style={[gs.chipTxt, active && gs.chipTxtActive]}>
                {p[0].toUpperCase() + p.slice(1)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={[gs.rowBetween, { marginTop: 8 }]}>
        <Text style={gs.label}>Enable Travel Tracker</Text>
        <Switch value={trackerEnabled} onValueChange={setTrackerEnabled} />
      </View>

      <Pressable
        style={[gs.primaryButton, !canSubmit && { opacity: 0.5 }]}
        disabled={!canSubmit || saving}
        onPress={onSave}
      >
        <Text style={gs.primaryButtonText}>
          {saving ? "Saving..." : "Save"}
        </Text>
      </Pressable>
    </View>
  );
}
