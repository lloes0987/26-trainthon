import CreateRoomForm from "@/components/CreateRoomForm";

export default async function CreateTimePage({
  searchParams,
}: {
  searchParams: Promise<{ dateOnly?: string }>;
}) {
  const { dateOnly } = await searchParams;

  return (
    <main className="flex flex-1 flex-col">
      <CreateRoomForm mode="time" initialDateOnly={dateOnly === "1"} />
    </main>
  );
}
