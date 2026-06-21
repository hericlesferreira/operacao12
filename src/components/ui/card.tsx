import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      className={cn(
        "rounded-lg border border-coal/10 bg-white p-5 shadow-panel",
        className
      )}
      {...props}
    />
  );
}
