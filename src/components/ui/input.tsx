import * as React from "react";

import { cn } from "@/lib/utils";

type InputProps = React.ComponentProps<"input"> & {
  containerClassName?: string;
  floatingLabel?: boolean;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      containerClassName,
      type,
      placeholder,
      id,
      floatingLabel = true,
      "aria-label": ariaLabelProp,
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const labelText =
      floatingLabel && typeof placeholder === "string"
        ? placeholder
        : undefined;
    const inputId = id ?? generatedId;
    const ariaLabel = ariaLabelProp ?? labelText;

    return (
      <div className={cn("relative", containerClassName)}>
        <input
          id={inputId}
          type={type}
          aria-label={ariaLabel}
          placeholder={labelText ? " " : placeholder}
          className={cn(
            "peer w-full rounded-none border-0 border-b border-input bg-input px-3 text-base text-foreground transition-all duration-200 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            labelText
              ? "pb-1 pt-5 placeholder:text-transparent"
              : "py-2 placeholder:text-muted-foreground",
            className,
          )}
          ref={ref}
          {...props}
        />
        {labelText ? (
          <label
            htmlFor={inputId}
            className={cn(
              "pointer-events-none absolute left-3 top-1 font-mono text-xs text-muted-foreground transition-all duration-200",
              "peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-muted-foreground",
              "peer-focus:top-1 peer-focus:text-xs peer-focus:text-primary",
            )}
          >
            {labelText}
          </label>
        ) : null}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
