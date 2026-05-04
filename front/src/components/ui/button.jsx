import * as React from "react"
import { cn } from "@/lib/utils"

const buttonVariants = {
  variant: {
    default: "bg-[#0055A4] text-white hover:bg-[#004080] shadow-sm",
    destructive: "bg-red-500 text-white hover:bg-red-600 shadow-sm",
    outline: "border border-slate-200 bg-white hover:bg-slate-100 text-slate-900",
    secondary: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm",
    ghost: "hover:bg-slate-100 text-slate-700",
    link: "text-[#0055A4] underline-offset-4 hover:underline",
  },
  size: {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3 text-xs",
    lg: "h-11 rounded-md px-8",
    icon: "h-10 w-10",
  },
}

const Button = React.forwardRef(({ className, variant = "default", size = "default", ...props }, ref) => {
  const variantClass = buttonVariants.variant[variant] || buttonVariants.variant.default
  const sizeClass = buttonVariants.size[size] || buttonVariants.size.default

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0055A4] disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
        variantClass,
        sizeClass,
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button, buttonVariants }
