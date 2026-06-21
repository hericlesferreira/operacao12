import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-lg border border-coal/15 bg-white px-3 text-sm outline-none transition",
        "placeholder:text-graphite/50 focus:border-coal focus:ring-2 focus:ring-coal/10",
        className
      )}
      {...props}
    />
  );
}
