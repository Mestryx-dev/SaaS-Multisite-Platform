import React, { type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  prefersReducedMotion,
  motionTransition,
  reducedMotionTransition,
} from "./reduced-motion";

export type MotionPresenceProps = {
  show: boolean;
  children: ReactNode;
  className?: string;
};

/**
 * Enter/exit wrapper for dialogs, sheets, drawers.
 * Skips animation when prefers-reduced-motion.
 */
export function MotionPresence({ show, children, className }: MotionPresenceProps) {
  const reduce = prefersReducedMotion();
  const t = reduce ? reducedMotionTransition : motionTransition;

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          className={className}
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, y: 8 }}
          transition={t}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
