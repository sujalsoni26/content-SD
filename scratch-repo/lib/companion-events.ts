import type { CompanionEvent } from "@/types/companion";

type Listener = (event: CompanionEvent) => void;
const listeners = new Set<Listener>();

/** Fire-and-forget: lessons, quizzes and diagrams announce events; the companion decides how to react. */
export function emitCompanionEvent(event: CompanionEvent): void {
  listeners.forEach((listener) => listener(event));
}

export function onCompanionEvent(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
