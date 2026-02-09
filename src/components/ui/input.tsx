import * as React from "react";

import { cn } from "@/lib/utils";

type InputProps = React.ComponentProps<"input"> & {
  containerClassName?: string;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, containerClassName, type, ...props }, ref) => {
  const input = (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-input px-3 py-2 text-base text-foreground transition-all duration-200 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      ref={ref}
      {...props}
    />
  );

  if (containerClassName) {
    return <div className={cn(containerClassName)}>{input}</div>;
  }

  return input;
});
Input.displayName = "Input";

export { Input };
