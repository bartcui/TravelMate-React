import React, { useEffect, useMemo, useRef, useState } from "react";
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  LatLng,
  Region,
  Callout,
} from "react-native-maps";
import {
  StyleSheet,
  View,
  Image,
  Platform,
  Text,
  Animated,
  Easing,
} from "react-native";
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

const CARD_WIDTH = 110;
const CARD_HEIGHT = 90;
const ARROW_HEIGHT = 8;

function StepPhotoMarker({
  photo,
  name,
}: {
  photo: string;
  name?: string | null;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, scale]);

  return (
    <Animated.View
      style={[
        styles.markerRoot,
        {
          opacity,
          transform: [{ scale }],
        },
      ]}
    >
      {/* Arrow is at the very bottom – this is what sits on the coordinate */}
      <View style={styles.cardArrow} />

      {/* Card is drawn above, but still inside the same container */}
      <View style={styles.photoCardWrapper}>
        <View style={styles.photoCard}>
          <Image source={{ uri: photo }} style={styles.photo} />
          {name ? (
            <Text
              style={styles.photoTitle}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {name}
            </Text>
          ) : null}
        </View>
      </View>
    </Animated.View>
  );
}

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
  }, [userDoc]);

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
            //first photo if exists
            photo: s.photos?.[0] ?? null,
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
      provider={PROVIDER_GOOGLE}
      mapType={"satellite"}
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
          anchor={{ x: 0.5, y: 1 }} // bottom center is where the arrow tip is
        >
          {m.photo ? (
            <StepPhotoMarker photo={m.photo} name={m.name} />
          ) : (
            <View style={styles.dot} />
          )}
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
                You are here
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
  markerWithCard: {
    alignItems: "center",
  },
  photoCard: {
    backgroundColor: "white",
    borderRadius: 10,
    overflow: "hidden",
    width: CARD_WIDTH,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4, // Android shadow
  },
  photo: {
    width: "100%",
    height: CARD_HEIGHT,
  },
  photoTitle: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
  },
  cardArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: ARROW_HEIGHT,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "white",
  },
  markerRoot: {
    alignItems: "center",
    justifyContent: "flex-end",
    height: CARD_HEIGHT + ARROW_HEIGHT + 8, // enough to contain card + arrow
    width: CARD_WIDTH,
  },

  // Card sits above the arrow, but still inside markerRoot
  photoCardWrapper: {
    position: "absolute",
    bottom: ARROW_HEIGHT, // adjust this to move card up/down
  },
});
