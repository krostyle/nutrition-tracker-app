"use client";

import { useEffect, useRef, useState } from "react";
import { BarcodeFormat, BrowserMultiFormatReader } from "@zxing/browser";
import { DecodeHintType } from "@zxing/library";
import { Button } from "@/components/ui/button";

// Solo formatos de código de barras de producto (los que usa Open Food
// Facts) — evita que la cámara dispare con un QR u otro código de fondo.
const HINTS = new Map<DecodeHintType, unknown>([
  [
    DecodeHintType.POSSIBLE_FORMATS,
    [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E],
  ],
]);

export function BarcodeCameraScanner({
  onDetected,
  onCancel,
  onError,
}: {
  onDetected: (code: string) => void;
  onCancel: () => void;
  onError: (message: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [starting, setStarting] = useState(true);

  // Refs para no reiniciar la cámara cada vez que el padre re-renderiza
  // con una nueva instancia de estas funciones.
  const onDetectedRef = useRef(onDetected);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onDetectedRef.current = onDetected;
    onErrorRef.current = onError;
  });

  useEffect(() => {
    let cancelled = false;
    let controls: { stop: () => void } | null = null;
    const reader = new BrowserMultiFormatReader(HINTS);

    reader
      .decodeFromConstraints(
        { video: { facingMode: "environment" } },
        videoRef.current ?? undefined,
        (result) => {
          if (result && !cancelled) {
            onDetectedRef.current(result.getText());
          }
          // Un `error` en cada intento sin código en el cuadro es normal
          // (NotFoundException) — no se trata como fallo.
        },
      )
      .then((c) => {
        if (cancelled) {
          c.stop();
          return;
        }
        controls = c;
        setStarting(false);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message =
          error instanceof DOMException && error.name === "NotAllowedError"
            ? "No diste permiso para usar la cámara."
            : error instanceof DOMException && error.name === "NotFoundError"
              ? "No se encontró ninguna cámara en este dispositivo."
              : "No pudimos acceder a la cámara.";
        onErrorRef.current(message);
      });

    return () => {
      cancelled = true;
      controls?.stop();
    };
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <div className="relative overflow-hidden rounded-lg border bg-black">
        <video
          ref={videoRef}
          className="aspect-video w-full object-cover"
          muted
          playsInline
        />
        {starting && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-white">
            Activando cámara...
          </div>
        )}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onCancel}>
        Cancelar
      </Button>
    </div>
  );
}
