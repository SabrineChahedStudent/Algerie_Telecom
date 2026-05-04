import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

/* ─── Lightweight Sheet (slide-over panel) without Radix ─── */

function Sheet({ open, onOpenChange, children }) {
  React.useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 animate-in fade-in-0"
        onClick={() => onOpenChange?.(false)}
      />
      {children}
    </div>
  );
}

function SheetContent({ children, className, side = "right" }) {
  return (
    <div className={cn(
      "fixed inset-y-0 right-0 z-50 flex flex-col bg-white shadow-2xl animate-in slide-in-from-right",
      "w-full sm:max-w-xl",
      className
    )}>
      {children}
    </div>
  );
}

function SheetHeader({ children, className }) {
  return <div className={cn("shrink-0", className)}>{children}</div>;
}

function SheetTitle({ children, className }) {
  return <h2 className={cn("text-lg font-semibold", className)}>{children}</h2>;
}

function SheetDescription({ children, className }) {
  return <p className={cn("text-sm text-slate-500", className)}>{children}</p>;
}

export { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription }
