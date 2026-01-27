"use client";

import { useScrollReveal } from "@/hooks/useScrollReveal";
import { cn } from "@/lib/utils";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  direction?: "up" | "down" | "left" | "right" | "scale";
  delay?: number;
  threshold?: number;
  triggerOnce?: boolean;
}

/**
 * ScrollReveal Component
 * Wraps children with scroll-triggered reveal animation
 */
export function ScrollReveal({
  children,
  className,
  direction = "up",
  delay = 0,
  threshold = 0.1,
  triggerOnce = true,
}: ScrollRevealProps) {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>({
    threshold,
    triggerOnce,
  });

  const directionClasses = {
    up: "scroll-reveal",
    down: "scroll-reveal-down",
    left: "scroll-reveal-left",
    right: "scroll-reveal-right",
    scale: "scroll-reveal-scale",
  };

  return (
    <div
      ref={ref}
      className={cn(
        directionClasses[direction],
        isVisible && "revealed",
        className
      )}
      style={{
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Staggered Children Component
 * Reveals children with staggered delays
 */
interface StaggeredChildrenProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  className?: string;
  childClassName?: string;
  direction?: "up" | "down" | "left" | "right" | "scale";
}

export function StaggeredChildren({
  children,
  staggerDelay = 100,
  className,
  childClassName,
  direction = "up",
}: StaggeredChildrenProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <ScrollReveal
          key={index}
          direction={direction}
          delay={index * staggerDelay}
          className={childClassName}
        >
          {child}
        </ScrollReveal>
      ))}
    </div>
  );
}

/**
 * Scroll reveal down animation classes
 */
const scrollRevealDownStyles = `
.scroll-reveal-down {
  opacity: 0;
  transform: translateY(-2rem);
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;
}

.scroll-reveal-down.revealed {
  opacity: 1;
  transform: translateY(0);
}
`;

// Note: The CSS classes are already defined in globals.css
// This component uses those classes
