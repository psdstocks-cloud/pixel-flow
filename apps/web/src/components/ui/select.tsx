import * as React from "react"
import { Check, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

// Simple select components without Radix UI to avoid TypeScript conflicts
const Select = ({ children, ...props }: any) => <div {...props}>{children}</div>
const SelectGroup = ({ children, ...props }: any) => <div {...props}>{children}</div>
const SelectValue = ({ placeholder, ...props }: any) => <span {...props}>{placeholder}</span>

const SelectTrigger = ({ className, children, ...props }: any) => (
  <button
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  >
    {children}
    <ChevronDown className="h-4 w-4 opacity-50" />
  </button>
)

const SelectScrollUpButton = ({ className, ...props }: any) => (
  <div
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </div>
)

const SelectScrollDownButton = ({ className, ...props }: any) => (
  <div
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </div>
)

const SelectContent = ({ className, children, ...props }: any) => (
  <div
    className={cn(
      "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md",
      className
    )}
    {...props}
  >
    <SelectScrollUpButton />
    <div className="p-1">
      {children}
    </div>
    <SelectScrollDownButton />
  </div>
)

const SelectLabel = ({ className, children, ...props }: any) => (
  <div
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  >
    {children}
  </div>
)

const SelectItem = ({ className, children, ...props }: any) => (
  <div
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <Check className="h-4 w-4" />
    </span>
    {children}
  </div>
)

const SelectSeparator = ({ className, ...props }: any) => (
  <div
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
)

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
