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
            <p className="text-sm text-muted-foreground">
              Sesión iniciada. Las features se agregan siguiendo el flujo
              spec-driven descrito en CLAUDE.md.
            </p>
          </Show>
        </CardContent>
      </Card>
    </div>
  );
}
