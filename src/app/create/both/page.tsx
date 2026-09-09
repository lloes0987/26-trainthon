import CreateRoomForm from "@/components/CreateRoomForm";

export default function CreateBothPage() {
  return (
    <main className="flex flex-1 flex-col">
      <CreateRoomForm mode="both" />
    </main>
  );
}
