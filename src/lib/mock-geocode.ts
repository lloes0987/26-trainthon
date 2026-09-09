import { SEOUL_STATIONS } from "./location";

export function mockGeocode(
  address: string,
): { address: string; lat: number; lng: number } | null {
  const trimmed = address.trim();
  if (!trimmed) return null;

  const station = SEOUL_STATIONS.find(
    (s) =>
      trimmed.includes(s.name) ||
      s.name.includes(trimmed) ||
      trimmed.replace(/\s/g, "") === s.name.replace(/\s/g, ""),
  );

  if (station) {
    return { address: station.name, lat: station.lat, lng: station.lng };
  }

  const hash = [...trimmed].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return {
    address: trimmed,
    lat: 37.5665 + (hash % 50) / 1000,
    lng: 126.978 + (hash % 50) / 1000,
  };
}
