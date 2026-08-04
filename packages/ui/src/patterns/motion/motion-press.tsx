import React, { type ReactNode } from "react";
import { motion } from "motion/react";
import { prefersReducedMotion, motionTransition } from "./reduced-motion";

export type MotionPressProps = {
  children: ReactNode;
  className?: string;
};

/** Subtle press feedback wrapper around interactive children. */
export function MotionPress({ children, className }: MotionPressProps) {
  const reduce = prefersReducedMotion();
  if (reduce) {
    return <span className={className}>{children}</span>;
  }
  return (
    <motion.span
      className={className}
      whileTap={{ scale: 0.98 }}
      transition={motionTransition}
      style={{ display: "inline-flex" }}
    >
      {children}
    </motion.span>
  );
}
