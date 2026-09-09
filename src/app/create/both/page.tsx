import TopNav from "@/components/TopNav";
import CreateRoomForm from "@/components/CreateRoomForm";

export default function CreateBothPage() {
  return (
    <>
      <TopNav />
      <main className="flex flex-1 flex-col">
        <CreateRoomForm mode="both" />
      </main>
    </>
  );
}
