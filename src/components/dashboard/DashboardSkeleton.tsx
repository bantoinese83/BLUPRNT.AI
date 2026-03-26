import React from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function Shimmer() {
  return (
    <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent" />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen dashboard-bg">
      {/* Header skeleton */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="relative overflow-hidden rounded-xl border border-slate-100 bg-white p-1 shadow-md">
              <div className="h-10 w-10 sm:h-11 sm:w-11 bg-slate-100 rounded-lg flex items-center justify-center relative overflow-hidden">
                <Shimmer />
                <div className="w-6 h-6 bg-slate-200 rounded animate-pulse" />
              </div>
            </div>
            <div className="relative overflow-hidden h-4 w-32 bg-slate-100 rounded-lg">
              <Shimmer />
            </div>
          </div>
          <div className="relative overflow-hidden h-9 w-24 bg-slate-100 rounded-xl">
            <Shimmer />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Project header skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-2"
        >
          <div className="relative overflow-hidden h-6 w-28 bg-slate-100 rounded-lg">
            <Shimmer />
          </div>
          <div className="relative overflow-hidden h-10 w-64 bg-slate-100 rounded-lg">
            <Shimmer />
          </div>
        </motion.div>

        {/* Stats strip skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4"
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="relative overflow-hidden h-20 bg-slate-100 rounded-xl"
            >
              <Shimmer />
            </div>
          ))}
        </motion.div>

        {/* Upgrade banner skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative overflow-hidden h-16 w-full bg-slate-100 rounded-2xl"
        >
          <Shimmer />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10"
        >
          <div className="lg:col-span-2 space-y-8">
            {/* Estimate summary skeleton */}
            <Card className="relative overflow-hidden">
              <div className="bg-slate-900 p-6 space-y-4 relative overflow-hidden">
                <Shimmer />
                <div className="h-4 w-24 bg-slate-700/50 rounded relative overflow-hidden" />
                <div className="h-10 w-40 bg-slate-700/50 rounded relative overflow-hidden" />
                <div className="h-5 w-32 bg-slate-700/50 rounded relative overflow-hidden" />
              </div>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="p-4 sm:p-6 flex flex-col sm:row items-start justify-between gap-4"
                    >
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="relative overflow-hidden h-5 w-[75%] bg-slate-100 rounded">
                          <Shimmer />
                        </div>
                        <div className="relative overflow-hidden h-4 w-full bg-slate-100 rounded">
                          <Shimmer />
                        </div>
                        <div className="relative overflow-hidden h-3 w-1/2 bg-slate-100 rounded">
                          <Shimmer />
                        </div>
                      </div>
                      <div className="relative overflow-hidden h-6 w-20 bg-slate-100 rounded shrink-0">
                        <Shimmer />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <div className="relative overflow-hidden h-11 w-full bg-slate-100 rounded-xl">
              <Shimmer />
            </div>

            {/* Invoices section skeleton */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="relative overflow-hidden h-7 w-40 bg-slate-100 rounded">
                  <Shimmer />
                </div>
                <div className="relative overflow-hidden h-9 w-24 bg-slate-100 rounded-xl">
                  <Shimmer />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative overflow-hidden h-[140px] bg-slate-100 rounded-2xl">
                  <Shimmer />
                </div>
                <div className="relative overflow-hidden h-[140px] rounded-2xl border-2 border-dashed border-slate-200" />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <Card className="relative overflow-hidden">
              <Shimmer />
              <CardHeader className="pb-4">
                <div className="relative overflow-hidden h-6 w-32 bg-slate-100 rounded">
                  <Shimmer />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative overflow-hidden h-4 w-full bg-slate-100 rounded">
                  <Shimmer />
                </div>
                <div className="relative overflow-hidden h-2 w-full bg-slate-100 rounded-full">
                  <Shimmer />
                </div>
                <div className="relative overflow-hidden h-16 w-full bg-slate-100 rounded-xl">
                  <Shimmer />
                </div>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden">
              <Shimmer />
              <CardHeader className="pb-4">
                <div className="relative overflow-hidden h-6 w-36 bg-slate-100 rounded">
                  <Shimmer />
                </div>
                <div className="relative overflow-hidden h-4 w-48 mt-2 bg-slate-100 rounded">
                  <Shimmer />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative overflow-hidden h-4 w-full bg-slate-100 rounded">
                  <Shimmer />
                </div>
                <div className="relative overflow-hidden h-4 w-full bg-slate-100 rounded">
                  <Shimmer />
                </div>
                <div className="relative overflow-hidden h-10 w-full bg-slate-100 rounded-xl">
                  <Shimmer />
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
