import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { TripCalendarRangePicker } from "@/components/TripCalendarRangePicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTrips } from "@/contexts/TripContext";
import { useUser } from "@/contexts/UserContext";
import { useColorScheme } from "react-native";
import { getTheme } from "@/styles/colors";
import { makeGlobalStyles } from "@/styles/globalStyles";
import { geocodePlace } from "@/utils/geocode";
import { parseISO, toISO, diffDays } from "@/utils/dateUtils";
import { PhotoPickerGallery } from "@/components/PhotoPickerGallery";

export default function AddStepScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { addStep, getTripById } = useTrips();
  const { user } = useUser();

  const scheme = useColorScheme();
  const t = getTheme(scheme);
  const gs = makeGlobalStyles(t);

  const trip = getTripById(id!);
  if (!trip)
    return <Text style={{ padding: 16, color: t.text }}>Trip not found.</Text>;
  if (!user?.uid)
    return <Text style={{ padding: 16, color: t.text }}>User not found.</Text>;
  // form state
  const [place, setPlace] = useState("");
  const [whereStay, setWhereStay] = useState("");
  const [things, setThings] = useState("");
  const [start, setStart] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);

  const durationDays = useMemo(() => diffDays(start, end), [start, end]);
  const canSubmit = useMemo(() => !!place.trim() && !!start, [place, start]);

  const onSubmit = async () => {
    if (!canSubmit || saving) {
      Alert.alert(
        "Missing info",
        "Please add at least the place name and a start date."
      );
      return;
    }
    try {
      let lat: number | null = null;
      let lng: number | null = null;

      // Try exact input; if that fails, try adding a country hint
      const primary = await geocodePlace(place);
      const fallback =
        !primary && /,/.test(place) === false
          ? await geocodePlace(`${place}, Canada`) // small bias since you’re in Toronto
          : null;

      const hit = primary || fallback;
      if (hit) {
        lat = hit.lat;
        lng = hit.lng;
        console.log("Geocoded via Mapbox:", place, lat, lng, "→", hit.name);
      } else {
        console.log("No geocode results for", place);
      }

      const parts: string[] = [];
      if (whereStay.trim()) parts.push(`Stay: ${whereStay.trim()}`);
      if (things.trim()) parts.push(`To do: ${things.trim()}`);
      if (start && end) {
        const d = durationDays ?? 0;
        parts.push(
          `Duration: ${d} day${
            d === 1 ? "" : "s"
          } (${start.toDateString()} – ${end.toDateString()})`
        );
      }

      await addStep(trip.id, {
        title: place.trim(),
        note: parts.join("\n"),
        visitedAt: toISO(start),
        endAt: end ? toISO(end) : null,
        lat,
        lng,
        photos,
      } as any);

      router.back();
    } catch (err) {
      console.error("Failed to add trip-destination:", err);
      Alert.alert("Error", "Failed to add trip-destination. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const storageBasePath = `users/${user.uid}/trips/${trip.id}/steps-uploads`;

  return (
    <View style={gs.screen}>
      <Text style={gs.h1}>Add Destination</Text>

      {/* Place name */}
      <Text style={gs.label}>
        City / Attraction<Text style={gs.asterisk}> *</Text>
      </Text>
      <TextInput
        placeholder="Main destination"
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

      {!!durationDays && (
        <Text style={[gs.label, gs.highlight]}>
          {durationDays} day{durationDays === 1 ? "" : "s"}
        </Text>
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

      <PhotoPickerGallery
        photos={photos}
        onChange={setPhotos}
        storageBasePath={storageBasePath}
        title="Destination photos"
        maxPhotos={12}
      />

      {/* Submit */}
      <Pressable
        style={[gs.primaryButton, !canSubmit && { opacity: 0.5 }]}
        disabled={!canSubmit || saving}
        onPress={onSubmit}
      >
        <Text style={gs.primaryButtonText}>
          {saving ? "Adding..." : "＋ Add Destination"}
        </Text>
      </Pressable>
    </View>
  );
}
