import { notFound } from "next/navigation";
import RoomClient from "@/components/RoomClient";
import RoomRecover from "@/components/RoomRecover";
import { getRoomByCode } from "@/lib/actions/room";
import { encodeShareRoom } from "@/lib/room-snapshot";
import { buildRoomSharePath, buildRoomShareUrl } from "@/lib/share-url";
import { getRequestBaseUrl } from "@/lib/request-base-url";
import { roomKind } from "@/lib/types";

interface DatePageProps {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ r?: string }>;
}

export default async function DatePage({ params, searchParams }: DatePageProps) {
  const { code } = await params;
  const { r } = await searchParams;
  const data = await getRoomByCode(code, r);

  if (!data) return <RoomRecover code={code} />;
  if (data.room.date_candidates.length === 0) notFound();
  if (roomKind(data.room) === "location") notFound();

  const { room, participants, slots } = data;
  const encodedRoom = encodeShareRoom(room);
  const baseUrl = await getRequestBaseUrl();
  const shareUrl = buildRoomShareUrl(room.share_code, baseUrl, encodedRoom);
  const sharePath = buildRoomSharePath(room.share_code, encodedRoom);

  return (
    <main className="flex flex-1 flex-col">
      <RoomClient
        room={room}
        initialParticipants={participants}
        initialSlots={slots}
        shareUrl={shareUrl}
        sharePath={sharePath}
        datePage
      />
    </main>
  );
}
