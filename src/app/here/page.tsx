import QuickLocationFinder from "@/components/QuickLocationFinder";

export default async function HerePage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode } = await searchParams;

  return (
    <main className="flex flex-1 flex-col">
      <QuickLocationFinder
        initialMode={mode === "invite" ? "invite" : "self"}
      />
    </main>
  );
}
