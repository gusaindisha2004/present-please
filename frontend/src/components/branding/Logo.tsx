import { GraduationCap } from "lucide-react"

import { cn } from "@/lib/utils"

export function Logo({
  wordmark = true,
  className,
  markClassName,
  wordmarkClassName,
}: {
  wordmark?: boolean
  className?: string
  markClassName?: string
  wordmarkClassName?: string
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "bg-brand-gradient flex size-7 shrink-0 items-center justify-center rounded-lg text-white shadow-sm",
          markClassName
        )}
      >
        <GraduationCap className="size-4" strokeWidth={2.25} />
      </span>
      {wordmark && (
        <span
          className={cn(
            "truncate text-lg font-semibold tracking-tight",
            wordmarkClassName
          )}
        >
          Present Please!
        </span>
      )}
    </span>
  )
}
