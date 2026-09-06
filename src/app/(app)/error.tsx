"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Algo salió mal</CardTitle>
          <CardDescription>
            Ocurrió un error inesperado. Puedes intentar de nuevo.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button onClick={reset} className="w-full">
            Reintentar
          </Button>
          <Button
            variant="outline"
            render={<Link href="/" />}
            nativeButton={false}
            className="w-full"
          >
            Volver al inicio
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
