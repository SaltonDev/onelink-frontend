import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      
      {/* 1. WELCOME SECTION SKELETON */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-9 w-[200px]" /> {/* Title */}
          <Skeleton className="h-4 w-[300px]" /> {/* Subtitle */}
        </div>
      </div>

      {/* 2. KEY METRICS GRID SKELETON */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" /> {/* Card Title */}
              <Skeleton className="h-4 w-4 rounded-full" /> {/* Icon */}
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[120px] mb-2" /> {/* Big Number */}
              <Skeleton className="h-3 w-[180px]" /> {/* Subtext */}
              {i < 2 && <Skeleton className="h-1 w-full mt-3" />} {/* Progress bar for first 2 cards */}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 3. LOWER SECTION SKELETON */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* EXPIRING LEASES LIST SKELETON */}
        <Card className="col-span-1 h-full">
          <CardHeader>
            <Skeleton className="h-6 w-[140px]" /> {/* Title */}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Simulate 3 expiring lease rows */}
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[150px]" /> {/* Tenant Name */}
                  <Skeleton className="h-3 w-[100px]" /> {/* Unit Info */}
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <Skeleton className="h-5 w-[80px] rounded-full" /> {/* Badge */}
                  <Skeleton className="h-3 w-[60px]" /> {/* Date */}
                </div>
              </div>
            ))}
            <Skeleton className="h-4 w-[120px] mx-auto mt-4" /> {/* "View All" Link */}
          </CardContent>
        </Card>

        {/* QUICK ACTIONS SKELETON */}
        <Card className="col-span-1 h-full flex flex-col">
          <CardHeader>
            <Skeleton className="h-6 w-[120px]" /> {/* Title */}
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 flex-1">
            {/* Simulate 2 Action Buttons */}
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-full flex flex-col items-center justify-center p-6 rounded-xl border border-slate-100 dark:border-slate-800">
                <Skeleton className="h-12 w-12 rounded-full mb-3" /> {/* Icon Circle */}
                <Skeleton className="h-4 w-[100px] mb-2" /> {/* Label */}
                <Skeleton className="h-3 w-[80px]" /> {/* Sub-label */}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}