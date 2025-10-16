import * as React from "react";

import { cn } from "./utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex w-full min-w-0 rounded bg-white border border-[#D8D9DA] px-3 py-[6px] text-base outline-none transition-[border-color,box-shadow]",
        "placeholder:text-muted-foreground",
        "hover:border-[#636769]",
        "focus:border-[#1D6BCD] focus:shadow-[0px_1px_2px_rgba(0,0,0,0.05),0px_0px_0px_4px_rgba(47,108,222,0.24)]",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        "md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
