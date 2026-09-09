import { customAlphabet } from "nanoid";
import type { RoomSnapshot } from "./room-snapshot";
import {
  DATE_ONLY_SLOT,
  type AvailabilitySlot,
  type FinalDecision,
  type Participant,
  type ParticipantLocation,
  type Room,
  type RoomKind,
} from "./types";

const generateShareCode = customAlphabet(
  "abcdefghijklmnopqrstuvwxyz0123456789",
  8,
);

const store = new Map<string, RoomSnapshot>();

function seedDemoRoom() {
  const roomId = "demo-room-id";
  const shareCode = "demo";

  const p1: Participant = {
    id: "demo-p1",
    room_id: roomId,
    display_id: "민지",
    status: "completed",
    joined_at: new Date().toISOString(),
  };
  const p2: Participant = {
    id: "demo-p2",
    room_id: roomId,
    display_id: "준호",
    status: "completed",
    joined_at: new Date().toISOString(),
  };
  const p3: Participant = {
    id: "demo-p3",
    room_id: roomId,
    display_id: "수연",
    status: "in_progress",
    joined_at: new Date().toISOString(),
  };

  const dates = ["2026-09-12", "2026-09-13", "2026-09-14"];
  const times = ["18:00", "19:00", "20:00", "21:00"];

  const slots: AvailabilitySlot[] = [];
  for (const pid of ["demo-p1", "demo-p2"]) {
    for (const date of dates) {
      for (const time of times) {
        if (date === "2026-09-14" && time === "21:00" && pid === "demo-p2")
          continue;
        slots.push({
          id: crypto.randomUUID(),
          room_id: roomId,
          participant_id: pid,
          slot_date: date,
          time_slot: time,
          available: true,
        });
      }
    }
  }
  for (const time of ["19:00", "20:00"]) {
    slots.push({
      id: crypto.randomUUID(),
      room_id: roomId,
      participant_id: "demo-p3",
      slot_date: "2026-09-13",
      time_slot: time,
      available: true,
    });
  }

  const room: Room = {
    id: roomId,
    title: "주말 저녁 모임",
    date_candidates: dates,
    time_start: "18:00",
    time_end: "22:00",
    share_code: shareCode,
    enable_location: true,
    kind: "both",
    created_at: new Date().toISOString(),
  };

  store.set(shareCode, {
    room,
    participants: [p1, p2, p3],
    slots,
    locations: [
      {
        id: "demo-l1",
        participant_id: "demo-p1",
        address: "강남역",
        lat: 37.4979,
        lng: 127.0276,
      },
      {
        id: "demo-l2",
        participant_id: "demo-p2",
        address: "홍대입구역",
        lat: 37.5572,
        lng: 126.9234,
      },
    ],
    decision: null,
  });
}

function ensureStore() {
  if (!store.has("demo")) seedDemoRoom();
}

export function getRoomData(shareCode: string): RoomSnapshot | null {
  ensureStore();
  return store.get(shareCode) ?? null;
}

export function listPersistedRooms(): RoomSnapshot[] {
  ensureStore();
  return [...store.values()].filter((data) => data.room.share_code !== "demo");
}

export function hydrateRoomData(snapshot: RoomSnapshot) {
  ensureStore();
  if (snapshot.room.share_code === "demo") return;
  const existing = store.get(snapshot.room.share_code);
  const incoming = structuredClone(snapshot);
  if (!existing) {
    store.set(snapshot.room.share_code, incoming);
    return;
  }

  const existingScore =
    existing.slots.length +
    existing.locations.length +
    existing.participants.length;
  const nextScore =
    incoming.slots.length +
    incoming.locations.length +
    incoming.participants.length;
  if (nextScore >= existingScore) {
    store.set(snapshot.room.share_code, incoming);
  }
}

