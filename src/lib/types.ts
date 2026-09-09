export type ParticipantStatus = "not_started" | "in_progress" | "completed";

export type RoomKind = "time" | "date" | "location" | "both";

export const DATE_ONLY_SLOT = "all-day";

export interface Room {
  id: string;
  title: string;
  date_candidates: string[];
  time_start: string;
  time_end: string;
  share_code: string;
  enable_location: boolean;
  kind: RoomKind;
  created_at: string;
}

export function roomKind(room: Room): RoomKind {
  return room.kind ?? (room.enable_location ? "both" : "time");
}

export interface Participant {
  id: string;
  room_id: string;
  display_id: string;
  status: ParticipantStatus;
  joined_at: string;
}

export interface AvailabilitySlot {
  id: string;
  room_id: string;
  participant_id: string;
  slot_date: string;
  time_slot: string;
  available: boolean;
}

export interface ParticipantLocation {
  id: string;
  participant_id: string;
  address: string;
  lat: number;
  lng: number;
}

export interface FinalDecision {
  id: string;
  room_id: string;
  final_date: string | null;
  final_start_time: string | null;
  final_end_time: string | null;
  final_place: string | null;
  created_at: string;
}

export interface TimeSlotKey {
  date: string;
  time: string;
}

export interface OverlapRange {
  date: string;
  startTime: string;
  endTime: string;
  count: number;
  rank: number;
}

export interface StationCandidate {
  name: string;
  lat: number;
  lng: number;
  avgDistance: number;
  maxDistance: number;
}

export const STATUS_LABELS: Record<ParticipantStatus, string> = {
  not_started: "입력 전",
  in_progress: "입력 중",
  completed: "입력 완료",
};
