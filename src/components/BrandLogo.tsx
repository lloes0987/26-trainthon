interface BrandLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "on-brand" | "default";
}

const sizeClass = {
  sm: "text-base",
  md: "text-lg",
  lg: "text-3xl",
};

export default function BrandLogo({
  className = "",
  size = "md",
  variant = "on-brand",
}: BrandLogoProps) {
  const first =
    variant === "on-brand" ? "text-white" : "text-brand-dark";
  const second =
    variant === "on-brand" ? "text-white/80" : "text-brand";

  return (
    <span
      className={`inline-flex items-baseline font-cute font-bold tracking-tight ${sizeClass[size]} ${className}`}
    >
      <span className={first}>언제</span>
      <span className={second}>어디</span>
    </span>
  );
}
