import { FoodsClient } from "./foods-client";

export default function FoodsPage() {
  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-8">
      <FoodsClient />
    </div>
  );
}
