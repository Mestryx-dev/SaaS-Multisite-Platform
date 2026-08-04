/** Reduced-motion helpers for product UI. */

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export const motionTransition = {
  duration: 0.2,
  ease: [0.22, 1, 0.36, 1] as const,
};

export const reducedMotionTransition = {
  duration: 0,
};
