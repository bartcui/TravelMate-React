import React, { useEffect, useMemo, useRef, useState } from "react";
import { Platform, Text } from "react-native";
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  LatLng,
  Region,
  Callout,
} from "react-native-maps";
import { StyleSheet, View } from "react-native";
import { useTrips } from "@/contexts/TripContext";
import { geocodePlace } from "@/utils/geocode";
import { useUser } from "@/contexts/UserContext";
import { getRegionForCoords, StepMarker } from "@/utils/mapUtils";
import { useRouter } from "expo-router";

const NORTH_AMERICA: Region = {
  latitude: 39,
  longitude: -98,
  latitudeDelta: 40,
  longitudeDelta: 90,
};

export default function MapPreview() {
  const { trips } = useTrips();
  const { userDoc } = useUser();
  const mapRef = useRef<MapView | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [region, setRegion] = useState<Region>(NORTH_AMERICA);
  const router = useRouter();

  const [homeCoord, setHomeCoord] = useState<LatLng | null>(null);

  // Build a single string like "Toronto, Ontario, Canada" from userDoc
  const homeQuery = useMemo(() => {
    if (!userDoc) return null;
    const parts = [userDoc.city, userDoc.province, userDoc.country].filter(
      (p): p is string => !!p && p.trim().length > 0
    );
    if (parts.length === 0) return null;
    return parts.join(", ");
  }, [userDoc?.city, userDoc?.province, userDoc?.country]);

  // Geocode the user's city/province/country into a lat/lng
  useEffect(() => {
    let cancelled = false;

    if (!homeQuery) {
      setHomeCoord(null);
      return;
    }

    (async () => {
      const res = await geocodePlace(homeQuery);
      if (!cancelled && res) {
        console.log(res);
        setHomeCoord({ latitude: res.lat, longitude: res.lng });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [homeQuery]);

  const markers: StepMarker[] = useMemo(
    () =>
      trips.flatMap((t) =>
        t.steps
          .filter((s) => typeof s.lat === "number" && typeof s.lng === "number")
          .map((s) => ({
            id: `${t.id}:${s.id}`,
            tripId: String(t.id),
            stepId: String(s.id),
            lat: s.lat as number,
            lng: s.lng as number,
            name: s.title,
          }))
      ),
    [trips]
  );

  // Auto-fit to dots when they exist; otherwise stay on NA
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    const coords: LatLng[] = [];

    if (markers.length > 0) {
      coords.push(
        ...markers.map((m) => ({
          latitude: m.lat,
          longitude: m.lng,
        }))
      );
    }

    if (homeCoord) {
      coords.push(homeCoord);
    }

    if (coords.length === 0) return;

    const region = getRegionForCoords(coords);
    setRegion(region);

    // Smooth animation to the computed region
    // moves the camera to load markers
    mapRef.current.animateToRegion(region, 1500);
  }, [mapReady, markers, homeCoord]);

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      provider={Platform.OS === "ios" ? undefined : PROVIDER_GOOGLE}
      mapType={Platform.OS === "ios" ? "hybridFlyover" : "satellite"}
      onMapReady={() => setMapReady(true)}
      initialRegion={NORTH_AMERICA}
      region={region}
      onRegionChangeComplete={setRegion}
      pitchEnabled={false}
      rotateEnabled={false}
      toolbarEnabled={false}
    >
      {/* Trip step dots */}
      {markers.map((m) => (
        <Marker
          key={m.id}
          coordinate={{ latitude: m.lat, longitude: m.lng }}
          onPress={() =>
            router.push(`/trips/${m.tripId}/steps/${m.stepId}/edit`)
          }
        >
          <View style={styles.dot} />
        </Marker>
      ))}

      {/* Home marker based on user city/province/country */}
      {homeCoord && (
        <Marker coordinate={homeCoord}>
          <View style={styles.homeMarkerOuter}>
            <View style={styles.homeMarkerInner} />
          </View>
          <Callout>
            <View style={styles.calloutContainer}>
              <Text
                style={styles.calloutText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                Home
              </Text>
            </View>
          </Callout>
        </Marker>
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  dot: {
    width: 15,
    height: 15,
    borderRadius: 5,
    backgroundColor: "#0aa770",
    borderWidth: 1.5,
    borderColor: "white",
  },
  homeMarkerOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  homeMarkerInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#ff4d4f",
  },
  calloutContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: 250,
  },

  calloutText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000",
    flexShrink: 1, // allow text to shrink instead of wrap
    width: "100%", // do NOT force fixed width
    // iOS only: stops wrapping
    // @ts-ignore
    whiteSpace: "nowrap",
  },
});
