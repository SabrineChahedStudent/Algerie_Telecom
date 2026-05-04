import React from 'react';
import { cn } from '@/lib/utils';

export function Progress({ value = 0, className, ...props }) {
  return (
    <div className={cn("relative h-2 w-full overflow-hidden rounded-full bg-slate-100", className)} {...props}>
      <div
        className="h-full rounded-full bg-[#0055A4] transition-all duration-500 ease-out"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
