import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

// Simple dialog components without Radix UI to avoid TypeScript conflicts
const Dialog = ({ children, ...props }: any) => <div {...props}>{children}</div>
const DialogTrigger = ({ children, ...props }: any) => <button {...props}>{children}</button>
const DialogPortal = ({ children }: any) => <>{children}</>
const DialogClose = ({ children, ...props }: any) => <button {...props}>{children}</button>

const DialogOverlay = ({ className, ...props }: any) => (
  <div
    className={cn(
      "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm",
      className
    )}
    {...props}
  />
)

const DialogContent = ({ className, children, ...props }: any) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    <DialogOverlay />
    <div
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg",
        className
      )}
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

const DialogHeader = ({ className, children, ...props }: any) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  >
    {children}
  </div>
)

const DialogFooter = ({ className, children, ...props }: any) => (
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

const DialogTitle = ({ className, children, ...props }: any) => (
  <h2
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  >
    {children}
  </h2>
)

const DialogDescription = ({ className, children, ...props }: any) => (
  <p
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  >
    {children}
  </p>
)

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
