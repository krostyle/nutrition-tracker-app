import { Show, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <div className="absolute right-4 top-4">
        <Show when="signed-in">
          <UserButton />
        </Show>
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Nutrition Tracker</CardTitle>
          <CardDescription>
            Scaffold inicial — Next.js, Prisma, Clerk y shadcn/ui.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Show when="signed-out">
            <Button render={<Link href="/sign-in" />} className="w-full">
              Iniciar sesión
            </Button>
          </Show>
          <Show when="signed-in">
            <div className="flex flex-col gap-2">
              <Button render={<Link href="/log" />} className="w-full">
                Registro del día
              </Button>
              <Button render={<Link href="/foods" />} variant="outline" className="w-full">
                Buscar alimentos
              </Button>
              <Button render={<Link href="/goals" />} variant="outline" className="w-full">
                Metas
              </Button>
            </div>
          </Show>
        </CardContent>
      </Card>
    </div>
  );
}
