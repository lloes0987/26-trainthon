import type { LatLng } from "./location";
import type { StationCandidate } from "./types";
import {
  calculateCentroid,
  haversineDistance,
  recommendStations,
} from "./location";

const GEOCODE_URL =
  "https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode";
const REVERSE_GEOCODE_URL =
  "https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/gc";

function getNaverCredentials() {
  const clientId = process.env.NAVER_MAP_CLIENT_ID;
  const clientSecret = process.env.NAVER_MAP_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

function naverHeaders(clientId: string, clientSecret: string) {
  return {
    "X-NCP-APIGW-API-KEY-ID": clientId,
    "X-NCP-APIGW-API-KEY": clientSecret,
    Accept: "application/json",
  };
}

export function isNaverMapsConfigured(): boolean {
  return getNaverCredentials() !== null;
}

function mapGeocodeItem(
  item: { x: string; y: string; roadAddress?: string; jibunAddress?: string },
  fallback: string,
): LatLng & { address: string } {
  return {
    lat: parseFloat(item.y),
    lng: parseFloat(item.x),
    address: item.roadAddress || item.jibunAddress || fallback,
  };
}

export async function naverGeocodeMany(
  query: string,
  count = 5,
): Promise<Array<LatLng & { address: string }>> {
  const creds = getNaverCredentials();
  if (!creds) return [];

  const url = `${GEOCODE_URL}?query=${encodeURIComponent(query)}&count=${count}`;
  const res = await fetch(url, {
    headers: naverHeaders(creds.clientId, creds.clientSecret),
  });

  if (!res.ok) return [];

  const data = await res.json();
  const items = data.addresses ?? [];
  return items.map((item: { x: string; y: string; roadAddress?: string; jibunAddress?: string }) =>
    mapGeocodeItem(item, query),
  );
}

export async function naverGeocode(
  query: string,
): Promise<(LatLng & { address: string }) | null> {
  const results = await naverGeocodeMany(query, 1);
  return results[0] ?? null;
}

export async function naverReverseGeocode(
  lat: number,
  lng: number,
): Promise<string | null> {
  const creds = getNaverCredentials();
  if (!creds) return null;

  const url = `${REVERSE_GEOCODE_URL}?coords=${lng},${lat}&output=json&orders=roadaddr,addr`;
  const res = await fetch(url, {
    headers: naverHeaders(creds.clientId, creds.clientSecret),
  });

  if (!res.ok) return null;

  const data = await res.json();
  const results = data.results;
  if (!results?.length) return null;

  for (const r of results) {
    if (r.name === "roadaddr" && r.land?.addition0?.value) {
      return r.land.addition0.value;
    }
  }

  const addr = results.find((r: { name: string }) => r.name === "addr");
  if (addr?.region) {
    const { area1, area2, area3 } = addr.region;
    return [area1?.name, area2?.name, area3?.name].filter(Boolean).join(" ");
  }

  return null;
}

export async function recommendMidpointWithNaver(
  locations: LatLng[],
  limit = 3,
): Promise<StationCandidate[]> {
  if (locations.length === 0) return [];

  const midpoint = calculateCentroid(locations);
  const extras: Array<{ name: string; lat: number; lng: number }> = [];
  const areaName = await naverReverseGeocode(midpoint.lat, midpoint.lng);

  if (areaName) {
    const token = areaName.split(/\s+/).pop()?.replace(/역$/, "") ?? "";
    if (token.length >= 2) {
      const nearby = await naverGeocodeMany(`${token}역`, 4);
      for (const place of nearby) {
        if (haversineDistance(place, midpoint) > 2.5) continue;
        extras.push({
          name: place.address.includes("역") ? place.address : `${token}역`,
          lat: place.lat,
          lng: place.lng,
        });
      }
    }
  }

  return recommendStations(locations, limit, extras);
}
