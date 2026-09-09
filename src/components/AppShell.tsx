export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh justify-center bg-[#d6e4f2]">
      <div className="app-shell relative flex h-dvh min-h-0 w-full max-w-[430px] flex-col overflow-y-auto bg-white shadow-[0_0_40px_rgba(0,56,118,0.16)]">
        {children}
      </div>
    </div>
  );
}
