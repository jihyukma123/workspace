import * as React from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const AppInput = React.forwardRef<
  React.ElementRef<typeof Input>,
  React.ComponentProps<typeof Input>
>(({ className, ...props }, ref) => {
  return (
    <Input
      ref={ref}
      className={cn("bg-input border-border", className)}
      {...props}
    />
  );
});
AppInput.displayName = "AppInput";

export { AppInput };
