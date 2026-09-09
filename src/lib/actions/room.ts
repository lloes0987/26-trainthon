"use server";

import {
  createLocationRoomData,
  createRoomData,
  findShareCodeByParticipantId,
  findShareCodeByRoomId,
  getRoomData,
  joinRoomData,
  saveAvailabilityData,
  saveFinalDecisionData,
  saveLocationData,
} from "@/lib/mock-store";

export async function createRoom(formData: FormData) {
  const title = formData.get("title") as string;
  const dates = formData.getAll("dates") as string[];
  const timeStart = formData.get("timeStart") as string;
  const timeEnd = formData.get("timeEnd") as string;
  const enableLocation = formData.get("enableLocation") === "on";

  if (!title?.trim() || dates.length === 0 || !timeStart || !timeEnd) {
    return { error: "필수 항목을 모두 입력해주세요." };
  }

  const { validateCreateRoom, hasFieldErrors } = await import(
    "@/lib/validators/create-room"
  );
  const validationErrors = validateCreateRoom({
    title,
    dates,
    timeStart,
    timeEnd,
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

  const shareCode = createRoomData({
    title: title.trim(),
    dates,
    timeStart,
    timeEnd,
    enableLocation,
  });

  return { shareCode };
}

export async function createLocationMeetup(title: string) {
  const trimmed = title.trim() || "중간 지점 찾기";
  if (trimmed.length > 40) {
    return { error: "약속 이름은 40자 이내로 적어주세요." };
  }
  return { shareCode: createLocationRoomData(trimmed) };
}

export async function joinRoom(formData: FormData) {
  const roomId = formData.get("roomId") as string;
  const displayId = formData.get("displayId") as string;

  if (!displayId?.trim()) {
    return { error: "아이디 또는 이름을 입력해주세요." };
  }

  const shareCode = findShareCodeByRoomId(roomId);
  if (!shareCode) {
    return { error: "약속방을 찾을 수 없습니다." };
  }

  const result = joinRoomData(shareCode, roomId, displayId.trim());
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
) {
  const shareCode = findShareCodeByRoomId(roomId);
  if (!shareCode) return { error: "약속방을 찾을 수 없습니다." };

  return saveAvailabilityData(shareCode, participantId, roomId, slots);
}

export async function saveLocation(
  participantId: string,
  address: string,
  lat: number,
  lng: number,
) {
  const shareCode = findShareCodeByParticipantId(participantId);
  if (!shareCode) return { error: "약속방을 찾을 수 없습니다." };

  return saveLocationData(shareCode, participantId, address, lat, lng);
}

export async function saveFinalDecision(
  roomId: string,
  place: string,
  date?: string,
  startTime?: string,
  endTime?: string,
) {
  const shareCode = findShareCodeByRoomId(roomId);
  if (!shareCode) return { error: "약속방을 찾을 수 없습니다." };

  return saveFinalDecisionData(
    shareCode,
    roomId,
    place,
    date,
    startTime,
    endTime,
  );
}

export async function getRoomByCode(shareCode: string) {
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
