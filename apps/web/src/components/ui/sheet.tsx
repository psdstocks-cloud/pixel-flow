import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

// Simple sheet components without Radix UI to avoid TypeScript conflicts
const Sheet = ({ children, ...props }: any) => <div {...props}>{children}</div>
const SheetTrigger = ({ children, ...props }: any) => <button {...props}>{children}</button>
const SheetClose = ({ children, ...props }: any) => <button {...props}>{children}</button>
const SheetPortal = ({ children }: any) => <>{children}</>

const SheetOverlay = ({ className, ...props }: any) => (
  <div
    className={cn(
      "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm",
      className
    )}
    {...props}
  />
)

const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b",
        bottom: "inset-x-0 bottom-0 border-t",
        left: "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
        right: "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
)

const SheetContent = ({ side = "right", className, children, ...props }: any) => (
  <div className="fixed inset-0 z-50">
    <SheetOverlay />
    <div
      className={cn(sheetVariants({ side }), className)}
      {...props}
    >
      {children}
      <button className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </button>
    </div>
  </div>
)

const SheetHeader = ({ className, children, ...props }: any) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  >
    {children}
  </div>
)

const SheetFooter = ({ className, children, ...props }: any) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  >
    {children}
  </div>
)

const SheetTitle = ({ className, children, ...props }: any) => (
  <h2
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  >
    {children}
  </h2>
)

const SheetDescription = ({ className, children, ...props }: any) => (
  <p
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  >
    {children}
  </p>
)

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
