import { Loader } from "@/components/ui/Loader";

export function PageLoader() {
  return (
    <div
      className="min-h-screen bg-white flex flex-col items-center justify-center p-4"
      role="status"
      aria-label="Loading page"
    >
      <Loader 
        title="Loading Blueprint..." 
        subtitle="Preparing your renovation dashboard"
        size="lg"
      />
    </div>
  );
}
