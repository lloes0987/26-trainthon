import TopNav from "@/components/TopNav";
import CreateRoomForm from "@/components/CreateRoomForm";

export default function CreateTimePage() {
  return (
    <>
      <TopNav />
      <main className="flex flex-1 flex-col">
        <CreateRoomForm mode="time" />
      </main>
    </>
  );
}
