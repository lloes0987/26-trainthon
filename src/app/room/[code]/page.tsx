import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LocationClient from "@/components/LocationClient";
import RoomClient from "@/components/RoomClient";
import { getRoomByCode } from "@/lib/actions/room";
import { BRAND_NAME } from "@/lib/brand";
import { buildRoomShareUrl } from "@/lib/share-url";
import { getRequestBaseUrl } from "@/lib/request-base-url";
import { roomKind } from "@/lib/types";

interface RoomPageProps {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({
  params,
}: RoomPageProps): Promise<Metadata> {
  const { code } = await params;
  const data = await getRoomByCode(code);

  if (!data) {
    return { title: `약속방을 찾을 수 없습니다 — ${BRAND_NAME}` };
  }

  const baseUrl = await getRequestBaseUrl();
  const shareUrl = buildRoomShareUrl(data.room.share_code, baseUrl);
  const kind = roomKind(data.room);
  const description =
    kind === "location"
      ? `「${data.room.title}」 출발지를 입력하고 중간 장소를 찾아보세요.`
      : kind === "date"
        ? `「${data.room.title}」 가능한 날짜를 함께 맞춰보세요.`
        : `「${data.room.title}」 약속 시간을 함께 맞춰보세요.`;

  return {
    title: `${data.room.title} — ${BRAND_NAME}`,
    description,
    openGraph: {
      title: data.room.title,
      description,
      url: shareUrl,
      siteName: BRAND_NAME,
      type: "website",
      locale: "ko_KR",
    },
    twitter: {
      card: "summary",
      title: data.room.title,
      description,
    },
  };
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { code } = await params;
  const data = await getRoomByCode(code);

  if (!data) notFound();

  const { room, participants, slots, locations } = data;
  const baseUrl = await getRequestBaseUrl();
  const shareUrl = buildRoomShareUrl(room.share_code, baseUrl);
  const sharePath = `/room/${room.share_code}`;

  return (
    <main className="flex flex-1 flex-col">
        {roomKind(room) === "location" ? (
          <LocationClient
            room={room}
            initialParticipants={participants}
            initialLocations={locations}
            shareUrl={shareUrl}
            sharePath={sharePath}
          />
        ) : (
          <RoomClient
            room={room}
            initialParticipants={participants}
            initialSlots={slots}
            shareUrl={shareUrl}
            sharePath={sharePath}
          />
        )}
    </main>
  );
}
