import Link from "next/link";
import { Show } from "@clerk/nextjs";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Show when="signed-in">
        <div className="flex flex-1">
          <AppSidebar />
          <main className="flex flex-1 flex-col overflow-x-hidden">{children}</main>
        </div>
      </Show>
      <Show when="signed-out">
        <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>Nutrition Tracker</CardTitle>
              <CardDescription>Iniciá sesión para continuar.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button render={<Link href="/sign-in" />} nativeButton={false} className="w-full">
                Iniciar sesión
              </Button>
            </CardContent>
          </Card>
        </div>
      </Show>
    </>
  );
}
