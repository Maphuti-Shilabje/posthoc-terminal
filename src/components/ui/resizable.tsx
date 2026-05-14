"use client"

import * as ResizablePrimitive from "react-resizable-panels"

import { cn } from "@/lib/utils"

function ResizablePanelGroup({
  className,
  ...props
}: ResizablePrimitive.GroupProps) {
  return (
    <ResizablePrimitive.Group
      data-slot="resizable-panel-group"
      className={cn(
        "flex h-full w-full aria-[orientation=vertical]:flex-col",
        className
      )}
      {...props}
    />
  )
}

function ResizablePanel({ ...props }: ResizablePrimitive.PanelProps) {
  return <ResizablePrimitive.Panel data-slot="resizable-panel" {...props} />
}

function ResizableHandle({
  withHandle,
  className,
  ...props
}: ResizablePrimitive.SeparatorProps & {
  withHandle?: boolean
}) {
  return (
    <ResizablePrimitive.Separator
      data-slot="resizable-handle"
      className={cn(
        "relative flex shrink-0 items-center justify-center bg-gray-800 hover:bg-gray-700 transition-colors ring-offset-background focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-hidden",
        "aria-[orientation=vertical]:w-1 aria-[orientation=vertical]:h-full aria-[orientation=vertical]:cursor-col-resize",
        "aria-[orientation=horizontal]:h-1 aria-[orientation=horizontal]:w-full aria-[orientation=horizontal]:cursor-row-resize",
        "[&[aria-orientation=horizontal]>div]:rotate-90",
        className
      )}
      {...props}
    >
      {withHandle && (
        <div className="z-10 flex h-6 w-1 shrink-0 rounded-lg bg-gray-600 hover:bg-emerald-500 transition-colors" />
      )}
    </ResizablePrimitive.Separator>
  )
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup }
