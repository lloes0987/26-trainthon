const SESSION_PREFIX = "meethere_session_";

export function getStoredParticipantId(roomCode: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(`${SESSION_PREFIX}${roomCode}`);
}

export function setStoredParticipantId(
  roomCode: string,
  participantId: string,
): void {
  localStorage.setItem(`${SESSION_PREFIX}${roomCode}`, participantId);
}

export function getStoredSessionToken(roomCode: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(`${SESSION_PREFIX}${roomCode}_token`);
}

export function setStoredSessionToken(
  roomCode: string,
  token: string,
): void {
  localStorage.setItem(`${SESSION_PREFIX}${roomCode}_token`, token);
}
