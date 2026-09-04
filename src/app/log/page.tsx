import { LogClient } from "./log-client";

export default function LogPage() {
  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-8">
      <LogClient />
    </div>
  );
}
