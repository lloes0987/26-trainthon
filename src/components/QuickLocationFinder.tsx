"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { HiPlus } from "react-icons/hi2";
import { geocodeOnly, recommendMidpoint } from "@/lib/actions/location";
import { createLocationMeetup } from "@/lib/actions/room";
import { markSharePrompt } from "@/lib/share-url";
import NaverPlaceMap, {
  type MapMarker,
  type MapPlace,
} from "@/components/NaverPlaceMap";
import type { StationCandidate } from "@/lib/types";

type EntryMode = "self" | "invite";

interface Entry {
  id: string;
  name: string;
  address: string;
  lat?: number;
  lng?: number;
}

function newEntry(): Entry {
  return { id: crypto.randomUUID(), name: "", address: "" };
}

export default function QuickLocationFinder() {
  const router = useRouter();
  const [entryMode, setEntryMode] = useState<EntryMode>("self");
  const [inviteTitle, setInviteTitle] = useState("");
  const [entries, setEntries] = useState<Entry[]>([newEntry(), newEntry()]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [recommendations, setRecommendations] = useState<StationCandidate[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const activeId = selectedId || entries[0]?.id;
  const activeIndex = Math.max(
    0,
    entries.findIndex((entry) => entry.id === activeId),
  );

  const markers = useMemo<MapMarker[]>(() => {
    const origins = entries.flatMap((entry, index) =>
      entry.lat != null && entry.lng != null
        ? [
            {
              label: String(index + 1),
              kind: "origin" as const,
              address: entry.address,
              lat: entry.lat,
              lng: entry.lng,
            },
          ]
        : [],
    );
    const recs = recommendations.map((place, index) => ({
      label: `추천${index + 1}`,
      kind: "recommend" as const,
      address: place.name,
      lat: place.lat,
      lng: place.lng,
    }));
    return [...origins, ...recs];
  }, [entries, recommendations]);

  const updateEntry = (id: string, patch: Partial<Entry>) => {
    setEntries((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
    );
    setError("");
    setRecommendations([]);
  };

  const addEntry = () => {
    const next = newEntry();
    setEntries((prev) => [...prev, next]);
    setSelectedId(next.id);
  };

  const removeEntry = (id: string) => {
    if (entries.length <= 2) return;
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
    if (activeId === id) setSelectedId("");
    setRecommendations([]);
  };

  const handleMapPick = (place: MapPlace) => {
    const targetId = activeId || entries[0].id;
    updateEntry(targetId, {
      address: place.address,
      lat: place.lat,
      lng: place.lng,
    });
  };

  const handleRecommend = async () => {
    const filled = entries.filter((e) => e.address.trim());
    if (filled.length < 2) {
      setError("출발지를 2곳 이상 입력해주세요.");
      return;
    }

    setLoading(true);
    setError("");
    setRecommendations([]);

    const coords: Array<{ lat: number; lng: number }> = [];

    for (const entry of filled) {
      if (entry.lat != null && entry.lng != null) {
        coords.push({ lat: entry.lat, lng: entry.lng });
        continue;
      }

      const result = await geocodeOnly(entry.address.trim());
      if ("error" in result) {
        setError(
          `${entry.name || "출발지"} 주소를 찾을 수 없습니다: ${entry.address}`,
        );
        setLoading(false);
        return;
      }
      updateEntry(entry.id, {
        address: result.location.address,
        lat: result.location.lat,
        lng: result.location.lng,
      });
      coords.push({ lat: result.location.lat, lng: result.location.lng });
    }

    const midpoint = await recommendMidpoint(coords);
    if (midpoint.error) {
      setError(midpoint.error);
      setLoading(false);
      return;
    }

    setRecommendations(midpoint.recommendations ?? []);
    setLoading(false);
  };

  const handleCreateInvite = async () => {
    setLoading(true);
    setError("");
    const result = await createLocationMeetup(inviteTitle);
    if ("error" in result) {
      setError(result.error ?? "초대 링크를 만들지 못했어요.");
      setLoading(false);
      return;
    }
    markSharePrompt(result.shareCode!);
    router.push(`/room/${result.shareCode}`);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="cute-hero relative shrink-0 bg-[#003876] px-5 py-2.5 text-center text-white">
        <p className="text-[11px] font-medium text-white/75">여기서</p>
        <h1 className="font-cute text-lg leading-tight">중간 지점 찾기</h1>
      </header>

      <div className="cute-sheet -mt-2 flex-1 space-y-4 px-5 pb-8 pt-4">
        <p className="text-xs text-muted">
          출발지는 내가 직접 넣거나, 친구에게 링크를 보내 입력받을 수 있어요
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
              setEntryMode("invite");
              setError("");
            }}
            className={`flex-1 rounded-full px-3 py-1.5 text-sm font-semibold ${
              entryMode === "invite" ? "bg-brand text-white" : "text-muted"
            }`}
          >
            친구 초대
          </button>
        </div>

        {entryMode === "invite" ? (
          <div className="space-y-3">
            <p className="text-sm leading-relaxed text-brand-dark">
              링크를 공유하면 친구가 자기 출발지를 직접 넣어요. 두 곳 이상
              모이면 중간 장소를 추천해요.
            </p>
            <input
              type="text"
              value={inviteTitle}
              onChange={(e) => setInviteTitle(e.target.value)}
              placeholder="약속 이름 (선택)"
              className="input-field"
            />
            {error && <p className="text-sm text-coral">{error}</p>}
            <button
              type="button"
              onClick={handleCreateInvite}
              disabled={loading}
              className="btn-cta w-full"
            >
              {loading ? "만드는 중..." : "초대 링크 만들기"}
            </button>
          </div>
        ) : (
          <>
        <NaverPlaceMap
          selectedLabel={`출발지 ${activeIndex + 1}`}
          markers={markers}
          onPick={handleMapPick}
        />

        <div className="flex flex-wrap gap-2">
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
        </div>

        {entries.map((entry, index) => (
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
        ))}

        <button
          type="button"
          onClick={addEntry}
          className="btn-secondary inline-flex w-full items-center justify-center gap-1.5"
        >
          <HiPlus className="h-4 w-4" aria-hidden />
          출발지 추가
        </button>

        {error && <p className="text-sm text-coral">{error}</p>}

        <button
          type="button"
          onClick={handleRecommend}
          disabled={loading}
          className="btn-cta w-full"
        >
          {loading ? "찾는 중..." : "중간 장소 추천하기"}
        </button>

        {recommendations.length > 0 && (
          <div className="card p-5">
            <h2 className="font-bold text-brand-dark">추천 중간 장소</h2>
            <ol className="mt-3 space-y-2">
              {recommendations.map((place, i) => (
                <li
                  key={`${place.name}-${i}`}
                  className="rounded-xl bg-brand-soft px-4 py-3 text-sm"
                >
                  <span className="font-medium text-foreground">
                    {i + 1}. {place.name}
                  </span>
                  {place.avgDistance > 0 && (
                    <span className="ml-2 text-xs text-muted">
                      (평균 {place.avgDistance.toFixed(1)}km)
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}
