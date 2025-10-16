import * as React from "react";

import { cn } from "./utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded bg-white dark:bg-[#1a1a1a] border border-[#D8D9DA] dark:border-[#3a3a3a] px-3 py-[6px] text-base outline-none transition-[border-color,box-shadow] resize-none",
        "placeholder:text-muted-foreground",
        "hover:border-[#636769] dark:hover:border-[#636769]",
        "focus:border-[#1D6BCD] focus:shadow-[0px_1px_2px_rgba(0,0,0,0.05),0px_0px_0px_4px_rgba(47,108,222,0.24)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
