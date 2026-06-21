import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  const variants = {
    primary: "bg-coal text-white hover:bg-graphite",
    secondary: "bg-lime text-coal hover:bg-lime/80",
    ghost: "bg-transparent text-coal hover:bg-coal/5"
  };

  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-lg px-5 text-sm font-semibold transition",
        "focus:outline-none focus:ring-2 focus:ring-coal focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className
      )}
      type={type}
      {...props}
    />
  );
}
