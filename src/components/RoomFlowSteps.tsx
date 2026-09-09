import Link from "next/link";
import {
  buildLocationSharePath,
  buildRoomSharePath,
} from "@/lib/share-url";

export default function RoomFlowSteps({
  code,
  current,
  encodedRoom,
}: {
  code: string;
  current: "time" | "location";
  encodedRoom?: string;
}) {
  const timeHref = buildRoomSharePath(code, encodedRoom);
  const locationHref = buildLocationSharePath(code, encodedRoom);
  const tab =
    "flex-1 rounded-full px-3 py-1.5 text-center text-sm font-semibold";

  return (
    <div className="grid grid-cols-2 gap-1 rounded-full bg-brand-soft p-1">
      <Link
        href={timeHref}
        className={`${tab} ${
          current === "time" ? "bg-brand text-white" : "text-muted"
        }`}
      >
        1 시간
      </Link>
      <Link
        href={locationHref}
        className={`${tab} ${
          current === "location" ? "bg-brand text-white" : "text-muted"
        }`}
      >
        2 장소
      </Link>
    </div>
  );
}
