import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function InvoicesSectionSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-9 w-24 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <Card key={i} className="border-slate-200">
            <CardContent className="p-4 flex items-start space-x-4">
              <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
              <div className="space-y-2 flex-1 min-w-0">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-16 rounded-md" />
              </div>
            </CardContent>
          </Card>
        ))}
        <div className="border-2 border-dashed border-slate-200 rounded-2xl min-h-[140px] flex flex-col items-center justify-center p-6">
          <Skeleton className="w-6 h-6 rounded-full mb-2" />
          <Skeleton className="h-4 w-28 mb-1" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  );
}
