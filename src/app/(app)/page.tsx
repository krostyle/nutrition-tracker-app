import { DashboardClient } from "./dashboard-client";

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-8">
      <DashboardClient />
    </div>
  );
}
