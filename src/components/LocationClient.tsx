"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { HiPlus } from "react-icons/hi2";
import NaverPlaceMap, {
  type MapMarker,
  type MapPlace,
} from "@/components/NaverPlaceMap";
import ShareLinkBar from "@/components/ShareLinkBar";
import SharePromptModal from "@/components/SharePromptModal";
import {
  geocodeAndSaveLocation,
  geocodeOnly,
  recommendMidpoint,
} from "@/lib/actions/location";
import { joinRoom, saveFinalDecision, saveLocation } from "@/lib/actions/room";
import {
  getStoredParticipantId,
  setStoredParticipantId,
  setStoredSessionToken,
} from "@/lib/session";
import { writeRoomSnapshot } from "@/lib/room-snapshot";
import { buildRoomSharePath, consumeSharePrompt } from "@/lib/share-url";
import type {
  Participant,
  ParticipantLocation,
  Room,
  StationCandidate,
} from "@/lib/types";
import { roomKind, STATUS_LABELS } from "@/lib/types";
import PageHero from "@/components/PageHero";
import RoomFlowSteps from "@/components/RoomFlowSteps";

type EntryMode = "self" | "friends";

interface OriginEntry {
  id: string;
  name: string;
  address: string;
  lat?: number;
  lng?: number;
}

function newOrigin(): OriginEntry {
  return { id: crypto.randomUUID(), name: "", address: "" };
}

interface LocationClientProps {
  room: Room;
  initialParticipants: Participant[];
  initialLocations: ParticipantLocation[];
  encodedRoom?: string;
  shareUrl: string;
  sharePath: string;
}

