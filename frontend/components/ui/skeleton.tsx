import * as React from "react"

import { cn } from "@/lib/utils"

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement> {}

function Skeleton(
  { className, ...props }: SkeletonProps,
  ref: React.Ref<HTMLDivElement>,
) {
  return (
    <div
      ref={ref}
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

const SkeletonElement = React.forwardRef<HTMLDivElement, SkeletonProps>(
  Skeleton,
)
SkeletonElement.displayName = "Skeleton"

export { SkeletonElement as Skeleton }
