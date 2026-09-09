"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { HiMagnifyingGlass, HiOutlineViewfinderCircle } from "react-icons/hi2";
import { searchKnownPlaces } from "@/lib/location";
import type {
  NaverMapInstance,
  NaverMarkerInstance,
} from "@/types/naver-maps";

export type MapPlace = {
  address: string;
  lat: number;
  lng: number;
};

export type MapMarker = MapPlace & {
  label: string;
  kind: "origin" | "recommend";
};

const SEOUL = { lat: 37.5665, lng: 126.978 };

function placeFromCoords(lat: number, lng: number): MapPlace {
  return { address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, lat, lng };
}

function reverseGeocode(
  lat: number,
  lng: number,
  onPlace: (place: MapPlace) => void,
) {
  const maps = window.naver?.maps;
  const service = maps?.Service;
  if (!maps || !service) {
    onPlace(placeFromCoords(lat, lng));
    return;
  }

  service.reverseGeocode(
    {
      coords: new maps.LatLng(lat, lng),
      orders: [service.OrderType.ROAD_ADDR, service.OrderType.ADDR].join(","),
    },
    (status, response) => {
      const address =
        status === service.Status.OK
          ? response.v2?.address?.roadAddress ||
            response.v2?.address?.jibunAddress
          : null;
      onPlace({
        address: address || placeFromCoords(lat, lng).address,
        lat,
        lng,
      });
    },
  );
}

function geolocationErrorMessage(error: GeolocationPositionError) {
  if (error.code === error.PERMISSION_DENIED) {
    return "위치 권한이 필요해요. 브라우저에서 허용해주세요.";
  }
  if (error.code === error.POSITION_UNAVAILABLE) {
    return "현재 위치를 찾을 수 없어요. 잠시 후 다시 시도해주세요.";
  }
  return "위치를 가져오는 데 시간이 너무 걸렸어요. 다시 시도해주세요.";
}

function markerHtml(label: string, kind: MapMarker["kind"]) {
  const bg = kind === "recommend" ? "#fdb913" : "#003876";
  const color = kind === "recommend" ? "#003876" : "#fff";
  return `<div style="min-width:28px;height:28px;padding:0 8px;border-radius:999px;background:${bg};color:${color};font:700 12px/28px sans-serif;text-align:center;box-shadow:0 4px 10px rgba(0,56,118,.28);white-space:nowrap">${label}</div>`;
}

