import { describe, expect, it } from "vitest";
import {
  decodeRoomSnapshots,
  decodeShareRoom,
  encodeRoomSnapshots,
  encodeShareRoom,
  isRoomSnapshot,
  packRoomSnapshots,
  type RoomSnapshot,
} from "./room-snapshot";

function snapshot(code: string, slots = 0): RoomSnapshot {
  return {
    room: {
      id: `id-${code}`,
      title: "모임",
      date_candidates: ["2026-09-10"],
      time_start: "09:00",
      time_end: "12:00",
      share_code: code,
      enable_location: true,
      kind: "both",
      created_at: "2026-09-10T00:00:00.000Z",
    },
    participants: [],
    slots: Array.from({ length: slots }, (_, index) => ({
      id: `${code}-slot-${index}`,
      room_id: `id-${code}`,
      participant_id: "p1",
      slot_date: "2026-09-10",
      time_slot: "09:00",
      available: true,
    })),
    locations: [],
    decision: null,
  };
}

describe("room snapshots", () => {
  it("round-trips encoded rooms", () => {
    const rooms = [snapshot("abc12345")];
    expect(decodeRoomSnapshots(encodeRoomSnapshots(rooms))).toEqual(rooms);
  });

  it("rejects values that are not rooms", () => {
    expect(isRoomSnapshot({})).toBe(false);
    expect(decodeRoomSnapshots("not-base64")).toEqual([]);
  });

  it("keeps a created both-room so the location page can find it", () => {
    const packed = packRoomSnapshots([snapshot("nhm4ogaa")]);
    expect(packed.map((item) => item.room.share_code)).toEqual(["nhm4ogaa"]);
    expect(packed[0]?.room.enable_location).toBe(true);
  });

  it("puts the room on the copied link so a friend can open it", () => {
    const room = snapshot("nhm4ogaa").room;
    expect(decodeShareRoom(encodeShareRoom(room))).toEqual(room);
    expect(decodeShareRoom("bad")).toBeNull();
  });

  it("drops the demo room and shrinks until the cookie fits", () => {
    const packed = packRoomSnapshots(
      [snapshot("demo", 40), snapshot("keepme01", 80)],
      200,
    );
    expect(packed.every((item) => item.room.share_code !== "demo")).toBe(true);
    expect(encodeRoomSnapshots(packed).length).toBeLessThanOrEqual(200);
  });
});
