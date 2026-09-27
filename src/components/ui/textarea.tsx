import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  label?: string;
  hint?: string;
  errorMessage?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, label, hint, errorMessage, id: providedId, ...props }, ref) => {
    const generatedId = React.useId();
    const textareaId = providedId || generatedId;
    const hintId = hint ? `${textareaId}-hint` : undefined;
    const errorId = errorMessage ? `${textareaId}-error` : undefined;
    const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="form-label">
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          className={cn(
            "input-base min-h-[100px] resize-y",
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
Textarea.displayName = "Textarea";

export { Textarea };