export default function NaverPlaceMap({
  selectedLabel,
  markers,
  onPick,
}: {
  selectedLabel: string;
  markers: MapMarker[];
  onPick: (place: MapPlace) => void;
}) {
  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<NaverMapInstance | null>(null);
  const markerRefs = useRef<NaverMarkerInstance[]>([]);
  const onPickRef = useRef(onPick);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MapPlace[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [scriptError, setScriptError] = useState("");
  const [mapReady, setMapReady] = useState(0);

  onPickRef.current = onPick;

  const setupMap = () => {
    const el = containerRef.current;
    const maps = window.naver?.maps;
    if (!el || !maps) return;

    el.replaceChildren();
    const map = new maps.Map(el, {
      center: new maps.LatLng(SEOUL.lat, SEOUL.lng),
      zoom: 12,
      scaleControl: false,
      logoControl: true,
      mapDataControl: false,
      zoomControl: true,
      zoomControlOptions: { position: maps.Position.TOP_RIGHT },
    });
    mapRef.current = map;

    maps.Event.addListener(map, "click", (event) => {
      reverseGeocode(event.coord.y, event.coord.x, onPickRef.current);
    });
    setMapReady((value) => value + 1);
  };

  useEffect(() => {
    const maps = window.naver?.maps;
    const map = mapRef.current;
    if (!maps || !map) return;

    markerRefs.current.forEach((marker) => marker.setMap(null));
    markerRefs.current = markers.map(
      (point) =>
        new maps.Marker({
          map,
          position: new maps.LatLng(point.lat, point.lng),
          icon: {
            content: markerHtml(point.label, point.kind),
            anchor: new maps.Point(14, 14),
          },
          zIndex: point.kind === "recommend" ? 20 : 10,
        }),
    );

    if (markers.length === 1) {
      map.setCenter(new maps.LatLng(markers[0].lat, markers[0].lng));
      map.setZoom(14);
      return;
    }

    if (markers.length > 1) {
      const bounds = new maps.LatLngBounds();
      markers.forEach((point) =>
        bounds.extend(new maps.LatLng(point.lat, point.lng)),
      );
      map.fitBounds(bounds, { top: 48, right: 48, bottom: 48, left: 48 });
    }
  }, [markers, mapReady]);

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSearchError("검색어를 두 글자 이상 입력해주세요.");
      return;
    }

    const known = searchKnownPlaces(trimmed);
    const service = window.naver?.maps.Service;

    const finish = (places: MapPlace[]) => {
      const seen = new Set<string>();
      const merged = places.filter((place) => {
        const key = `${place.address}-${place.lat.toFixed(4)}-${place.lng.toFixed(4)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setSearching(false);
      if (merged.length === 0) {
        setResults([]);
        setSearchError("검색 결과가 없습니다. 역 이름이나 주소를 다시 입력해주세요.");
        return;
      }
      setResults(merged);
    };

    setSearching(true);
    setSearchError("");

    if (!service) {
      finish(known);
      return;
    }

    service.geocode({ query: trimmed }, (status, response) => {
      const fromAddress =
        status === service.Status.OK
          ? (response.v2?.addresses ?? []).map((item) => ({
              address: item.roadAddress || item.jibunAddress || trimmed,
              lat: parseFloat(item.y),
              lng: parseFloat(item.x),
            }))
          : [];
      finish([...known, ...fromAddress]);
    });
  };

  const handleSelect = (place: MapPlace) => {
    setResults([]);
    setQuery(place.address);
    setSearchError("");
    onPick(place);
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setSearchError("이 브라우저에서는 위치를 가져올 수 없어요.");
      return;
    }

    setLocating(true);
    setSearchError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        reverseGeocode(
          position.coords.latitude,
          position.coords.longitude,
          (place) => {
            setQuery(place.address);
            setResults([]);
            onPick(place);
            setLocating(false);
          },
        );
      },
      (error) => {
        setLocating(false);
        setSearchError(geolocationErrorMessage(error));
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30_000 },
    );
  };

  if (!clientId) {
    return (
      <div className="card px-4 py-3 text-sm text-muted">
        네이버 지도 키가 없어 지도를 열 수 없어요. 주소나 역 이름으로도 찾을 수
        있어요.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSearchError("");
          }}
          placeholder="역·주소 검색 (예: 서울역)"
          className="input-field mt-0 min-h-11 flex-1"
        />
        <button
          type="submit"
          disabled={searching}
          className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-xl bg-brand px-3 text-sm font-semibold text-white"
        >
          <HiMagnifyingGlass className="h-4 w-4" aria-hidden />
          {searching ? "찾는 중" : "검색"}
        </button>
      </form>
      <button
        type="button"
        onClick={handleLocateMe}
        disabled={locating}
        className="mx-auto flex items-center justify-center gap-1.5 py-1 text-sm font-semibold text-brand disabled:opacity-60"
      >
        <HiOutlineViewfinderCircle className="h-4 w-4" aria-hidden />
        {locating ? "위치를 찾는 중..." : "내위치 불러오기"}
      </button>
      <p className="text-[11px] text-muted">
        검색하거나 내위치를 불러오면{" "}
        <span className="font-semibold text-brand-dark">{selectedLabel}</span>
        에 넣어요
      </p>
      {searchError && <p className="text-xs text-coral">{searchError}</p>}
      {results.length > 0 && (
        <ul className="card max-h-40 overflow-y-auto py-1">
          {results.map((place) => (
            <li key={`${place.address}-${place.lat}`}>
              <button
                type="button"
                onClick={() => handleSelect(place)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-brand-soft"
              >
                {place.address}
              </button>
            </li>
          ))}
        </ul>
      )}
      {scriptError && <p className="text-xs text-coral">{scriptError}</p>}
      <Script
        src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}&submodules=geocoder`}
        strategy="afterInteractive"
        onReady={setupMap}
        onError={() =>
          setScriptError("네이버 지도를 불러오지 못했어요. 도메인 등록을 확인해주세요.")
        }
      />
      <div
        ref={containerRef}
        className="h-56 w-full overflow-hidden rounded-2xl border border-brand-light bg-brand-soft"
      />
    </div>
  );
}
