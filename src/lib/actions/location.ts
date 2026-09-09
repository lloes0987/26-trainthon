"use server";

import { mockGeocode } from "@/lib/mock-geocode";
import { recommendStations } from "@/lib/location";
import { saveLocation } from "@/lib/actions/room";
import {
  isNaverMapsConfigured,
  naverGeocode,
  naverGeocodeMany,
  naverReverseGeocode,
  recommendMidpointWithNaver,
} from "@/lib/naver-maps";

export async function geocodeOnly(address: string) {
  if (!address.trim()) {
    return { error: "출발지를 입력해주세요." as const };
  }

  if (isNaverMapsConfigured()) {
    const result = await naverGeocode(address.trim());
    if (result) return { location: result };
  }

  const result = mockGeocode(address.trim());
  if (!result) {
    return { error: "주소를 찾을 수 없습니다. 다시 입력해주세요." as const };
  }

  return { location: result };
}

export async function searchPlaces(query: string) {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return { error: "검색어를 두 글자 이상 입력해주세요." as const };
  }

  if (isNaverMapsConfigured()) {
    const results = await naverGeocodeMany(trimmed, 6);
    if (results.length === 0) {
      return { error: "검색 결과가 없습니다. 역 이름이나 주소를 다시 입력해주세요." as const };
    }
    return { results };
  }

  const fallback = mockGeocode(trimmed);
  if (!fallback) {
    return { error: "검색 결과가 없습니다." as const };
  }
  return { results: [fallback] };
}

export async function reverseGeocodePoint(lat: number, lng: number) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { error: "위치를 확인할 수 없습니다." as const };
  }

  const address = isNaverMapsConfigured()
    ? await naverReverseGeocode(lat, lng)
    : null;

  return {
    location: {
      lat,
      lng,
      address: address ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    },
  };
}

export async function geocodeAndSaveLocation(
  participantId: string,
  address: string,
) {
  const resolved = await geocodeOnly(address);
  if ("error" in resolved) return { error: resolved.error };

  const saveResult = await saveLocation(
    participantId,
    resolved.location.address,
    resolved.location.lat,
    resolved.location.lng,
  );
  if ("error" in saveResult) return { error: saveResult.error };

  return { success: true, location: resolved.location };
}

export async function recommendMidpoint(
  locations: Array<{ lat: number; lng: number }>,
) {
  if (locations.length < 2) {
    return { error: "2명 이상의 출발지가 필요합니다." };
  }

  if (isNaverMapsConfigured()) {
    return { recommendations: await recommendMidpointWithNaver(locations) };
  }

  return { recommendations: recommendStations(locations) };
}
