import { Link } from "react-router-dom"
import { Presentation, BookOpen, ArrowRight } from "lucide-react"

import { useAuth } from "@/context/AuthContext"
import { BlobIllustration } from "@/components/illustrations/BlobIllustration"
import { Button } from "@/components/ui/button"

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
          Manage your subjects, take attendance, and review each subject's
          history from here.
        </p>
      </div>
      <Button asChild>
        <Link to="/t/subjects">
          <BookOpen />
          Manage Subjects
          <ArrowRight />
        </Link>
      </Button>
    </div>
  )
}