export function createRoomData(input: {
  title: string;
  dates: string[];
  timeStart: string;
  timeEnd: string;
  enableLocation: boolean;
  kind?: RoomKind;
}): string {
  ensureStore();

  const shareCode = generateShareCode();
  const roomId = crypto.randomUUID();
  const kind =
    input.kind ?? (input.enableLocation ? "both" : "time");

  const room: Room = {
    id: roomId,
    title: input.title,
    date_candidates: input.dates,
    time_start: input.timeStart,
    time_end: input.timeEnd,
    share_code: shareCode,
    enable_location: input.enableLocation || kind === "location",
    kind,
    created_at: new Date().toISOString(),
  };

  store.set(shareCode, {
    room,
    participants: [],
    slots: [],
    locations: [],
    decision: null,
  });

  return shareCode;
}

export function joinRoomData(
  shareCode: string,
  roomId: string,
  displayId: string,
): { participantId: string; sessionToken: string } | { error: string } {
  ensureStore();

  const data = store.get(shareCode);
  if (!data || data.room.id !== roomId) {
    return { error: "약속방을 찾을 수 없습니다." };
  }

  const existing = data.participants.find((p) => p.display_id === displayId);
  if (existing) {
    existing.status = "in_progress";
    return { participantId: existing.id, sessionToken: existing.id };
  }

  const participant: Participant = {
    id: crypto.randomUUID(),
    room_id: roomId,
    display_id: displayId,
    status: "in_progress",
    joined_at: new Date().toISOString(),
  };

  data.participants.push(participant);
  return { participantId: participant.id, sessionToken: participant.id };
}

export function saveAvailabilityData(
  shareCode: string,
  participantId: string,
  roomId: string,
  slots: Array<{ date: string; time: string }>,
  slotKind: "date" | "time" = "time",
): { success: true } | { error: string } {
  ensureStore();

  const data = store.get(shareCode);
  if (!data) return { error: "약속방을 찾을 수 없습니다." };

  data.slots = data.slots.filter((s) => {
    if (s.participant_id !== participantId) return true;
    const isDateSlot = s.time_slot === DATE_ONLY_SLOT;
    return slotKind === "date" ? !isDateSlot : isDateSlot;
  });

  for (const s of slots) {
    data.slots.push({
      id: crypto.randomUUID(),
      room_id: roomId,
      participant_id: participantId,
      slot_date: s.date,
      time_slot: s.time,
      available: true,
    });
  }

  const participant = data.participants.find((p) => p.id === participantId);
  if (participant) participant.status = "completed";

  return { success: true };
}

export function saveLocationData(
  shareCode: string,
  participantId: string,
  address: string,
  lat: number,
  lng: number,
): { success: true } | { error: string } {
  ensureStore();

  const data = store.get(shareCode);
  if (!data) return { error: "약속방을 찾을 수 없습니다." };

  data.locations = data.locations.filter(
    (l) => l.participant_id !== participantId,
  );
  data.locations.push({
    id: crypto.randomUUID(),
    participant_id: participantId,
    address,
    lat,
    lng,
  });

  const participant = data.participants.find((p) => p.id === participantId);
  if (participant) participant.status = "completed";

  return { success: true };
}

export function createLocationRoomData(title: string): string {
  return createRoomData({
    title,
    dates: [],
    timeStart: "09:00",
    timeEnd: "24:00",
    enableLocation: true,
    kind: "location",
  });
}

export function saveFinalDecisionData(
  shareCode: string,
  roomId: string,
  place: string,
  date?: string,
  startTime?: string,
  endTime?: string,
): { success: true } | { error: string } {
  ensureStore();

  const data = store.get(shareCode);
  if (!data) return { error: "약속방을 찾을 수 없습니다." };

  data.decision = {
    id: crypto.randomUUID(),
    room_id: roomId,
    final_place: place,
    final_date: date ?? null,
    final_start_time: startTime ?? null,
    final_end_time: endTime ?? null,
    created_at: new Date().toISOString(),
  };

  return { success: true };
}

export function findShareCodeByRoomId(roomId: string): string | null {
  ensureStore();
  for (const [code, data] of store) {
    if (data.room.id === roomId) return code;
  }
  return null;
}

export function findShareCodeByParticipantId(
  participantId: string,
): string | null {
  ensureStore();
  for (const [code, data] of store) {
    if (data.participants.some((p) => p.id === participantId)) return code;
  }
  return null;
}
