import { RecipeDetailClient } from "./recipe-detail-client";

export default async function RecipeDetailPage(props: PageProps<"/recipes/[id]">) {
  const { id } = await props.params;

  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-8">
      <RecipeDetailClient id={id} />
    </div>
  );
}
