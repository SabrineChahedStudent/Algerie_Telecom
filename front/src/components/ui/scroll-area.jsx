import * as React from "react"
import { cn } from "@/lib/utils"

function ScrollArea({ children, className }) {
  return (
    <div className={cn("overflow-y-auto", className)}>
      {children}
    </div>
  );
}

export { ScrollArea }
