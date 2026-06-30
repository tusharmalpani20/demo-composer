import { type HTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";

const alertVariants = cva("relative w-full rounded-md border p-4 text-sm", {
  variants: {
    variant: {
      default: "border-slate-200 bg-white text-slate-950",
      destructive: "border-red-200 bg-red-50 text-red-900",
      success: "border-emerald-200 bg-emerald-50 text-emerald-950",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export type AlertProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof alertVariants>;

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} className={cn(alertVariants({ variant }), className)} role="status" {...props} />
  )
);

Alert.displayName = "Alert";

export const AlertTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} className={cn("mb-1 font-semibold leading-none tracking-normal", className)} {...props} />
  )
);

AlertTitle.displayName = "AlertTitle";

export const AlertDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm leading-6 opacity-90", className)} {...props} />
  )
);

AlertDescription.displayName = "AlertDescription";
