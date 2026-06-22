import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const classes = className ?? "";
  const hasCustomBackground = /\bbg-(?:white|coal|graphite|paper|linen|lime|command|cocoa|black|red|green|blue|yellow|orange|amber|emerald|teal|cyan|sky|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone|\[)/.test(classes);
  const hasCustomTextColor = /\btext-(?:white|coal|graphite|paper|linen|lime|command|cocoa|black|red|green|blue|yellow|orange|amber|emerald|teal|cyan|sky|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone|\[)/.test(classes);

  return (
    <section
      className={cn(
        "rounded-lg border border-coal/10 p-4 shadow-panel sm:p-5",
        !hasCustomBackground && "bg-white",
        !hasCustomTextColor && "text-coal",
        className
      )}
      {...props}
    />
  );
}
