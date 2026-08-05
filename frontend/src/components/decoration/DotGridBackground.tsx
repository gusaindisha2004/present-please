import { cn } from "@/lib/utils"

// Purely decorative: a faint dot-grid texture, faded out toward the edges,
// plus two soft blurred color blobs. Used behind hero/panel sections to
// give otherwise-empty space some texture without adding real content.
export function DotGridBackground({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <div
        className="absolute inset-0 opacity-[0.35] dark:opacity-[0.18]"
        style={{
          backgroundImage:
            "radial-gradient(var(--color-foreground) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          maskImage:
            "radial-gradient(ellipse 65% 55% at 50% 35%, black 30%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 65% 55% at 50% 35%, black 30%, transparent 100%)",
        }}
      />
      <div className="bg-primary/20 absolute -top-20 -right-16 size-72 rounded-full blur-3xl" />
      <div className="bg-brand-to/20 absolute bottom-0 -left-10 size-64 rounded-full blur-3xl" />
    </div>
  )
}
