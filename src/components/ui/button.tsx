import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default:     "bg-primary text-white shadow-sm hover:bg-primary/90 active:scale-[0.97]",
        destructive: "bg-destructive text-white shadow-sm hover:bg-destructive/90 active:scale-[0.97]",
        outline:     "border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 hover:border-stone-300 active:scale-[0.97]",
        secondary:   "bg-stone-100 text-stone-700 hover:bg-stone-200 active:scale-[0.97]",
        ghost:       "text-stone-600 hover:bg-stone-100 hover:text-stone-800",
        link:        "text-primary underline-offset-4 hover:underline p-0 h-auto",
        success:     "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 active:scale-[0.97]",
        warning:     "bg-amber-500 text-white shadow-sm hover:bg-amber-600 active:scale-[0.97]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm:      "h-8 rounded-lg px-3 text-xs",
        lg:      "h-12 rounded-xl px-6 text-base",
        xl:      "h-14 rounded-2xl px-8 text-base font-semibold",
        icon:    "h-9 w-9 rounded-xl",
        "icon-sm": "h-7 w-7 rounded-lg",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

