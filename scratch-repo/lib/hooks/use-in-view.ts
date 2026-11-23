"use client";
import { useEffect, useState, type RefObject } from "react";

/** True while the element is (nearly) on screen. Interactive diagrams pause their loops when false. */
export function useInView(ref: RefObject<Element | null>, rootMargin = "200px"): boolean {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      const id = window.setTimeout(() => setInView(true), 0);
      return () => window.clearTimeout(id);
    }
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);
  return inView;
}
