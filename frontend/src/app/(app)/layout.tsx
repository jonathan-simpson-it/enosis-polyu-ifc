import Sidebar from "@/components/layout/Sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <main className="flex-1 bg-bg overflow-auto">
        <div className="mx-auto max-w-6xl px-8 py-12">
          {children}
        </div>
      </main>
    </div>
  );
}
