import React, { useEffect, useMemo, useRef } from "react";
import MapView, { Marker, PROVIDER_GOOGLE, LatLng } from "react-native-maps";
import { StyleSheet, View } from "react-native";
import { useTrips } from "../contexts/TripContext";

const NORTH_AMERICA = {
  latitude: 39,
  longitude: -98,
  latitudeDelta: 55,  
  longitudeDelta: 80,
};

export default function MapPreview() {
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

  // Auto-fit to dots when they exist; otherwise stay on NA
  useEffect(() => {
    if (!mapRef.current || markers.length === 0) return;
    const coords: LatLng[] = markers.map((m) => ({ latitude: m.lat, longitude: m.lng }));
    mapRef.current.fitToCoordinates(coords, {
      edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
      animated: false,
    });
  }, [markers]);

  return (
    <View style={styles.wrap}>
      <MapView
        ref={mapRef}                          
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={NORTH_AMERICA}
        pitchEnabled={false}
        rotateEnabled={false}
        toolbarEnabled={false}
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
  wrap: { height: 180, borderRadius: 12, overflow: "hidden", marginBottom: 12 },
  map: { flex: 1 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#0aa770", borderWidth: 1.5, borderColor: "white" },
});
