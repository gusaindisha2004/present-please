import type { LucideIcon } from "lucide-react"
import { CheckCircle2 } from "lucide-react"

import { cn } from "@/lib/utils"

// A small, tasteful stand-in for a hand-drawn illustration, built from
// flat layered shapes (no external image assets to source or license):
// a soft gradient "blob" (CSS border-radius trick), a floating card
// holding the main icon, a dashed accent ring, and one drifting badge.
export function BlobIllustration({
  icon: Icon,
  className,
}: {
  icon: LucideIcon
  className?: string
}) {
  return (
    <div className={cn("relative flex size-56 items-center justify-center", className)}>
      <div
        className="from-primary/15 to-brand-to/25 ring-primary/10 shadow-primary/5 absolute inset-0 bg-linear-to-br shadow-xl ring-1"
        style={{ borderRadius: "42% 58% 70% 30% / 45% 45% 55% 55%" }}
      />

      <div
        aria-hidden="true"
        className="border-primary/20 absolute bottom-4 left-2 size-16 rounded-full border-2 border-dashed"
      />

      <div className="bg-card ring-foreground/5 relative flex size-24 items-center justify-center rounded-2xl shadow-lg ring-1">
        <Icon className="text-primary size-10" strokeWidth={1.6} />
      </div>

      <div className="bg-success/15 ring-success/20 text-success animate-float-slow absolute top-2 right-8 flex size-9 items-center justify-center rounded-full shadow-sm ring-1">
        <CheckCircle2 className="size-4" strokeWidth={2} />
      </div>

      <div className="bg-warning/70 absolute top-14 left-0 size-3 rounded-full" />
      <div className="bg-brand-to/50 absolute right-0 bottom-10 size-4 rounded-full" />
    </div>
  )
}
