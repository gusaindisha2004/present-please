import { Link } from "react-router-dom"
import { Presentation, BookOpen, ScanFace, ClipboardList, ArrowRight } from "lucide-react"

import { useAuth } from "@/context/AuthContext"
import { BlobIllustration } from "@/components/illustrations/BlobIllustration"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const UPCOMING = [
  { icon: ScanFace, label: "Take attendance" },
  { icon: ClipboardList, label: "Reports" },
]

export default function TeacherDashboardPage() {
  const { profile } = useAuth()

  return (
    <div className="flex min-h-[calc(100svh-3.5rem)] flex-col items-center justify-center gap-6 text-center">
      <BlobIllustration icon={Presentation} className="scale-90" />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome, {profile?.full_name?.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground mt-2 max-w-sm text-balance">
          Manage your subjects now. Attendance tools and reports are coming
          together in the next phases of this build.
        </p>
      </div>
      <Button asChild>
        <Link to="/t/subjects">
          <BookOpen />
          Manage Subjects
          <ArrowRight />
        </Link>
      </Button>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {UPCOMING.map(({ icon: Icon, label }) => (
          <Badge key={label} variant="outline" className="text-muted-foreground">
            <Icon className="size-3" />
            {label}
          </Badge>
        ))}
      </div>
    </div>
  )
}
