const DEFAULT_MESSAGE = "Ocurrió un error. Probá de nuevo.";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; message: string };

export async function runAction<T>(
  fn: () => Promise<T>,
  message: string = DEFAULT_MESSAGE,
): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (error) {
    console.error(error);
    return { ok: false, message };
  }
}
