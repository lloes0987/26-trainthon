import { notFound } from "next/navigation";
import LocationClient from "@/components/LocationClient";
import { getRoomByCode } from "@/lib/actions/room";
import { buildRoomShareUrl } from "@/lib/share-url";
import { getRequestBaseUrl } from "@/lib/request-base-url";

interface LocationPageProps {
  params: Promise<{ code: string }>;
}

export default async function LocationPage({ params }: LocationPageProps) {
  const { code } = await params;
  const data = await getRoomByCode(code);

  if (!data || !data.room.enable_location) notFound();

  const { room, participants, locations } = data;
  const baseUrl = await getRequestBaseUrl();
  const shareUrl = buildRoomShareUrl(room.share_code, baseUrl);
  const sharePath = `/room/${room.share_code}`;

  return (
    <main className="flex flex-1 flex-col">
      <LocationClient
        room={room}
        initialParticipants={participants}
        initialLocations={locations}
        shareUrl={shareUrl}
        sharePath={sharePath}
      />
    </main>
  );
}
