import { Link } from "react-router-dom"
import { GraduationCap, Presentation, ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { BlobIllustration } from "@/components/illustrations/BlobIllustration"

export default function LandingPage() {
  return (
    <div className="min-h-svh">
      <header className="flex items-center justify-between px-6 py-6 sm:px-10">
        <div className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <GraduationCap className="text-primary size-6" />
          Present Please!
        </div>
        <Button variant="ghost" asChild>
          <Link to="/login">Sign in</Link>
        </Button>
      </header>

      <main className="mx-auto max-w-4xl px-6 pt-12 pb-24 text-center sm:px-10">
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Attendance that takes itself.
        </h1>
        <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-lg text-balance">
          Face and voice recognition for the classroom. Point a camera at
          the room, and let the roll call happen on its own.
        </p>

        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          <RoleCard
            role="student"
            icon={GraduationCap}
            title="I'm a Student"
            description="Sign in with your face, join classes with a code, and track your own attendance."
          />
          <RoleCard
            role="teacher"
            icon={Presentation}
            title="I'm a Teacher"
            description="Create subjects, scan the classroom, and let AI mark who showed up."
          />
        </div>
      </main>

      <footer className="text-muted-foreground pb-10 text-center text-xs">
        Built as a portfolio project.
      </footer>
    </div>
  )
}

function RoleCard({
  role,
  icon,
  title,
  description,
}: {
  role: "student" | "teacher"
  icon: typeof GraduationCap
  title: string
  description: string
}) {
  return (
    <Card className="group border-border/80 hover:border-primary/40 rounded-2xl transition-all hover:-translate-y-1 hover:shadow-lg">
      <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
        <BlobIllustration icon={icon} className="scale-75" />
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-muted-foreground mt-1 text-sm text-balance">
            {description}
          </p>
        </div>
        <Button asChild className="mt-2 w-full">
          <Link to={`/login?role=${role}`}>
            Continue
            <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
