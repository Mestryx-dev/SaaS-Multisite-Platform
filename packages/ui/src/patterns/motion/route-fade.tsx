import React, { type ReactNode } from "react";
import { motion } from "motion/react";
import {
  prefersReducedMotion,
  motionTransition,
  reducedMotionTransition,
} from "./reduced-motion";

export type RouteFadeProps = {
  /** Typically the current pathname — remounts fade on change. */
  routeKey: string;
  children: ReactNode;
  className?: string;
};

/**
 * Subtle opacity crossfade for SPA main content (~200ms).
 * Skips animation when prefers-reduced-motion.
 */
export function RouteFade({ routeKey, children, className }: RouteFadeProps) {
  const reduce = prefersReducedMotion();
  const t = reduce ? reducedMotionTransition : motionTransition;

  return (
    <motion.div
      key={routeKey}
      className={className}
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={t}
    >
      {children}
    </motion.div>
  );
}
