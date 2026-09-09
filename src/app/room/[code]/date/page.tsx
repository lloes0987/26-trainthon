import { notFound } from "next/navigation";
import RoomClient from "@/components/RoomClient";
import { getRoomByCode } from "@/lib/actions/room";
import { buildRoomShareUrl } from "@/lib/share-url";
import { getRequestBaseUrl } from "@/lib/request-base-url";
import { roomKind } from "@/lib/types";

interface DatePageProps {
  params: Promise<{ code: string }>;
}

export default async function DatePage({ params }: DatePageProps) {
  const { code } = await params;
  const data = await getRoomByCode(code);

  if (!data || data.room.date_candidates.length === 0) notFound();
  if (roomKind(data.room) === "location") notFound();

  const { room, participants, slots } = data;
  const baseUrl = await getRequestBaseUrl();
  const shareUrl = buildRoomShareUrl(room.share_code, baseUrl);
  const sharePath = `/room/${room.share_code}`;

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
