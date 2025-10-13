import * as React from "react"
import { cn } from "@/lib/utils"

// Simple separator component without Radix UI to avoid TypeScript conflicts
const Separator = ({ className, orientation = "horizontal", ...props }: any) => (
  <div
    className={cn(
      "shrink-0 bg-border",
      orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
      className
    )}
    {...props}
  />
)

export { Separator }
