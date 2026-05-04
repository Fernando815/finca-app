import * as React from "react";
import { cn } from "@/lib/utils";

/* ── Card ────────────────────────────────────────────────────── */
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "bg-white rounded-2xl border border-stone-100 shadow-card",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

/* ── CardHeader ─────────────────────────────────────────────── */
const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col gap-1 p-5 pb-0", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

/* ── CardTitle ───────────────────────────────────────────────── */
const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-base font-semibold text-stone-900 leading-none", className)} {...props} />
  )
);
CardTitle.displayName = "CardTitle";

/* ── CardDescription ────────────────────────────────────────── */
const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-xs text-stone-500 mt-0.5", className)} {...props} />
  )
);
CardDescription.displayName = "CardDescription";

/* ── CardContent ─────────────────────────────────────────────── */
const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-5 pt-4", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

/* ── CardFooter ──────────────────────────────────────────────── */
const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-5 pt-0", className)} {...props} />
  )
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
