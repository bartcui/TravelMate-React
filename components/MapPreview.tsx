import React, { useEffect, useMemo, useRef, useState } from "react";
import MapView, { Marker, PROVIDER_GOOGLE, LatLng } from "react-native-maps";
import { StyleSheet, View } from "react-native";
import { useTrips } from "@/contexts/TripContext";
import { geocodePlace } from "@/utils/geocode";
import { useUser } from "@/contexts/UserContext";
import { NIGHT_MAP_STYLE } from "@/utils/mapUtils";

const NORTH_AMERICA = {
  latitude: 39,
  longitude: -98,
  latitudeDelta: 55,
  longitudeDelta: 80,
};

export default function MapPreview() {
  const { trips } = useTrips();
  const { userDoc } = useUser();
  const mapRef = useRef<MapView | null>(null);

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
      console.log(res);
      if (!cancelled && res) {
        setHomeCoord({ latitude: res.lat, longitude: res.lng });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [homeQuery]);

  const markers = useMemo(
    () =>
      trips.flatMap((t) =>
        t.steps
          .filter((s) => typeof s.lat === "number" && typeof s.lng === "number")
          .map((s) => ({
            id: `${t.id}:${s.id}`,
            lat: s.lat as number,
            lng: s.lng as number,
          }))
      ),
    [trips]
  );

  // Auto-fit to dots when they exist; otherwise stay on NA
  useEffect(() => {
    if (!mapRef.current || markers.length === 0) return;

    const coords: LatLng[] = markers.map((m) => ({
      latitude: m.lat,
      longitude: m.lng,
    }));

    if (homeCoord) {
      coords.push(homeCoord);
    }

    if (coords.length === 0) return;

    mapRef.current.fitToCoordinates(coords, {
      edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
      animated: false,
    });
  }, [markers, homeCoord]);

  // If there's a home coordinate, use it as initial center; else NA
  const initialRegion = homeCoord
    ? {
        latitude: homeCoord.latitude,
        longitude: homeCoord.longitude,
        latitudeDelta: 12,
        longitudeDelta: 10,
      }
    : NORTH_AMERICA;

  return (
    <View style={styles.wrap}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton
        customMapStyle={NIGHT_MAP_STYLE}
        pitchEnabled={false}
        rotateEnabled={false}
        toolbarEnabled={false}
      >
        {/* Trip step dots */}
        {markers.map((m) => (
          <Marker key={m.id} coordinate={{ latitude: m.lat, longitude: m.lng }}>
            <View style={styles.dot} />
          </Marker>
        ))}

        {/* Home marker based on user city/province/country */}
        {homeCoord && (
          <Marker coordinate={homeCoord}>
            <View style={styles.homeMarkerOuter}>
              <View style={styles.homeMarkerInner} />
            </View>
          </Marker>
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 5 },
  dot: {
    width: 10,
    height: 10,
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
});
