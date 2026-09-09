import { notFound } from "next/navigation";
import LocationClient from "@/components/LocationClient";
import RoomRecover from "@/components/RoomRecover";
import { getRoomByCode } from "@/lib/actions/room";
import { encodeShareRoom } from "@/lib/room-snapshot";
import { buildRoomSharePath, buildRoomShareUrl } from "@/lib/share-url";
import { getRequestBaseUrl } from "@/lib/request-base-url";

interface LocationPageProps {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ r?: string }>;
}

export default async function LocationPage({
  params,
  searchParams,
}: LocationPageProps) {
  const { code } = await params;
  const { r } = await searchParams;
  const data = await getRoomByCode(code, r);

  if (!data) return <RoomRecover code={code} expectLocation />;
  if (!data.room.enable_location) notFound();

  const { room, participants, locations } = data;
  const encodedRoom = encodeShareRoom(room);
  const baseUrl = await getRequestBaseUrl();
  const shareUrl = buildRoomShareUrl(room.share_code, baseUrl, encodedRoom);
  const sharePath = buildRoomSharePath(room.share_code, encodedRoom);

  return (
    <main className="flex flex-1 flex-col">
      <LocationClient
        room={room}
        initialParticipants={participants}
        initialLocations={locations}
        encodedRoom={encodedRoom}
        shareUrl={shareUrl}
        sharePath={sharePath}
      />
    </main>
  );
}
