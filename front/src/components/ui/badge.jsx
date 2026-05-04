import * as React from "react"
import { cn } from "@/lib/utils"

const badgeVariants = {
  default: "border-transparent bg-[#0055A4] text-white",
  secondary: "border-transparent bg-slate-100 text-slate-900",
  destructive: "border-transparent bg-red-500 text-white",
  outline: "text-slate-700 border-slate-200",
}

function Badge({ className, variant = "default", ...props }) {
  const variantClass = badgeVariants[variant] || badgeVariants.default

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variantClass,
        className
      )}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
