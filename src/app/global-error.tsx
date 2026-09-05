"use client";

import { useEffect } from "react";
import "./globals.css";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function GlobalError({
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
    <html lang="es">
      <body className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 antialiased">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Algo salió mal</CardTitle>
            <CardDescription>
              Ocurrió un error inesperado y no pudimos cargar la aplicación.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={reset} className="w-full">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </body>
    </html>
  );
}
