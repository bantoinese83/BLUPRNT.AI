import { useState, useEffect } from "react";
import Lottie from "lottie-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {

  const [animationData, setAnimationData] = useState<any>(null);

  useEffect(() => {
    fetch("/investment-animated-icon.json")
      .then(res => res.json())
      .then(data => setAnimationData(data))
      .catch(err => console.error("Failed to load Lottie:", err));
  }, []);

  return (
    <div className="min-h-screen dashboard-bg">
      {/* Header skeleton */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10">
               {animationData && <Lottie animationData={animationData} loop={true} />}
             </div>
             <Skeleton className="h-9 w-24 rounded-xl" />
          </div>

          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      </header>


      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Project header skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-6 w-28 rounded-lg" />
          <Skeleton className="h-10 w-64 rounded-lg" />
        </div>

        {/* Stats strip skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>

        {/* Upgrade banner skeleton */}
        <Skeleton className="h-16 w-full rounded-2xl" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
          <div className="lg:col-span-2 space-y-8">
            {/* Estimate summary skeleton */}
            <Card>
              <div className="bg-slate-900 p-6 space-y-4">
                <Skeleton className="h-4 w-24 bg-slate-700" />
                <Skeleton className="h-10 w-40 bg-slate-700" />
                <Skeleton className="h-5 w-32 bg-slate-700" />
              </div>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="p-4 sm:p-6 flex flex-col sm:flex-row items-start justify-between gap-4"
                    >
                      <div className="space-y-2 flex-1 min-w-0">
                        <Skeleton className="h-5 w-[75%]" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                      <Skeleton className="h-6 w-20 shrink-0" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Skeleton className="h-11 w-full rounded-xl" />

            {/* Invoices section skeleton */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-7 w-40" />
                <Skeleton className="h-9 w-24 rounded-xl" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Skeleton className="h-[140px] rounded-2xl" />
                <Skeleton className="h-[140px] rounded-2xl border-2 border-dashed border-slate-200" />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-2 w-full rounded-full" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-4">
                <Skeleton className="h-6 w-36" />
                <Skeleton className="h-4 w-48 mt-2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
