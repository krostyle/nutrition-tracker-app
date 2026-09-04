import { EditRecipeClient } from "./edit-recipe-client";

export default async function EditRecipePage(props: PageProps<"/recipes/[id]/edit">) {
  const { id } = await props.params;

  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-8">
      <EditRecipeClient id={id} />
    </div>
  );
}
