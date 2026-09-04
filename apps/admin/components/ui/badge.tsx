import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none tracking-[0.02em]",
  {
    variants: {
      variant: {
        default: "border-ceramic/20 bg-signal-soft text-ceramic-dark",
        secondary: "border-border bg-panel-3 text-muted-foreground",
        success: "border-good/20 bg-good-soft text-good",
        warning: "border-warn/20 bg-warn-soft text-warn",
        destructive: "border-danger/20 bg-danger-soft text-danger",
        outline: "border-border bg-transparent text-muted-foreground"
      }
    },
    defaultVariants: { variant: "default" }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
