import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[6px] text-sm font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ceramic focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:translate-y-px",
  {
    variants: {
      variant: {
        primary: "bg-ceramic text-white shadow-sm hover:bg-ceramic-dark",
        default: "bg-ceramic text-white shadow-sm hover:bg-ceramic-dark",
        secondary: "border border-border bg-card text-foreground hover:border-ceramic/50 hover:bg-panel-3",
        outline: "border border-border bg-card text-foreground hover:border-ceramic/50 hover:bg-panel-3",
        ghost: "text-muted-foreground hover:bg-panel-3 hover:text-foreground",
        danger: "border border-danger/30 bg-danger-soft text-danger hover:bg-danger-soft/80",
        brass: "bg-brass text-[#1f2a23] shadow-sm hover:brightness-95",
        link: "text-ceramic underline-offset-4 hover:underline"
      },
      size: {
        default: "px-3.5 py-2",
        sm: "min-h-9 px-3 text-xs",
        lg: "min-h-11 px-5",
        icon: "size-10 px-0"
      }
    },
    defaultVariants: { variant: "secondary", size: "default" }
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
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
