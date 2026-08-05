import { ScanFace, CheckCircle2 } from "lucide-react"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const ROSTER = [
  { name: "Aarav Mehta", present: true, time: "9:01 AM" },
  { name: "Diya Kapoor", present: true, time: "9:01 AM" },
  { name: "Rohan Verma", present: false, time: "—" },
]

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
}

// A live preview of what the product's dashboard actually produces —
// stat tiles, a roster, a presence ring — built entirely from existing
// Card/Badge/Avatar primitives. Deliberately not a generic "AI" graphic:
// it's specific to this product, so it doubles as an honest feature demo.
export function HeroPreviewCard() {
  const presentPct = 80

  return (
    <div className="relative mx-auto w-full max-w-md lg:mx-0">
      <div
        aria-hidden="true"
        className="bg-primary/25 absolute -top-10 -right-6 size-56 rounded-full blur-3xl"
      />
      <div
        aria-hidden="true"
        className="bg-brand-to/20 absolute -bottom-10 -left-8 size-48 rounded-full blur-3xl"
      />

      <Card className="bg-card/90 ring-foreground/10 relative gap-4 rounded-3xl shadow-2xl shadow-black/5 backdrop-blur-xl [--card-spacing:1.25rem] sm:[--card-spacing:1.5rem]">
        <div className="flex items-center justify-between px-1">
          <span className="text-sm font-semibold tracking-tight">
            CS101 — Live Session
          </span>
          <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <span className="bg-success size-1.5 animate-pulse rounded-full" />
            Scanning
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 px-1">
          <StatTile label="Enrolled" value="42" />
          <StatTile label="Present" value="34" tone="success" />
          <StatTile label="Absent" value="8" tone="destructive" />
        </div>

        <div className="grid grid-cols-[1fr_auto] items-center gap-4 px-1">
          <ul className="space-y-2.5">
            {ROSTER.map((person) => (
              <li key={person.name} className="flex items-center gap-2.5">
                <Avatar className="size-7">
                  <AvatarFallback className="bg-secondary text-[11px]">
                    {initials(person.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1 truncate text-sm">{person.name}</span>
                <Badge
                  variant="outline"
                  className={
                    person.present
                      ? "border-success/20 bg-success/10 text-success"
                      : "border-destructive/20 bg-destructive/10 text-destructive"
                  }
                >
                  {person.present ? "Present" : "Absent"}
                </Badge>
              </li>
            ))}
          </ul>

          <div
            className="relative flex size-20 shrink-0 items-center justify-center rounded-full"
            style={{
              background: `conic-gradient(var(--color-primary) ${presentPct}%, var(--color-muted) ${presentPct}% 100%)`,
            }}
          >
            <div className="bg-card flex size-16 flex-col items-center justify-center rounded-full">
              <span className="text-base font-bold tracking-tight">
                {presentPct}%
              </span>
              <span className="text-muted-foreground text-[10px]">present</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="border-border/60 bg-card animate-float-slow absolute -top-5 -left-6 hidden -rotate-3 items-center gap-2 rounded-xl border px-3 py-2 shadow-lg sm:flex">
        <ScanFace className="text-primary size-4" />
        <span className="text-xs font-medium">Face matched</span>
        <CheckCircle2 className="text-success size-3.5" />
      </div>
    </div>
  )
}

function StatTile({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: "success" | "destructive"
}) {
  return (
    <div className="bg-secondary/60 rounded-xl px-3 py-2.5">
      <p className="text-muted-foreground text-[11px]">{label}</p>
      <p
        className={
          "mt-0.5 text-lg font-semibold tracking-tight " +
          (tone === "success"
            ? "text-success"
            : tone === "destructive"
              ? "text-destructive"
              : "text-foreground")
        }
      >
        {value}
      </p>
    </div>
  )
}