export default function LocationClient({
  room,
  initialParticipants,
  initialLocations,
  encodedRoom,
  shareUrl,
  sharePath,
}: LocationClientProps) {
  const router = useRouter();
  const isLocationOnly = roomKind(room) === "location";
  const isBoth = room.enable_location && !isLocationOnly;
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
  const [sessionReady, setSessionReady] = useState(false);
  const [entryMode, setEntryMode] = useState<EntryMode>(
    isLocationOnly ? "self" : "friends",
  );
  const [entries, setEntries] = useState<OriginEntry[]>([
    newOrigin(),
    newOrigin(),
  ]);
  const [selectedId, setSelectedId] = useState("");

  const activeId = selectedId || entries[0]?.id;
  const activeIndex = Math.max(
    0,
    entries.findIndex((entry) => entry.id === activeId),
  );

  useEffect(() => {
    setParticipants(initialParticipants);
    setLocations(initialLocations);
    if (initialLocations.length === 0) return;
    setEntries((prev) => {
      const fromRoom = initialLocations.map((loc, index) => {
        const person = initialParticipants.find(
          (p) => p.id === loc.participant_id,
        );
        return {
          id: loc.id || prev[index]?.id || crypto.randomUUID(),
          name: person?.display_id ?? "",
          address: loc.address,
          lat: loc.lat,
          lng: loc.lng,
        };
      });
      return fromRoom.length >= 2
        ? fromRoom
        : [...fromRoom, ...Array.from({ length: 2 - fromRoom.length }, newOrigin)];
    });
  }, [initialParticipants, initialLocations]);

  useEffect(() => {
    writeRoomSnapshot({
      room,
      participants,
      slots: [],
      locations,
      decision: null,
    });
  }, [room, participants, locations]);

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
    setSessionReady(true);
  }, [room.share_code, initialParticipants, initialLocations]);

  useEffect(() => {
    if (!sessionReady || isLocationOnly || signedIn) return;
    router.replace(buildRoomSharePath(room.share_code, encodedRoom));
  }, [sessionReady, isLocationOnly, signedIn, room.share_code, encodedRoom, router]);

  useEffect(() => {
    if (consumeSharePrompt(room.share_code)) {
      setShowSharePrompt(true);
    }
  }, [room.share_code]);

  const markers = useMemo<MapMarker[]>(() => {
    const fromEntries = entries.flatMap((entry, index) =>
      entry.lat != null && entry.lng != null
        ? [
            {
              label: entry.name.trim().slice(0, 3) || String(index + 1),
              kind: "origin" as const,
              address: entry.address,
              lat: entry.lat,
              lng: entry.lng,
            },
          ]
        : [],
    );
    const fromFriends = locations.flatMap((loc, index) => {
      if (fromEntries.some((item) => item.address === loc.address)) return [];
      const person = participants.find((p) => p.id === loc.participant_id);
      return [
        {
          label: person?.display_id?.slice(0, 3) || String(index + 1),
          kind: "origin" as const,
          address: loc.address,
          lat: loc.lat,
          lng: loc.lng,
        },
      ];
    });
    const origins = entryMode === "self" ? fromEntries : fromFriends;
    const recs = recommendations.map((place, index) => ({
      label: `추천${index + 1}`,
      kind: "recommend" as const,
      address: place.name,
      lat: place.lat,
      lng: place.lng,
    }));
    return [...origins, ...recs];
  }, [entryMode, entries, locations, participants, recommendations]);

  const updateEntry = (id: string, patch: Partial<OriginEntry>) => {
    setEntries((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
    );
    setError("");
    setRecommendations([]);
  };

  const addEntry = () => {
    const next = newOrigin();
    setEntries((prev) => [...prev, next]);
    setSelectedId(next.id);
  };

  const removeEntry = (id: string) => {
    if (entries.length <= 2) return;
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
    if (activeId === id) setSelectedId("");
    setRecommendations([]);
  };

  const persistNamedPlace = async (name: string, place: MapPlace) => {
    const formData = new FormData();
    formData.set("roomId", room.id);
    formData.set("displayId", name.trim() || place.address);
    const joined = await joinRoom(formData);
    if ("error" in joined || !joined.participantId) {
      return { error: joined.error ?? "출발지를 저장하지 못했어요." };
    }

    const saved = await saveLocation(
      joined.participantId,
      place.address,
      place.lat,
      place.lng,
    );
    if ("error" in saved) {
      return { error: saved.error ?? "출발지를 저장하지 못했어요." };
    }

    const person: Participant = {
      id: joined.participantId,
      room_id: room.id,
      display_id: name.trim() || place.address,
      status: "completed",
      joined_at: new Date().toISOString(),
    };
    setParticipants((prev) => {
      if (prev.some((p) => p.id === person.id)) {
        return prev.map((p) => (p.id === person.id ? { ...p, status: "completed" } : p));
      }
      return [...prev, person];
    });
    setLocations((prev) => {
      const filtered = prev.filter((l) => l.participant_id !== person.id);
      return [
        ...filtered,
        {
          id: crypto.randomUUID(),
          participant_id: person.id,
          address: place.address,
          lat: place.lat,
          lng: place.lng,
        },
      ];
    });
    return { ok: true as const };
  };

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
    if (entryMode === "self") {
      const targetId = activeId || entries[0].id;
      updateEntry(targetId, {
        address: place.address,
        lat: place.lat,
        lng: place.lng,
      });
      return;
    }

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

  const handleAddPlace = (place: MapPlace) => {
    const empty = entries.find((entry) => !entry.address.trim());
    if (empty) {
      updateEntry(empty.id, {
        address: place.address,
        lat: place.lat,
        lng: place.lng,
      });
      setSelectedId(empty.id);
      return;
    }

    const next = {
      ...newOrigin(),
      address: place.address,
      lat: place.lat,
      lng: place.lng,
    };
    setEntries((prev) => [...prev, next]);
    setSelectedId(next.id);
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
    setLoading(true);
    setError("");

    const coords: Array<{ lat: number; lng: number }> = [];

    if (entryMode === "self") {
      const filled = entries.filter((entry) => entry.address.trim());
      if (filled.length < 2) {
        setError("출발지를 2곳 이상 입력해주세요.");
        setLoading(false);
        return;
      }

      for (const [index, entry] of filled.entries()) {
        let place = {
          address: entry.address.trim(),
          lat: entry.lat,
          lng: entry.lng,
        };
        if (place.lat == null || place.lng == null) {
          const geocoded = await geocodeOnly(place.address);
          if ("error" in geocoded || !geocoded.location) {
            setError(
              `${entry.name || `출발지 ${index + 1}`} 주소를 찾을 수 없습니다.`,
            );
            setLoading(false);
            return;
          }
          place = geocoded.location;
          updateEntry(entry.id, {
            address: place.address,
            lat: place.lat,
            lng: place.lng,
          });
        }

        coords.push({ lat: place.lat, lng: place.lng });
        const saved = await persistNamedPlace(
          entry.name.trim() || `출발지 ${index + 1}`,
          { address: place.address, lat: place.lat, lng: place.lng },
        );
        if ("error" in saved) {
          setError(saved.error ?? "출발지를 저장하지 못했어요.");
          setLoading(false);
          return;
        }
      }
    } else {
      coords.push(...locations.map((l) => ({ lat: l.lat, lng: l.lng })));
    }

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
      <PageHero
        badge="여기서"
        title={isLocationOnly ? room.title : "장소 등록"}
      >
        {!isLocationOnly && (
          <p className="mt-0.5 truncate text-center text-[11px] text-white/75">
            {room.title}
          </p>
        )}
      </PageHero>

      <div className="cute-sheet -mt-2 flex-1 space-y-4 px-5 pb-24 pt-4">
        {isBoth && (
          <RoomFlowSteps
            code={room.share_code}
            current="location"
            encodedRoom={encodedRoom}
          />
        )}
        <p className="text-xs text-muted">
          출발지는 내가 직접 넣거나, 친구가 링크에서 넣을 수 있어요
        </p>

        <div className="inline-flex w-full rounded-full bg-brand-soft p-1">
          <button
            type="button"
            onClick={() => {
              setEntryMode("self");
              setError("");
            }}
            className={`flex-1 rounded-full px-3 py-1.5 text-sm font-semibold ${
              entryMode === "self" ? "bg-brand text-white" : "text-muted"
            }`}
          >
            직접 입력
          </button>
          <button
            type="button"
            onClick={() => {
              setEntryMode("friends");
              setError("");
            }}
            className={`flex-1 rounded-full px-3 py-1.5 text-sm font-semibold ${
              entryMode === "friends" ? "bg-brand text-white" : "text-muted"
            }`}
          >
            친구와 함께
          </button>
        </div>

        {entryMode === "friends" &&
          (isBoth && !signedIn ? (
            <p className="text-sm text-muted">시간 등록으로 이동 중...</p>
          ) : !signedIn ? (
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
          ))}

        <NaverPlaceMap
          selectedLabel={
            entryMode === "self"
              ? `출발지 ${activeIndex + 1}`
              : signedIn
                ? `${displayId} 출발지`
                : "내 출발지"
          }
          markers={markers}
          onPick={handleMapPick}
          onAdd={entryMode === "self" ? handleAddPlace : undefined}
          toolbar={
            entryMode === "self" ? (
              <div className="flex flex-wrap items-center gap-2">
                {entries.map((entry, index) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setSelectedId(entry.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                      entry.id === activeId
                        ? "bg-brand text-white"
                        : "bg-brand-soft text-brand-dark"
                    }`}
                  >
                    출발지 {index + 1}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={addEntry}
                  aria-label="출발지 추가"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-brand-light text-brand"
                >
                  <HiPlus className="h-4 w-4" aria-hidden />
                </button>
              </div>
            ) : undefined
          }
        />

        {entryMode === "self" ? (
          entries.map((entry, index) => (
            <div key={entry.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-brand-dark">
                  출발지 {index + 1}
                </label>
                {entries.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeEntry(entry.id)}
                    className="text-xs text-muted hover:text-coral"
                  >
                    삭제
                  </button>
                )}
              </div>
              <input
                type="text"
                value={entry.name}
                onChange={(e) => updateEntry(entry.id, { name: e.target.value })}
                placeholder="이름 (선택)"
                className="input-field"
              />
              <input
                type="text"
                value={entry.address}
                onChange={(e) =>
                  updateEntry(entry.id, {
                    address: e.target.value,
                    lat: undefined,
                    lng: undefined,
                  })
                }
                placeholder="주소 또는 역 이름"
                className="input-field"
              />
            </div>
          ))
        ) : (
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
        )}

        {error && <p className="text-sm text-coral">{error}</p>}

        {entryMode === "friends" && (
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
        )}

        <button
          type="button"
          onClick={handleRecommend}
          disabled={
            loading ||
            (entryMode === "self"
              ? entries.filter((entry) => entry.address.trim()).length < 2
              : locations.length < 2)
          }
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

      </div>

      {!showSharePrompt && (
        <div className="sticky bottom-0 z-40 border-t border-brand-light bg-white/95 p-3">
          <ShareLinkBar
            url={shareUrl}
            title={room.title}
            sharePath={sharePath}
            intent={isBoth ? "both" : "location"}
          />
        </div>
      )}

      {showSharePrompt && (
        <SharePromptModal
          url={shareUrl}
          title={room.title}
          sharePath={sharePath}
          intent={isBoth ? "both" : "location"}
          onClose={() => setShowSharePrompt(false)}
        />
      )}
    </div>
  );
}
