"use server";

import { cookies } from "next/headers";
import {
  createLocationRoomData,
  createRoomData,
  findShareCodeByParticipantId,
  findShareCodeByRoomId,
  getRoomData,
  hydrateRoomData,
  joinRoomData,
  listPersistedRooms,
  saveAvailabilityData,
  saveFinalDecisionData,
  saveLocationData,
} from "@/lib/mock-store";
import {
  ROOM_COOKIE,
  decodeRoomSnapshots,
  encodeRoomSnapshots,
  isRoomSnapshot,
  decodeShareRoom,
  emptyRoomSnapshot,
  packRoomSnapshots,
  type RoomSnapshot,
} from "@/lib/room-snapshot";

async function restoreRoomsCookie() {
  const raw = (await cookies()).get(ROOM_COOKIE)?.value;
  if (!raw) return;
  for (const snapshot of decodeRoomSnapshots(raw)) {
    hydrateRoomData(snapshot);
  }
}

async function persistRoomsCookie() {
  const packed = packRoomSnapshots(listPersistedRooms());
  if (packed.length === 0) return;
  (await cookies()).set(ROOM_COOKIE, encodeRoomSnapshots(packed), {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 14,
  });
}

async function readStore<T>(fn: () => T): Promise<T> {
  await restoreRoomsCookie();
  return fn();
}

async function writeStore<T>(fn: () => T): Promise<T> {
  await restoreRoomsCookie();
  const result = fn();
  await persistRoomsCookie();
  return result;
}

export async function createRoom(formData: FormData) {
  const title = formData.get("title") as string;
  const dates = formData.getAll("dates") as string[];
  const timeStart = formData.get("timeStart") as string;
  const timeEnd = formData.get("timeEnd") as string;
  const enableLocation = formData.get("enableLocation") === "on";
  const dateOnly = formData.get("dateOnly") === "on";

  if (!title?.trim() || dates.length === 0 || (!dateOnly && (!timeStart || !timeEnd))) {
    return { error: "필수 항목을 모두 입력해주세요." };
  }

  const { validateCreateRoom, hasFieldErrors } = await import(
    "@/lib/validators/create-room"
  );
  const validationErrors = validateCreateRoom({
    title,
    dates,
    timeStart: dateOnly ? "09:00" : timeStart,
    timeEnd: dateOnly ? "10:00" : timeEnd,
    dateOnly,
  });
  if (hasFieldErrors(validationErrors)) {
    return {
      error:
        validationErrors.timeRange ??
        validationErrors.title ??
        validationErrors.dates ??
        "입력값을 확인해주세요.",
    };
  }

  const shareCode = await writeStore(() =>
    createRoomData({
      title: title.trim(),
      dates,
      timeStart: dateOnly ? "09:00" : timeStart,
      timeEnd: dateOnly ? "10:00" : timeEnd,
      enableLocation,
      kind: dateOnly ? "date" : undefined,
    }),
  );

  return { shareCode, snapshot: getRoomData(shareCode) };
}

export async function createLocationMeetup(title: string) {
  const trimmed = title.trim() || "중간 지점 찾기";
  if (trimmed.length > 40) {
    return { error: "약속 이름은 40자 이내로 적어주세요." };
  }
  const shareCode = await writeStore(() => createLocationRoomData(trimmed));
  return { shareCode, snapshot: getRoomData(shareCode) };
}

export async function joinRoom(formData: FormData) {
  const roomId = formData.get("roomId") as string;
  const displayId = formData.get("displayId") as string;

  if (!displayId?.trim()) {
    return { error: "아이디 또는 이름을 입력해주세요." };
  }

  const shareCode = await readStore(() => findShareCodeByRoomId(roomId));
  if (!shareCode) {
    return { error: "약속방을 찾을 수 없습니다." };
  }

  const result = await writeStore(() =>
    joinRoomData(shareCode, roomId, displayId.trim()),
  );
  if ("error" in result) return result;

  return {
    participantId: result.participantId,
    sessionToken: result.sessionToken,
  };
}

export async function saveAvailability(
  participantId: string,
  roomId: string,
  slots: Array<{ date: string; time: string }>,
  slotKind: "date" | "time" = "time",
) {
  const shareCode = await readStore(() => findShareCodeByRoomId(roomId));
  if (!shareCode) return { error: "약속방을 찾을 수 없습니다." };

  return writeStore(() =>
    saveAvailabilityData(shareCode, participantId, roomId, slots, slotKind),
  );
}

export async function saveLocation(
  participantId: string,
  address: string,
  lat: number,
  lng: number,
) {
  const shareCode = await readStore(() =>
    findShareCodeByParticipantId(participantId),
  );
  if (!shareCode) return { error: "약속방을 찾을 수 없습니다." };

  return writeStore(() =>
    saveLocationData(shareCode, participantId, address, lat, lng),
  );
}

export async function saveFinalDecision(
  roomId: string,
  place: string,
  date?: string,
  startTime?: string,
  endTime?: string,
) {
  const shareCode = await readStore(() => findShareCodeByRoomId(roomId));
  if (!shareCode) return { error: "약속방을 찾을 수 없습니다." };

  return writeStore(() =>
    saveFinalDecisionData(shareCode, roomId, place, date, startTime, endTime),
  );
}

export async function importRoomSnapshot(snapshot: RoomSnapshot) {
  if (!isRoomSnapshot(snapshot)) {
    return { error: "약속방 정보가 올바르지 않아요." };
  }
  await writeStore(() => {
    hydrateRoomData(snapshot);
  });
  return { ok: true as const };
}

export async function importSharedRoom(shareCode: string, encodedRoom: string) {
  const room = decodeShareRoom(encodedRoom);
  if (!room || room.share_code !== shareCode) {
    return { error: "약속방 정보가 올바르지 않아요." };
  }
  await writeStore(() => {
    hydrateRoomData(emptyRoomSnapshot(room));
  });
  return { ok: true as const };
}

export async function getRoomByCode(shareCode: string, encodedRoom?: string) {
  await restoreRoomsCookie();
  if (encodedRoom) {
    const room = decodeShareRoom(encodedRoom);
    if (room && room.share_code === shareCode) {
      hydrateRoomData(emptyRoomSnapshot(room));
    }
  }

  const data = getRoomData(shareCode);
  if (!data) return null;

  return {
    room: data.room,
    participants: data.participants,
    slots: data.slots,
    locations: data.locations,
    decision: data.decision,
  };
}
