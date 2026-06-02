import Link from "next/link";
import type { ComponentProps, MouseEventHandler, ReactNode } from "react";
import { cn } from "@/utils/cn";

type ButtonProps = ComponentProps<"button"> & {
  href?: string;
  icon?: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export function Button({
  href,
  icon,
  variant = "primary",
  className,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(
    "inline-flex h-12 items-center justify-center gap-2 rounded-md px-5 text-sm font-semibold transition duration-300 focus:outline-none focus:ring-2 focus:ring-cinema-cyan/60 disabled:cursor-not-allowed disabled:opacity-50",
    variant === "primary" &&
      "bg-cinema-cyan text-slate-950 shadow-[0_0_32px_rgba(19,200,255,0.38)] hover:bg-[#60ddff]",
    variant === "secondary" &&
      "border border-white/18 bg-white/6 text-white hover:border-cinema-cyan/50 hover:bg-white/10",
    variant === "ghost" && "bg-transparent text-white/80 hover:bg-white/8 hover:text-white",
    variant === "danger" && "bg-red-500/16 text-red-100 ring-1 ring-red-300/20 hover:bg-red-500/24",
    className,
  );

  if (href) {
    const onLinkClick = props.onClick as unknown as MouseEventHandler<HTMLAnchorElement> | undefined;

    return (
      <Link className={classes} href={href} onClick={onLinkClick}>
        {icon}
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {icon}
      {children}
    </button>
  );
}
