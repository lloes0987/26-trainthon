import type {
  AvailabilitySlot,
  FinalDecision,
  Participant,
  ParticipantLocation,
  Room,
} from "./types";

export type RoomSnapshot = {
  room: Room;
  participants: Participant[];
  slots: AvailabilitySlot[];
  locations: ParticipantLocation[];
  decision: FinalDecision | null;
};

export const ROOM_COOKIE = "eonjeodi_rooms";
export const MAX_ROOM_COOKIE_CHARS = 3500;
const STORAGE_PREFIX = "eonjeodi:room:";

export function isRoomSnapshot(value: unknown): value is RoomSnapshot {
  if (!value || typeof value !== "object") return false;
  const room = (value as RoomSnapshot).room;
  return (
    !!room &&
    typeof room.share_code === "string" &&
    room.share_code.length > 0 &&
    typeof room.id === "string" &&
    typeof room.title === "string"
  );
}

export function encodeRoomSnapshots(rooms: RoomSnapshot[]): string {
  return Buffer.from(JSON.stringify(rooms), "utf8").toString("base64url");
}

export function decodeRoomSnapshots(value: string): RoomSnapshot[] {
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isRoomSnapshot);
  } catch {
    return [];
  }
}

export function packRoomSnapshots(
  rooms: RoomSnapshot[],
  maxChars = MAX_ROOM_COOKIE_CHARS,
): RoomSnapshot[] {
  let packed = rooms
    .filter((item) => item.room.share_code !== "demo")
    .slice(-6);

  while (packed.length > 0 && encodeRoomSnapshots(packed).length > maxChars) {
    const [oldest, ...rest] = packed;
    packed =
      oldest.slots.length > 0
        ? [{ ...oldest, slots: [] }, ...rest]
        : rest;
  }

  return packed;
}

export function roomStorageKey(code: string) {
  return `${STORAGE_PREFIX}${code}`;
}

export function writeRoomSnapshot(snapshot: RoomSnapshot) {
  if (typeof window === "undefined") return;
  if (!isRoomSnapshot(snapshot)) return;
  window.localStorage.setItem(
    roomStorageKey(snapshot.room.share_code),
    JSON.stringify(snapshot),
  );
}

export function encodeShareRoom(room: Room): string {
  return Buffer.from(JSON.stringify(room), "utf8").toString("base64url");
}

export function decodeShareRoom(value: string): Room | null {
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof parsed.share_code !== "string" ||
      typeof parsed.id !== "string" ||
      typeof parsed.title !== "string"
    ) {
      return null;
    }
    return parsed as Room;
  } catch {
    return null;
  }
}

export function emptyRoomSnapshot(room: Room): RoomSnapshot {
  return {
    room,
    participants: [],
    slots: [],
    locations: [],
    decision: null,
  };
}

export function readRoomSnapshot(code: string): RoomSnapshot | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(roomStorageKey(code));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return isRoomSnapshot(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
