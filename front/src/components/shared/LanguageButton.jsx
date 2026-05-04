import React from 'react';
import { cn } from '@/lib/utils';

export function LanguageButton({ label, arabicLabel, className, children, ...props }) {
  return (
    <button
      className={cn(
        "inline-flex flex-col items-center justify-center gap-1 border-none cursor-pointer font-['Barlow_Condensed',sans-serif] transition-all active:scale-[0.97]",
        className
      )}
      {...props}
    >
      <span className="text-lg font-bold tracking-wide">{label}</span>
      {arabicLabel && <span className="text-xs opacity-80">{arabicLabel}</span>}
      {children}
    </button>
  );
}
