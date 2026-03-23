import { cn } from "@/lib/utils";

interface UpgradeIconProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
}

export function UpgradeIcon({ className, ...props }: UpgradeIconProps) {
  return (
    <img
      src="/upgrade-icon.svg"
      alt="Upgrade"
      className={cn("w-5 h-5", className)}
      {...props}
    />


  );
}
