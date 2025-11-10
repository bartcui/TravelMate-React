// app/trips/create.tsx
import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, Switch, Platform, Alert } from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { TripPrivacy, TripStatus, useTrips } from "../../contexts/TripContext";
import { getTheme } from "../../styles/colors";
import { makeGlobalStyles } from "../../styles/globalStyles";
import { useColorScheme } from "react-native";

function toISODate(d: Date | undefined | null) {
  return d ? d.toISOString() : undefined;
}

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

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [unknownEnd, setUnknownEnd] = useState(initialStatus !== "past"); // default unknown for current/future

  // pickers
  const [showPicker, setShowPicker] = useState<null | "start" | "end">(null);

  const canSubmit = useMemo(() => {
    if (!name.trim()) return false;
    if (!startDate) return false;
    if (!unknownEnd && !endDate) return false;
    return true;
  }, [name, startDate, unknownEnd, endDate]);

  const onCreate = () => {
    if (!canSubmit) {
      Alert.alert("Missing info", "Please fill in the trip name and dates.");
      return;
    }

    const newId = addTrip({
      name: name.trim(),
      summary: summary.trim() || undefined,
      startDate: toISODate(startDate),
      endDate: unknownEnd ? null : toISODate(endDate),
      privacy,
      trackerEnabled,
      // steps array is created by the context; no need to pass here
    } as any);

    router.replace(`/trips/${newId}`);
  };

  return (
    <View style={gs.screen}>
      <Text style={gs.h1}>Create Trip</Text>

      {/* Name */}
      <Text style={gs.label}>Trip name</Text>
      <TextInput
        placeholder="e.g. Toronto 2025"
        value={name}
        onChangeText={setName}
        style={gs.input}
        placeholderTextColor={t.textMuted}
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

      {/* Start date */}
      <Text style={gs.label}>Start date</Text>
      <Pressable style={gs.dateBtn} onPress={() => setShowPicker("start")}>
        <Text style={gs.dateTxt}>{startDate ? startDate.toDateString() : "Select start date"}</Text>
      </Pressable>

      {/* End date / unknown */}
      <View style={[gs.rowBetween, { marginTop: 6 }]}>
        <Text style={gs.label}>I don't know the end date yet</Text>
        <Switch value={unknownEnd} onValueChange={setUnknownEnd} />
      </View>

      {!unknownEnd && (
        <>
          <Text style={gs.label}>End date</Text>
          <Pressable style={gs.dateBtn} onPress={() => setShowPicker("end")}>
            <Text style={gs.dateTxt}>{endDate ? endDate.toDateString() : "Select end date"}</Text>
          </Pressable>
        </>
      )}

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
        disabled={!canSubmit}
        onPress={onCreate}
      >
        <Text style={gs.primaryButtonText}>Create Trip</Text>
      </Pressable>

      {/* Date pickers */}
      <DateTimePickerModal
        isVisible={showPicker === "start"}
        mode="date"
        onConfirm={(d) => {
          setStartDate(d);
          // if end set and now < start, clear end to avoid invalid range
          if (endDate && d && endDate < d) setEndDate(null);
          setShowPicker(null);
        }}
        onCancel={() => setShowPicker(null)}
        display={Platform.OS === "ios" ? "inline" : "default"}
      />
      <DateTimePickerModal
        isVisible={showPicker === "end"}
        mode="date"
        onConfirm={(d) => {
          setEndDate(d);
          setShowPicker(null);
        }}
        onCancel={() => setShowPicker(null)}
        display={Platform.OS === "ios" ? "inline" : "default"}
      />
    </View>
  );
}
