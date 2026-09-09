import TopNav from "@/components/TopNav";
import ModePicker from "@/components/ModePicker";

export default function StartPage() {
  return (
    <>
      <TopNav />
      <main className="flex flex-1 flex-col bg-[#f4f6f8]">
        <ModePicker />
      </main>
    </>
  );
}
