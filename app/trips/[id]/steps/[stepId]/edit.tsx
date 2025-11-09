import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, Alert, Platform } from "react-native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useTrips } from "../../../../../contexts/TripContext";
import { useColorScheme } from "react-native";
import { getTheme } from "../../../../../styles/colors";
import { makeGlobalStyles } from "../../../../../styles/globalStyles";

function toShort(d?: Date | null) { return d ? d.toDateString() : "Select date"; }
function toISO(d: Date | null) { return d ? d.toISOString() : undefined; }
function parseISO(iso?: string | null) { return iso ? new Date(iso) : null; }

export default function EditStepScreen() {
  const { id, stepId } = useLocalSearchParams<{ id: string; stepId: string }>();
  const navigation = useNavigation();
  const router = useRouter();
  const { getTripById, updateStep, removeStep } = useTrips();

  const scheme = useColorScheme();
  const t = getTheme(scheme);
  const gs = makeGlobalStyles(t);

  const trip = getTripById(id!);
  const step = useMemo(() => trip?.steps.find(s => s.id === stepId), [trip, stepId]);

  if (!trip) return <Text style={{ padding: 16, color: t.text }}>Trip not found.</Text>;
  if (!step) return <Text style={{ padding: 16, color: t.text }}>Step not found.</Text>;

  const [place, setPlace] = useState(step.title ?? "");
  const [whereStay, setWhereStay] = useState(() => {
    const m = step.note?.split("\n").find(l => l.toLowerCase().startsWith("stay:"));
    return m ? m.replace(/^stay:\s*/i, "") : "";
  });
  const [things, setThings] = useState(() => {
    const m = step.note?.split("\n").find(l => l.toLowerCase().startsWith("to do:"));
    return m ? m.replace(/^to do:\s*/i, "") : "";
  });

  const [start, setStart] = useState<Date | null>(parseISO(step.visitedAt as any));
  const [end, setEnd] = useState<Date | null>(parseISO((step as any).endAt));
  const [showPicker, setShowPicker] = useState<null | "start" | "end">(null);

  useEffect(() => {
    navigation.setOptions({ title: place || "Edit Step" });
  }, [navigation, place]);

  const onSave = () => {
    if (!place.trim() || !start) {
      Alert.alert("Missing info", "Place and start date are required.");
      return;
    }
    const parts: string[] = [];
    if (whereStay.trim()) parts.push(`Stay: ${whereStay.trim()}`);
    if (things.trim()) parts.push(`To do: ${things.trim()}`);
    if (start && end) parts.push(`Duration: (${start.toDateString()} – ${end.toDateString()})`);

    updateStep(trip.id, step.id, {
      title: place.trim(),
      note: parts.join("\n"),
      visitedAt: toISO(start),
      ...(end ? ({ endAt: toISO(end) } as any) : ({ endAt: undefined } as any)),
    });

    router.back();
  };

  const onDelete = () => {
    Alert.alert("Delete step?", "This cannot be undone.", [
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

  return (
    <View style={gs.screen}>
      <Text style={gs.h1}>Edit Step</Text>

      <Text style={gs.label}>City / Attraction</Text>
      <TextInput
        placeholder="e.g., Tokyo Skytree"
        value={place}
        onChangeText={setPlace}
        style={gs.input}
        placeholderTextColor={t.textMuted}
      />

      <Text style={gs.label}>Start date</Text>
      <Pressable style={gs.dateBtn} onPress={() => setShowPicker("start")}>
        <Text style={gs.dateTxt}>{toShort(start)}</Text>
      </Pressable>

      <Text style={gs.label}>End date (optional)</Text>
      <Pressable style={gs.dateBtn} onPress={() => setShowPicker("end")}>
        <Text style={gs.dateTxt}>{toShort(end)}</Text>
      </Pressable>

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

      <Pressable style={gs.primaryButton} onPress={onSave}>
        <Text style={gs.primaryButtonText}>Save</Text>
      </Pressable>
      <Pressable
        style={[gs.primaryButton, { backgroundColor: "#eb5757", marginTop: 8 }]}
        onPress={onDelete}
      >
        <Text style={gs.primaryButtonText}>Delete</Text>
      </Pressable>

      <DateTimePickerModal
        isVisible={showPicker === "start"}
        mode="date"
        onConfirm={(d) => { setStart(d); if (end && d && end < d) setEnd(null); setShowPicker(null); }}
        onCancel={() => setShowPicker(null)}
        display={Platform.OS === "ios" ? "inline" : "default"}
      />
      <DateTimePickerModal
        isVisible={showPicker === "end"}
        mode="date"
        onConfirm={(d) => { setEnd(d); setShowPicker(null); }}
        onCancel={() => setShowPicker(null)}
        display={Platform.OS === "ios" ? "inline" : "default"}
      />
    </View>
  );
}
