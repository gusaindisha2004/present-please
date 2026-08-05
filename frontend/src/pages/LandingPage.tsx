import { Link } from "react-router-dom"
import {
  GraduationCap,
  Presentation,
  ArrowRight,
  Sparkles,
  ScanFace,
  Mic,
  ClipboardCheck,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { BlobIllustration } from "@/components/illustrations/BlobIllustration"
import { DotGridBackground } from "@/components/decoration/DotGridBackground"
import { Logo } from "@/components/branding/Logo"

const FEATURES = [
  {
    icon: ScanFace,
    title: "Face recognition",
    description: "Point a camera at the room — everyone present gets marked in seconds.",
  },
  {
    icon: Mic,
    title: "Voice roll-call",
    description: "Or just record students saying their name. AI matches the voice.",
  },
  {
    icon: ClipboardCheck,
    title: "Review before saving",
    description: "Nothing is final until a teacher confirms it. AI assists, humans decide.",
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-svh">
      <header className="flex items-center justify-between px-6 py-6 sm:px-10">
        <Logo />
        <Button variant="ghost" asChild>
          <Link to="/login">Sign in</Link>
        </Button>
      </header>

      <main className="mx-auto max-w-4xl px-6 pt-8 pb-24 text-center sm:px-10 sm:pt-14">
        <div className="relative">
          <DotGridBackground className="-z-10" />

          <Badge
            variant="outline"
            className="border-primary/20 bg-primary/5 text-primary mx-auto"
          >
            <Sparkles className="size-3" />
            AI-powered, not roll-call-powered
          </Badge>

          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            Attendance that{" "}
            <span className="text-brand-gradient">takes itself.</span>
          </h1>
          <p className="text-muted-foreground mx-auto mt-5 max-w-xl text-lg text-balance">
            Face and voice recognition for the classroom. Point a camera at
            the room, and let the roll call happen on its own.
          </p>
        </div>

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

        <div className="mt-24 grid gap-8 text-left sm:grid-cols-3 sm:gap-6">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex flex-col items-start gap-3">
              <span className="bg-accent text-accent-foreground flex size-10 items-center justify-center rounded-xl">
                <Icon className="size-5" strokeWidth={1.75} />
              </span>
              <div>
                <h3 className="font-medium">{title}</h3>
                <p className="text-muted-foreground mt-1 text-sm text-balance">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-border/60 flex items-center justify-center gap-2 border-t px-6 py-8">
        <Logo wordmark={false} markClassName="size-5 rounded-md" />
        <p className="text-muted-foreground text-xs">
          Built as a portfolio project.
        </p>
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
    <Card className="group border-border/80 hover:border-primary/40 hover:shadow-primary/10 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
        <BlobIllustration
          icon={icon}
          className="scale-[0.7] transition-transform duration-300 group-hover:scale-75"
        />
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
