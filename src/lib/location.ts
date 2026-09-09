import type { StationCandidate } from "./types";

export interface LatLng {
  lat: number;
  lng: number;
}

export const SEOUL_STATIONS: Array<{ name: string; lat: number; lng: number }> = [
  { name: "강남역", lat: 37.4979, lng: 127.0276 },
  { name: "홍대입구역", lat: 37.5572, lng: 126.9234 },
  { name: "신촌역", lat: 37.5559, lng: 126.9364 },
  { name: "건대입구역", lat: 37.5404, lng: 127.0692 },
  { name: "공덕역", lat: 37.5446, lng: 126.9513 },
  { name: "서울역", lat: 37.5547, lng: 126.9707 },
  { name: "잠실역", lat: 37.5133, lng: 127.1002 },
  { name: "사당역", lat: 37.4765, lng: 126.9816 },
  { name: "왕십리역", lat: 37.5612, lng: 127.0374 },
  { name: "종로3가역", lat: 37.571, lng: 126.9918 },
  { name: "을지로3가역", lat: 37.5663, lng: 126.9919 },
  { name: "신림역", lat: 37.4842, lng: 126.9297 },
  { name: "노원역", lat: 37.6551, lng: 127.0613 },
  { name: "합정역", lat: 37.5495, lng: 126.9139 },
  { name: "연세대학교", lat: 37.5665, lng: 126.938 },
  { name: "용산역", lat: 37.5299, lng: 126.9648 },
  { name: "시청역", lat: 37.5647, lng: 126.977 },
  { name: "명동역", lat: 37.5633, lng: 126.9822 },
  { name: "이태원역", lat: 37.5345, lng: 126.9946 },
  { name: "성수역", lat: 37.5446, lng: 127.0559 },
  { name: "선릉역", lat: 37.5045, lng: 127.049 },
  { name: "역삼역", lat: 37.5007, lng: 127.0365 },
  { name: "고속터미널역", lat: 37.5048, lng: 127.0046 },
  { name: "여의도역", lat: 37.5216, lng: 126.9242 },
  { name: "영등포역", lat: 37.5158, lng: 126.9074 },
  { name: "혜화역", lat: 37.5822, lng: 127.0018 },
  { name: "동대문역", lat: 37.571, lng: 127.0094 },
  { name: "신도림역", lat: 37.5088, lng: 126.8912 },
];

export function searchKnownPlaces(
  query: string,
): Array<LatLng & { address: string }> {
  const needle = query.trim().replace(/\s/g, "");
  if (needle.length < 2) return [];

  return SEOUL_STATIONS.filter((station) => {
    const name = station.name.replace(/\s/g, "");
    const bare = name.replace(/역$/, "");
    return (
      name.includes(needle) ||
      needle.includes(name) ||
      bare.includes(needle) ||
      needle.includes(bare)
    );
  }).map((station) => ({
    address: station.name,
    lat: station.lat,
    lng: station.lng,
  }));
}

export function haversineDistance(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function calculateCentroid(locations: LatLng[]): LatLng {
  const sum = locations.reduce(
    (acc, loc) => ({ lat: acc.lat + loc.lat, lng: acc.lng + loc.lng }),
    { lat: 0, lng: 0 },
  );
  return {
    lat: sum.lat / locations.length,
    lng: sum.lng / locations.length,
  };
}

export function recommendStations(
  locations: LatLng[],
  limit = 3,
): StationCandidate[] {
  if (locations.length === 0) return [];

  const centroid = calculateCentroid(locations);

  const candidates = SEOUL_STATIONS.map((station) => {
    const stationPoint = { lat: station.lat, lng: station.lng };
    const distances = locations.map((loc) =>
      haversineDistance(loc, stationPoint),
    );
    const avgDistance =
      distances.reduce((a, b) => a + b, 0) / distances.length;
    const maxDistance = Math.max(...distances);
    const centroidDist = haversineDistance(centroid, stationPoint);

    return {
      name: station.name,
      lat: station.lat,
      lng: station.lng,
      avgDistance,
      maxDistance,
      score: avgDistance + maxDistance * 0.3 + centroidDist * 0.2,
    };
  });

  candidates.sort((a, b) => a.score - b.score);

  return candidates.slice(0, limit).map(({ score: _, ...rest }) => rest);
}

export async function geocodeAddress(
  address: string,
): Promise<LatLng | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address + " 서울")}&format=json&limit=1`,
      { headers: { "User-Agent": "eonjeeodi/1.0" } },
    );
    const data = await res.json();
    if (data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}
