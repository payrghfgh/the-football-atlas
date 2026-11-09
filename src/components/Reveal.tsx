"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/** A restrained 220ms fade-and-rise that switches itself off for reduced motion. */
export function Reveal({
  children,
  delay = 0,
  className = "",
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li";
}) {
  const reduced = useReducedMotion();
  const MotionTag = motion[as];

  if (reduced) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.22, ease: [0.22, 0.61, 0.36, 1], delay }}
    >
      {children}
    </MotionTag>
  );
}
