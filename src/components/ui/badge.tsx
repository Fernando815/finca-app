import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:     "border-green-200  bg-green-50   text-green-700",
        secondary:   "border-stone-200  bg-stone-100  text-stone-600",
        destructive: "border-red-200    bg-red-50     text-red-700",
        warning:     "border-amber-200  bg-amber-50   text-amber-700",
        info:        "border-blue-200   bg-blue-50    text-blue-700",
        outline:     "border-stone-200  bg-transparent text-stone-600",
        purple:      "border-violet-200 bg-violet-50  text-violet-700",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };

