import React, { useEffect, useMemo, useRef } from "react";
import { View, StyleSheet } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, LatLng } from "react-native-maps";
import { useTrips } from "../../contexts/TripContext";

const NORTH_AMERICA = {
  latitude: 39,
  longitude: -98,
  latitudeDelta: 55,
  longitudeDelta: 80,
};

export default function MapScreen() {
  const { trips } = useTrips();
  const mapRef = useRef<MapView | null>(null); 

  const markers = useMemo(
    () =>
      trips.flatMap((t) =>
        t.steps
          .filter((s) => typeof s.lat === "number" && typeof s.lng === "number")
          .map((s) => ({ id: `${t.id}:${s.id}`, lat: s.lat as number, lng: s.lng as number })),
      ),
    [trips]
  );

  useEffect(() => {
    if (!mapRef.current || markers.length === 0) return;
    const coords: LatLng[] = markers.map((m) => ({ latitude: m.lat, longitude: m.lng }));
    mapRef.current.fitToCoordinates(coords, {
      edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
      animated: false,
    });
  }, [markers]);

  return (
    <View style={styles.screen}>
      <MapView
        ref={mapRef}                             
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        initialRegion={NORTH_AMERICA}
      >
        {markers.map((m) => (
          <Marker key={m.id} coordinate={{ latitude: m.lat, longitude: m.lng }}>
            <View style={styles.dot} />
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#0aa770", borderWidth: 2, borderColor: "white" },
});
