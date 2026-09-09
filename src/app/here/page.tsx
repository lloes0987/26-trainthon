import TopNav from "@/components/TopNav";
import QuickLocationFinder from "@/components/QuickLocationFinder";

export default function HerePage() {
  return (
    <>
      <TopNav />
      <main className="flex flex-1 flex-col">
        <QuickLocationFinder />
      </main>
    </>
  );
}
