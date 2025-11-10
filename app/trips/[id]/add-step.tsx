import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, Switch, Platform, Alert, StyleSheet } from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTrips } from "../../../contexts/TripContext";
import { useColorScheme } from "react-native";
import { getTheme } from "../../../styles/colors";
import { makeGlobalStyles } from "../../../styles/globalStyles";
import { useNavigation } from "expo-router";

function toISO(d: Date | null) {
  return d ? d.toISOString() : undefined;
}
function toShort(d?: Date | null) {
  return d ? d.toDateString() : "Select date";
}
function diffDays(a: Date | null, b: Date | null) {
  if (!a || !b) return undefined;
  const ms = Math.abs(b.setHours(0,0,0,0) - a.setHours(0,0,0,0));
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export default function AddStepScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { addStep, getTripById } = useTrips();

  const scheme = useColorScheme();
  const t = getTheme(scheme);
  const gs = makeGlobalStyles(t);

  const trip = getTripById(id!);
  if (!trip) return <Text style={{ padding: 16, color: t.text }}>Trip not found.</Text>;

  // form state
  const [place, setPlace] = useState("");
  const [whereStay, setWhereStay] = useState("");
  const [things, setThings] = useState("");
  const [start, setStart] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);

  const [showPicker, setShowPicker] = useState<null | "start" | "end">(null);

  const durationDays = useMemo(() => diffDays(start, end), [start, end]);
  const canSubmit = useMemo(() => !!place.trim() && !!start, [place, start]);

  const navigation = useNavigation();

  React.useEffect(() => {
    navigation.setOptions({ title: "" }); 
  }, [navigation]);

  const onSubmit = () => {
    if (!canSubmit) {
      Alert.alert("Missing info", "Please add at least the place name and a start date.");
      return;
    }

    const parts: string[] = [];
    if (whereStay.trim()) parts.push(`Stay: ${whereStay.trim()}`);
    if (things.trim()) parts.push(`To do: ${things.trim()}`);
    if (start && end) {
      const d = durationDays ?? 0;
      parts.push(`Duration: ${d} day${d === 1 ? "" : "s"} (${start.toDateString()} – ${end.toDateString()})`);
    }

    // Store start date in visitedAt; keep end date as a custom field (endAt).
    // Casting to any to avoid strict typing changes in TripContext.
    addStep(trip.id, {
      title: place.trim(),
      note: parts.join("\n"),
      visitedAt: toISO(start),
      // extra field we’ll read in the details screen:
      ...(end ? ({ endAt: toISO(end) } as any) : {}),
    } as any);

    router.back(); // return to details
  };

  return (
    <View style={gs.screen}>
      <Text style={gs.h1}>Add Step</Text>

      {/* Place name */}
      <Text style={gs.label}>City / Attraction</Text>
      <TextInput
        placeholder="Main destination"
        value={place}
        onChangeText={setPlace}
        style={gs.input}
        placeholderTextColor={t.textMuted}
      />

      {/* Dates */}
      <Text style={gs.label}>Start date</Text>
      <Pressable style={gs.dateBtn} onPress={() => setShowPicker("start")}>
        <Text style={gs.dateTxt}>{toShort(start)}</Text>
      </Pressable>

      <Text style={gs.label}>End date (optional)</Text>
      <Pressable style={gs.dateBtn} onPress={() => setShowPicker("end")}>
        <Text style={gs.dateTxt}>{toShort(end)}</Text>
      </Pressable>

      {!!durationDays && (
        <Text style={[gs.label, { marginTop: 6 }]}>{durationDays} day{durationDays === 1 ? "" : "s"}</Text>
      )}

      {/* Where to stay */}
      <Text style={gs.label}>Where to stay</Text>
      <TextInput
        placeholder="Hotel / Hostel / Airbnb"
        value={whereStay}
        onChangeText={setWhereStay}
        style={gs.input}
        placeholderTextColor={t.textMuted}
      />

      {/* Things to see & do */}
      <Text style={gs.label}>Things to see & do</Text>
      <TextInput
        placeholder="..."
        value={things}
        onChangeText={setThings}
        style={[gs.input, { height: 100 }]}
        multiline
        placeholderTextColor={t.textMuted}
      />

      {/* Submit */}
      <Pressable
        style={[gs.primaryButton, !canSubmit && { opacity: 0.5 }]}
        disabled={!canSubmit}
        onPress={onSubmit}
      >
        <Text style={gs.primaryButtonText}>＋ Add Step</Text>
      </Pressable>

      {/* Pickers */}
      <DateTimePickerModal
        isVisible={showPicker === "start"}
        mode="date"
        onConfirm={(d) => {
          setStart(d);
          if (end && d && end < d) setEnd(null);
          setShowPicker(null);
        }}
        onCancel={() => setShowPicker(null)}
        display={Platform.OS === "ios" ? "inline" : "default"}
      />
      <DateTimePickerModal
        isVisible={showPicker === "end"}
        mode="date"
        onConfirm={(d) => {
          setEnd(d);
          setShowPicker(null);
        }}
        onCancel={() => setShowPicker(null)}
        display={Platform.OS === "ios" ? "inline" : "default"}
      />
    </View>
  );
}
