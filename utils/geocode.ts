import Constants from "expo-constants";

type GeocodeResult = { lat: number; lng: number; name?: string } | null;

const TOKEN =
  (Constants.expoConfig as any)?.extra?.MAPBOX_TOKEN ||
  (Constants.manifest as any)?.extra?.MAPBOX_TOKEN; // fallback for classic

const COUNTRY_BIAS = "CA,US"; // project purpose

export async function geocodePlace(place: string): Promise<GeocodeResult> {
  if (!TOKEN) {
    console.warn("MAPBOX_TOKEN missing in app config");
    return null;
  }
  const base = "https://api.mapbox.com/geocoding/v5/mapbox.places";
  const query = encodeURIComponent(place.trim());
  const url =
    `${base}/${query}.json` +
    `?access_token=${TOKEN}` +
    `&limit=1&types=place,locality,poi` +
    `&language=en` +
    `&country=${COUNTRY_BIAS}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn("Mapbox geocode HTTP error:", res.status);
      return null;
    }
    const data = await res.json();
    const f = data?.features?.[0];
    if (!f?.center || f.center.length < 2) return null;
    // Mapbox returns [lng, lat]
    const [lng, lat] = f.center;
    const name = f.place_name as string | undefined;
    return { lat, lng, name };
  } catch (e) {
    console.warn("Mapbox geocode failed:", e);
    return null;
  }
}
