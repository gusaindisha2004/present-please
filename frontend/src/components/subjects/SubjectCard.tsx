import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export interface SubjectCardStat {
  icon: LucideIcon
  label: string
  value: string | number
}

export function SubjectCard({
  name,
  code,
  section,
  teacher,
  stats,
  meta,
  footer,
}: {
  name: string
  code: string
  section: string
  /** Shown to students; teacher-facing screens leave it out. */
  teacher?: string | null
  stats?: SubjectCardStat[]
  /** Optional label/value rows (next class, attendance) above the actions. */
  meta?: ReactNode
  footer?: ReactNode
}) {
  return (
    <Card className="ring-foreground/10 rounded-2xl transition-shadow duration-200 hover:shadow-md">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold tracking-tight">{name}</h3>
        <div className="text-muted-foreground mt-1.5 flex items-center gap-1.5 text-sm">
          <Badge variant="outline" className="font-mono">
            {code}
          </Badge>
          <span>Section {section}</span>
        </div>

        {teacher && (
          <p className="text-muted-foreground mt-1 text-sm">
            Taught by {teacher}
          </p>
        )}

        {stats && stats.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {stats.map(({ icon: Icon, label, value }) => (
              <span
                key={label}
                className="bg-accent text-accent-foreground inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium"
              >
                <Icon className="size-3.5" strokeWidth={2} />
                {value} {label}
              </span>
            ))}
          </div>
        )}

        {meta && <div className="mt-4 space-y-1.5">{meta}</div>}

        {footer && <div className="mt-5 flex flex-wrap items-center gap-2">{footer}</div>}
      </CardContent>
    </Card>
  )
}
