import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  label?: string;
  hint?: string;
  errorMessage?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, hint, errorMessage, id: providedId, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = providedId || generatedId;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = errorMessage ? `${inputId}-error` : undefined;
    const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="form-label">
            {label}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          className={cn(
            "input-base",
            error && "input-error",
            className
          )}
          ref={ref}
          aria-invalid={error}
          aria-describedby={describedBy}
          {...props}
        />
        {errorMessage && (
          <p id={errorId} className="form-error" role="alert">
            {errorMessage}
          </p>
        )}
        {hint && !errorMessage && (
          <p id={hintId} className="form-hint">
            {hint}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };