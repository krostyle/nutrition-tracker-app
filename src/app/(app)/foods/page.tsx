import { FoodsClient } from "./foods-client";

export default function FoodsPage() {
  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-4 sm:p-8">
      <FoodsClient />
    </div>
  );
}
