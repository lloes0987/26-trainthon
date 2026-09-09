"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import NaverPlaceMap, {
  type MapMarker,
  type MapPlace,
} from "@/components/NaverPlaceMap";
import ShareLinkBar from "@/components/ShareLinkBar";
import SharePromptModal from "@/components/SharePromptModal";
import {
  geocodeAndSaveLocation,
  recommendMidpoint,
} from "@/lib/actions/location";
import { joinRoom, saveFinalDecision, saveLocation } from "@/lib/actions/room";
import {
  getStoredParticipantId,
  setStoredParticipantId,
  setStoredSessionToken,
} from "@/lib/session";
import { consumeSharePrompt } from "@/lib/share-url";
import type {
  Participant,
  ParticipantLocation,
  Room,
  StationCandidate,
} from "@/lib/types";
import { roomKind, STATUS_LABELS } from "@/lib/types";

interface LocationClientProps {
  room: Room;
  initialParticipants: Participant[];
  initialLocations: ParticipantLocation[];
  shareUrl: string;
  sharePath: string;
}

export default function LocationClient({
  room,
  initialParticipants,
  initialLocations,
  shareUrl,
  sharePath,
}: LocationClientProps) {
  const router = useRouter();
  const isLocationOnly = roomKind(room) === "location";
  const [participants, setParticipants] =
    useState<Participant[]>(initialParticipants);
  const [locations, setLocations] =
    useState<ParticipantLocation[]>(initialLocations);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [displayId, setDisplayId] = useState("");
  const [address, setAddress] = useState("");
  const [picked, setPicked] = useState<MapPlace | null>(null);
  const [recommendations, setRecommendations] = useState<StationCandidate[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSharePrompt, setShowSharePrompt] = useState(false);

  useEffect(() => {
    setParticipants(initialParticipants);
    setLocations(initialLocations);
  }, [initialParticipants, initialLocations]);

  useEffect(() => {
    const storedId = getStoredParticipantId(room.share_code);
    if (storedId) {
      const p = initialParticipants.find((l) => l.id === storedId);
      if (p) {
        setParticipantId(storedId);
        setDisplayId(p.display_id);
        setSignedIn(true);
      }
      const loc = initialLocations.find((l) => l.participant_id === storedId);
      if (loc) {
        setAddress(loc.address);
        setPicked({ address: loc.address, lat: loc.lat, lng: loc.lng });
      }
    }
  }, [room.share_code, initialParticipants, initialLocations]);

  useEffect(() => {
    if (consumeSharePrompt(room.share_code)) {
      setShowSharePrompt(true);
    }
  }, [room.share_code]);

  const markers = useMemo<MapMarker[]>(() => {
    const origins = locations.map((loc, index) => {
      const person = participants.find((p) => p.id === loc.participant_id);
      return {
        label: person?.display_id?.slice(0, 3) || String(index + 1),
        kind: "origin" as const,
        address: loc.address,
        lat: loc.lat,
        lng: loc.lng,
      };
    });
    const recs = recommendations.map((place, index) => ({
      label: `추천${index + 1}`,
      kind: "recommend" as const,
      address: place.name,
      lat: place.lat,
      lng: place.lng,
    }));
    return [...origins, ...recs];
  }, [locations, participants, recommendations]);

  const persistPlace = async (place: MapPlace, id = participantId) => {
    if (!id) return;
    const result = await saveLocation(
      id,
      place.address,
      place.lat,
      place.lng,
    );
    if ("error" in result) {
      setError(result.error ?? "출발지를 저장하지 못했어요.");
      return;
    }

    setLocations((prev) => {
      const filtered = prev.filter((l) => l.participant_id !== id);
      return [
        ...filtered,
        {
          id: crypto.randomUUID(),
          participant_id: id,
          address: place.address,
          lat: place.lat,
          lng: place.lng,
        },
      ];
    });
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "completed" } : p)),
    );
    setAddress(place.address);
    setPicked(place);
    setRecommendations([]);
    setError("");
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.set("roomId", room.id);
    formData.set("displayId", displayId);

    const result = await joinRoom(formData);
    if ("error" in result) {
      setError(result.error ?? "참여에 실패했습니다.");
      setLoading(false);
      return;
    }

    const newParticipant: Participant = {
      id: result.participantId!,
      room_id: room.id,
      display_id: displayId.trim(),
      status: "in_progress",
      joined_at: new Date().toISOString(),
    };
    setParticipants((prev) => {
      if (prev.some((p) => p.id === newParticipant.id)) {
        return prev.map((p) =>
          p.id === newParticipant.id ? { ...p, status: "in_progress" } : p,
        );
      }
      return [...prev, newParticipant];
    });
    setStoredParticipantId(room.share_code, result.participantId!);
    setStoredSessionToken(room.share_code, result.sessionToken!);
    setParticipantId(result.participantId!);
    setSignedIn(true);
    setLoading(false);

    if (picked) {
      await persistPlace(picked, result.participantId!);
    }
  };

  const handleMapPick = async (place: MapPlace) => {
    setPicked(place);
    setAddress(place.address);
    setError("");
    if (!participantId) {
      setError("먼저 이름을 넣고 참여해주세요.");
      return;
    }
    setLoading(true);
    await persistPlace(place);
    setLoading(false);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!participantId || !address.trim()) return;

    setLoading(true);
    setError("");

    if (picked && picked.address === address.trim()) {
      await persistPlace(picked);
      setLoading(false);
      return;
    }

    const result = await geocodeAndSaveLocation(participantId, address.trim());
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setLocations((prev) => {
      const filtered = prev.filter((l) => l.participant_id !== participantId);
      return [
        ...filtered,
        {
          id: crypto.randomUUID(),
          participant_id: participantId,
          address: result.location!.address,
          lat: result.location!.lat,
          lng: result.location!.lng,
        },
      ];
    });
    setAddress(result.location!.address);
    setPicked(result.location!);
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === participantId ? { ...p, status: "completed" } : p,
      ),
    );
    setRecommendations([]);
    setLoading(false);
  };

  const handleRecommend = async () => {
    const coords = locations.map((l) => ({ lat: l.lat, lng: l.lng }));
    setLoading(true);
    setError("");

    const result = await recommendMidpoint(coords);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setRecommendations(result.recommendations ?? []);
    setLoading(false);
  };

  const handleSelectPlace = async (place: string) => {
    await saveFinalDecision(room.id, place);
    setError("");
    if (!isLocationOnly) {
      router.push(`/room/${room.share_code}`);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="cute-hero relative shrink-0 bg-[#003876] px-5 py-2.5 text-center text-white">
        <p className="text-[11px] font-medium text-white/75">여기서</p>
        <h1 className="font-cute text-lg leading-tight">{room.title}</h1>
      </header>

      <div className="cute-sheet -mt-2 flex-1 space-y-4 px-5 pb-24 pt-4">
        <p className="text-xs text-muted">
          링크를 받은 친구가 자기 출발지를 넣으면, 중간 장소를 함께 찾아요
        </p>

        {!signedIn ? (
          <form onSubmit={handleJoin} className="flex gap-2">
            <input
              type="text"
              value={displayId}
              onChange={(e) => setDisplayId(e.target.value)}
              placeholder="이름"
              className="input-field mt-0 min-h-11 flex-1"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-h-11 items-center rounded-xl bg-brand px-4 text-sm font-semibold text-white"
            >
              {loading ? "입장 중" : "참여"}
            </button>
          </form>
        ) : (
          <p className="text-sm font-semibold text-brand-dark">
            {displayId}의 출발지
          </p>
        )}

        <NaverPlaceMap
          selectedLabel={signedIn ? `${displayId} 출발지` : "내 출발지"}
          markers={markers}
          onPick={handleMapPick}
        />

        <form onSubmit={handleSaveAddress} className="space-y-2">
          <input
            type="text"
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              setPicked(null);
            }}
            placeholder="주소 또는 역 이름"
            className="input-field"
          />
          <button
            type="submit"
            disabled={loading || !signedIn || !address.trim()}
            className="btn-primary w-full"
          >
            {loading ? "저장 중..." : "출발지 저장"}
          </button>
        </form>

        {error && <p className="text-sm text-coral">{error}</p>}

        <div className="card space-y-2 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-brand-dark">
              실시간 출발지 현황
            </h2>
            <button
              type="button"
              onClick={() => router.refresh()}
              className="text-xs font-semibold text-brand"
            >
              새로고침
            </button>
          </div>
          {participants.length === 0 ? (
            <p className="text-xs text-muted">아직 참여한 친구가 없어요</p>
          ) : (
            participants.map((p) => {
              const loc = locations.find((l) => l.participant_id === p.id);
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand-dark">
                    {p.display_id}
                  </span>
                  <span className="min-w-0 truncate text-right text-muted">
                    {loc ? loc.address : STATUS_LABELS[p.status]}
                  </span>
                </div>
              );
            })
          )}
        </div>

        <button
          type="button"
          onClick={handleRecommend}
          disabled={locations.length < 2 || loading}
          className="btn-cta w-full"
        >
          {loading ? "찾는 중..." : "중간 장소 추천하기"}
        </button>

        {recommendations.length > 0 && (
          <div className="card p-5">
            <h3 className="font-bold text-brand-dark">추천 중간 장소</h3>
            <ol className="mt-3 space-y-2">
              {recommendations.map((station, i) => (
                <li
                  key={`${station.name}-${i}`}
                  className="flex items-center justify-between rounded-xl bg-brand-soft px-3 py-2.5 text-sm"
                >
                  <span className="font-medium text-foreground">
                    {i + 1}. {station.name}
                    {station.avgDistance > 0 && (
                      <span className="ml-2 text-xs text-muted">
                        (평균 {station.avgDistance.toFixed(1)}km)
                      </span>
                    )}
                  </span>
                  {!isLocationOnly && (
                    <button
                      type="button"
                      onClick={() => handleSelectPlace(station.name)}
                      className="btn-secondary text-xs"
                    >
                      확정
                    </button>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}

        {!isLocationOnly && (
          <button
            type="button"
            onClick={() => router.push(`/room/${room.share_code}`)}
            className="text-sm text-muted hover:text-brand"
          >
            ← 약속방으로 돌아가기
          </button>
        )}
      </div>

      {!showSharePrompt && (
        <div className="sticky bottom-0 z-40 border-t border-brand-light bg-white/95 p-3">
          <ShareLinkBar
            url={shareUrl}
            title={room.title}
            sharePath={sharePath}
            intent="location"
          />
        </div>
      )}

      {showSharePrompt && (
        <SharePromptModal
          url={shareUrl}
          title={room.title}
          sharePath={sharePath}
          intent="location"
          onClose={() => setShowSharePrompt(false)}
        />
      )}
    </div>
  );
}
