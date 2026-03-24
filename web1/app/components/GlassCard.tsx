import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  glow?: "blue" | "violet" | "cyan" | "none";
  onClick?: () => void;
}

const glowMap = {
  blue: "hover:shadow-[0_8px_32px_rgba(79,142,247,0.18)] hover:border-blue-300/60",
  violet: "hover:shadow-[0_8px_32px_rgba(124,94,248,0.18)] hover:border-violet-300/60",
  cyan: "hover:shadow-[0_8px_32px_rgba(6,182,212,0.18)] hover:border-cyan-300/60",
  none: "",
};

export default function GlassCard({ children, className = "", glow = "blue", onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className={`
        glass rounded-2xl transition-all duration-300
        ${glow !== "none" ? glowMap[glow] : ""}
        ${onClick ? "cursor-pointer active:scale-[0.98]" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
