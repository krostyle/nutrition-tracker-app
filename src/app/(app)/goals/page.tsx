import { GoalsClient } from "./goals-client";

export default function GoalsPage() {
  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-8">
      <GoalsClient />
    </div>
  );
}
