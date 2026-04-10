import { Loader } from "@/components/ui/Loader";

export function PageLoader() {
  return (
    <div
      className="mesh-bg min-h-screen flex flex-col items-center justify-center p-6"
      role="status"
      aria-label="Loading page"
    >
      <Loader
        title="Loading BLUPRNT..."
        subtitle="Preparing your renovation dashboard"
        size="lg"
        showLogo
      />
    </div>
  );
}
