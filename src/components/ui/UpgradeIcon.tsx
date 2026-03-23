import { cn } from "@/lib/utils";

interface UpgradeIconProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
}

export function UpgradeIcon({ className, ...props }: UpgradeIconProps) {
  return (
    <img
      src="/upgrade-icon.svg"
      alt="Upgrade"
      className={cn("w-4 h-4", className)}
      {...props}
    />
  );
}
