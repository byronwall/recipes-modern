import { H1 } from "~/components/ui/typography";
import { NewRecipeForm } from "./NewRecipeForm";

export default async function NewRecipePage() {
  return (
    <div className="w-full space-y-4">
      <H1>Create New Recipe</H1>
      <NewRecipeForm />
    </div>
  );
}
