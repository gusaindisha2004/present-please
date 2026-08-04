import type { LucideIcon } from "lucide-react"

// A small, tasteful stand-in for a hand-drawn illustration: an organic
// "blob" shape (pure CSS border-radius trick) with a Lucide icon centered
// in it, plus a couple of floating accent dots. Kept deliberately simple —
// no external image assets to source, license, or load.
export function BlobIllustration({
  icon: Icon,
  className,
}: {
  icon: LucideIcon
  className?: string
}) {
  return (
    <div className={`relative flex items-center justify-center ${className ?? ""}`}>
      <div
        className="bg-accent flex size-56 items-center justify-center shadow-sm"
        style={{ borderRadius: "42% 58% 70% 30% / 45% 45% 55% 55%" }}
      >
        <Icon className="text-primary size-20" strokeWidth={1.5} />
      </div>
      <div className="bg-primary/15 absolute -top-2 right-6 size-10 rounded-full" />
      <div className="bg-warning/20 absolute bottom-2 left-2 size-6 rounded-full" />
      <div className="bg-success/20 absolute top-10 -left-4 size-5 rounded-full" />
    </div>
  )
}
