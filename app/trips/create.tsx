// app/trips/create.tsx
import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, Switch, Alert } from "react-native";
import { TripCalendarRangePicker } from "@/components/TripCalendarRangePicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { TripPrivacy, TripStatus, useTrips } from "@/contexts/TripContext";
import { getTheme } from "@/styles/colors";
import { makeGlobalStyles } from "@/styles/globalStyles";
import { useColorScheme } from "react-native";
import { toISO } from "@/utils/dateUtils";
import { GooglePlacesInput } from "@/components/PlacesAutoComplete";

export default function CreateTripScreen() {
  const scheme = useColorScheme();
  const t = getTheme(scheme);
  const gs = makeGlobalStyles(t);

  const router = useRouter();
  const { addTrip } = useTrips();
  const params = useLocalSearchParams<{ status?: TripStatus }>();
  const initialStatus: TripStatus = (params.status as TripStatus) || "future";

  // Form state
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [privacy, setPrivacy] = useState<TripPrivacy>("private");
  const [trackerEnabled, setTrackerEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const canSubmit = useMemo(() => {
    if (!name.trim()) return false;
    if (!startDate) return false;
    return true;
  }, [name, startDate, endDate]);

  const onCreate = async () => {
    if (!canSubmit || saving) {
      Alert.alert("Missing info", "Please fill in the trip name and dates.");
      return;
    }
    try {
      setSaving(true);

      const newId = await addTrip({
        name: name.trim(),
        summary: summary.trim() || null,
        startDate: toISO(startDate),
        endDate: toISO(endDate),
        privacy,
        trackerEnabled,
        tripStatus: initialStatus,
        // steps array is created by the context; no need to pass here
      } as any);

      router.replace(`/trips/${newId}`);
    } catch (err) {
      console.error("Failed to create trip:", err);
      Alert.alert("Error", "Failed to create trip. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={gs.screen}>
      <Text style={gs.h1}>Create Trip</Text>

      {/* Name */}
      <Text style={gs.label}>
        Trip name<Text style={gs.asterisk}> *</Text>
      </Text>
      <TextInput
        placeholder="e.g. Toronto 2025"
        value={name}
        onChangeText={setName}
        style={gs.input}
        placeholderTextColor={t.textMuted}
      />
      <GooglePlacesInput />

      <TripCalendarRangePicker
        startDate={startDate}
        endDate={endDate}
        allowPast={initialStatus === "past" ? true : false}
        label="Select your trip dates"
        onChange={({ startDate, endDate }) => {
          setStartDate(startDate);
          setEndDate(endDate);
        }}
      />

      {/* Summary */}
      <Text style={gs.label}>Short summary</Text>
      <TextInput
        placeholder="Optional — a few words about this trip"
        value={summary}
        onChangeText={setSummary}
        style={[gs.input, { height: 80 }]}
        multiline
        placeholderTextColor={t.textMuted}
      />

      {/* Privacy */}
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

      {/* Tracker */}
      <View style={[gs.rowBetween, { marginTop: 8 }]}>
        <Text style={gs.label}>Enable Travel Tracker</Text>
        <Switch value={trackerEnabled} onValueChange={setTrackerEnabled} />
      </View>

      {/* Submit */}
      <Pressable
        style={[gs.primaryButton, !canSubmit && { opacity: 0.5 }]}
        disabled={!canSubmit || saving}
        onPress={onCreate}
      >
        <Text style={gs.primaryButtonText}>
          {saving ? "Creating..." : "Create Trip"}
        </Text>
      </Pressable>
    </View>
  );
}
