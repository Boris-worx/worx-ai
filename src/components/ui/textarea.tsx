import * as React from "react";

import { cn } from "./utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full bg-input-background dark:bg-[#1a1a1a] border border-border px-3 py-[6px] text-base outline-none transition-[border-color,box-shadow] resize-none",
        "placeholder:text-muted-foreground",
        "hover:border-primary/50 dark:hover:border-primary/50",
        "focus:border-primary focus:shadow-[0px_1px_2px_rgba(0,0,0,0.05),0px_0px_0px_4px_rgba(101,121,255,0.24)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };