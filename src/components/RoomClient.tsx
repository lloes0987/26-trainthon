"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DatePoll from "@/components/DatePoll";
import TimeGrid from "@/components/TimeGrid";
import ShareLinkBar from "@/components/ShareLinkBar";
import SharePromptModal from "@/components/SharePromptModal";
import { joinRoom, saveAvailability } from "@/lib/actions/room";
import {
  getStoredParticipantId,
  setStoredParticipantId,
  setStoredSessionToken,
} from "@/lib/session";
import {
  calculateOverlaps,
  formatKoreanDate,
  formatTime12h,
  generateTimeSlots,
  getSlotCounts,
  slotKey,
} from "@/lib/time-slots";
import {
  DATE_ONLY_SLOT,
  roomKind,
  type AvailabilitySlot,
  type Participant,
  type Room,
} from "@/lib/types";
import { consumeSharePrompt } from "@/lib/share-url";
import { HiOutlineMapPin } from "react-icons/hi2";
import PageHero from "@/components/PageHero";

interface RoomClientProps {
  room: Room;
  initialParticipants: Participant[];
  initialSlots: AvailabilitySlot[];
  shareUrl: string;
  sharePath: string;
  datePage?: boolean;
}

type GridView = "personal" | "group";

export default function RoomClient({
  room,
  initialParticipants,
  initialSlots,
  shareUrl,
  sharePath,
  datePage = false,
}: RoomClientProps) {
  const router = useRouter();
  const [participants, setParticipants] =
    useState<Participant[]>(initialParticipants);
  const [allSlots, setAllSlots] = useState<AvailabilitySlot[]>(initialSlots);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [gridView, setGridView] = useState<GridView>("group");
  const [displayId, setDisplayId] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hoverInfo, setHoverInfo] = useState("");
  const [showSharePrompt, setShowSharePrompt] = useState(false);

  const dates = room.date_candidates;
  const isDateOnly = datePage || roomKind(room) === "date";
  const shareIntent = isDateOnly ? "date" : "time";
  const slotKind = isDateOnly ? "date" : "time";
  const times = useMemo(
    () =>
      isDateOnly
        ? [DATE_ONLY_SLOT]
        : generateTimeSlots(room.time_start, room.time_end),
    [isDateOnly, room.time_start, room.time_end],
  );

  useEffect(() => {
    const storedId = getStoredParticipantId(room.share_code);
    if (storedId) {
      const p = initialParticipants.find((x) => x.id === storedId);
      if (p) {
        setParticipantId(storedId);
        setDisplayId(p.display_id);
        setSignedIn(true);
        setGridView("personal");
      }
      const mySlots = initialSlots.filter((s) => {
        if (s.participant_id !== storedId) return false;
        const isDateSlot = s.time_slot === DATE_ONLY_SLOT;
        return isDateOnly ? isDateSlot : !isDateSlot;
      });
      setSelected(
        new Set(mySlots.map((s) => slotKey(s.slot_date, s.time_slot))),
      );
    }
  }, [room.share_code, initialParticipants, initialSlots, isDateOnly]);

  useEffect(() => {
    if (consumeSharePrompt(room.share_code)) {
      setShowSharePrompt(true);
    }
  }, [room.share_code]);

  const availabilityByParticipant = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const slot of allSlots) {
      if (!slot.available) continue;
      const isDateSlot = slot.time_slot === DATE_ONLY_SLOT;
      if (isDateOnly !== isDateSlot) continue;
      const set = map.get(slot.participant_id) ?? new Set();
      set.add(slotKey(slot.slot_date, slot.time_slot));
      map.set(slot.participant_id, set);
    }
    return map;
  }, [allSlots, isDateOnly]);

  const completedParticipants = participants.filter(
    (p) => p.status === "completed",
  );

  const slotCounts = useMemo(
    () => getSlotCounts(availabilityByParticipant),
    [availabilityByParticipant],
  );

  const heatmapMax = useMemo(() => {
    let max = 0;
    for (const count of slotCounts.values()) {
      max = Math.max(max, count);
    }
    return Math.max(max, completedParticipants.length, 1);
  }, [slotCounts, completedParticipants.length]);

  const overlaps = useMemo(
    () =>
      isDateOnly
        ? []
        : calculateOverlaps(
            dates,
            times,
            availabilityByParticipant,
            completedParticipants.length || participants.length,
          ),
    [
      isDateOnly,
      dates,
      times,
      availabilityByParticipant,
      completedParticipants.length,
      participants.length,
    ],
  );

  const handleSave = useCallback(
    async (slots: Set<string>) => {
      if (!participantId) return;
      const slotList = Array.from(slots).map((key) => {
        const [date, time] = key.split("|");
        return { date, time };
      });
      await saveAvailability(participantId, room.id, slotList, slotKind);

      setAllSlots((prev) => {
        const filtered = prev.filter((s) => {
          if (s.participant_id !== participantId) return true;
          const isDateSlot = s.time_slot === DATE_ONLY_SLOT;
          return slotKind === "date" ? !isDateSlot : isDateSlot;
        });
        const next = slotList.map((s) => ({
          id: crypto.randomUUID(),
          room_id: room.id,
          participant_id: participantId,
          slot_date: s.date,
          time_slot: s.time,
          available: true,
        }));
        return [...filtered, ...next];
      });
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === participantId ? { ...p, status: "completed" } : p,
        ),
      );
    },
    [participantId, room.id, slotKind],
  );

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
    setGridView("personal");
    setLoading(false);
  };

  const handleSelectionChange = (next: Set<string>) => {
    setSelected(next);
    if (signedIn && participantId) handleSave(next);
  };

  const handleSlotHover = (date: string, time: string, count: number) => {
    if (count === 0) {
      setHoverInfo("");
      return;
    }
    const available = participants.filter((p) =>
      availabilityByParticipant.get(p.id)?.has(slotKey(date, time)),
    );
    const names = available.map((p) => p.display_id).join(", ");
    setHoverInfo(
      isDateOnly
        ? `${formatKoreanDate(date)} · ${names}`
        : `${formatKoreanDate(date)} ${formatTime12h(time)} · ${names}`,
    );
  };

  const dateOverlaps = useMemo(() => {
    if (!isDateOnly) return [];
    return dates
      .map((date) => ({
        date,
        count: slotCounts.get(slotKey(date, DATE_ONLY_SLOT)) ?? 0,
      }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count || a.date.localeCompare(b.date));
  }, [isDateOnly, dates, slotCounts]);

  const showPersonal = signedIn && gridView === "personal";
  const showGroup = !signedIn || gridView === "group";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHero
        badge={datePage ? "날짜" : undefined}
        title={datePage ? "날짜 정하기" : room.title}
      >
        <p className="mt-0.5 text-center text-[11px] text-white/75">
          {datePage
            ? room.title
            : isDateOnly
              ? `${dates.length}일 · 날짜만`
              : `${dates.length}일 · ${formatTime12h(room.time_start)}–${formatTime12h(room.time_end)}`}
        </p>
      </PageHero>

      <div className="cute-sheet -mt-2 flex-1 space-y-4 px-5 pb-24 pt-4">
        {!signedIn ? (
          <form onSubmit={handleJoin} className="flex gap-2">
            <input
              id="displayId"
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
            {isDateOnly ? `${displayId}의 날짜` : `${displayId}의 시간`}
          </p>
        )}
        {error && <p className="-mt-2 text-xs text-coral">{error}</p>}

        {signedIn && (
          <div className="inline-flex rounded-full bg-brand-soft p-1">
            <button
              type="button"
              onClick={() => setGridView("personal")}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${
                gridView === "personal"
                  ? "bg-brand text-white"
                  : "text-muted"
              }`}
            >
              {isDateOnly ? "내 날짜" : "내 시간"}
            </button>
            <button
              type="button"
              onClick={() => setGridView("group")}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${
                gridView === "group" ? "bg-brand text-white" : "text-muted"
              }`}
            >
              그룹
            </button>
          </div>
        )}

        {showPersonal &&
          (isDateOnly ? (
            <DatePoll
              dates={dates}
              selected={selected}
              onChange={handleSelectionChange}
            />
          ) : (
            <TimeGrid
              dates={dates}
              timeStart={room.time_start}
              timeEnd={room.time_end}
              selected={selected}
              onChange={handleSelectionChange}
            />
          ))}

        {showGroup && (
          <>
            {hoverInfo ? (
              <p className="rounded-xl bg-brand-soft px-3 py-2 text-xs text-brand-dark">
                {hoverInfo}
              </p>
            ) : (
              <p className="text-[11px] text-muted">
                {isDateOnly
                  ? "날짜를 누르면 누가 가능한지 보여요"
                  : "칸을 누르면 누가 가능한지 보여요"}
              </p>
            )}
            {isDateOnly ? (
              <DatePoll
                dates={dates}
                selected={new Set()}
                onChange={() => {}}
                slotCounts={slotCounts}
                maxCount={heatmapMax}
                mode="group"
                readOnly
                onDateHover={(date, count) =>
                  handleSlotHover(date, DATE_ONLY_SLOT, count)
                }
              />
            ) : (
              <TimeGrid
                dates={dates}
                timeStart={room.time_start}
                timeEnd={room.time_end}
                selected={new Set()}
                onChange={() => {}}
                slotCounts={slotCounts}
                maxCount={heatmapMax}
                mode="group"
                readOnly
                onSlotHover={handleSlotHover}
              />
            )}
            {isDateOnly
              ? dateOverlaps.length > 0 &&
                completedParticipants.length > 0 && (
                  <ol className="space-y-2">
                    {dateOverlaps.slice(0, 3).map((item, i) => (
                      <li
                        key={item.date}
                        className="flex items-center gap-3 rounded-xl bg-brand-soft px-3 py-2.5 text-sm"
                      >
                        <span className="font-bold text-brand">{i + 1}</span>
                        <span>{formatKoreanDate(item.date)}</span>
                        <span className="ml-auto text-xs text-muted">
                          {item.count}명
                        </span>
                      </li>
                    ))}
                  </ol>
                )
              : overlaps.length > 0 &&
                completedParticipants.length > 0 && (
                  <ol className="space-y-2">
                    {overlaps.slice(0, 3).map((range, i) => (
                      <li
                        key={`${range.date}-${range.startTime}`}
                        className="flex items-center gap-3 rounded-xl bg-brand-soft px-3 py-2.5 text-sm"
                      >
                        <span className="font-bold text-brand">{i + 1}</span>
                        <span>
                          {formatKoreanDate(range.date)}{" "}
                          {range.startTime.slice(0, 5)}–{range.endTime.slice(0, 5)}
                        </span>
                        <span className="ml-auto text-xs text-muted">
                          {range.count}명
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
          </>
        )}

        {datePage ? (
          <button
            type="button"
            onClick={() => router.push(`/room/${room.share_code}`)}
            className="text-sm text-muted hover:text-brand"
          >
            ← 약속방으로 돌아가기
          </button>
        ) : (
          <div className="flex flex-col items-start gap-2">
            {roomKind(room) !== "date" && dates.length > 0 && (
              <button
                type="button"
                onClick={() => router.push(`/room/${room.share_code}/date`)}
                className="text-sm font-semibold text-brand"
              >
                날짜만 정하기
              </button>
            )}
            {room.enable_location && (
              <button
                type="button"
                onClick={() =>
                  router.push(`/room/${room.share_code}/location`)
                }
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand"
              >
                <HiOutlineMapPin className="h-4 w-4" aria-hidden />
                중간 장소도 찾기
              </button>
            )}
          </div>
        )}
      </div>

      {!showSharePrompt && (
        <div className="sticky bottom-0 z-40 border-t border-brand-light bg-white/95 p-3">
          <ShareLinkBar
            url={shareUrl}
            title={room.title}
            sharePath={sharePath}
            intent={shareIntent}
          />
        </div>
      )}

      {showSharePrompt && (
        <SharePromptModal
          url={shareUrl}
          title={room.title}
          sharePath={sharePath}
          intent={shareIntent}
          onClose={() => setShowSharePrompt(false)}
        />
      )}
    </div>
  );
}
