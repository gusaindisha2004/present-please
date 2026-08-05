import { Link } from "react-router-dom"
import {
  GraduationCap,
  Presentation,
  ArrowRight,
  Sparkles,
  ScanFace,
  Mic,
  ClipboardCheck,
  ShieldCheck,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { DotGridBackground } from "@/components/decoration/DotGridBackground"
import { Logo } from "@/components/branding/Logo"
import { HeroPreviewCard } from "@/components/landing/HeroPreviewCard"

const HERO_HIGHLIGHTS = [
  { icon: ScanFace, title: "Face recognition", subtitle: "Accurate & instant" },
  { icon: Mic, title: "Voice roll-call", subtitle: "AI matches voices" },
  { icon: ClipboardCheck, title: "Smart reports", subtitle: "Insights in seconds" },
]

export default function LandingPage() {
  return (
    <div className="min-h-svh scroll-smooth">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 sm:px-10">
        <Logo />
        <Button variant="outline" asChild className="rounded-full">
          <Link to="/login">
            Sign in
            <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      </header>

      <main>
        <section className="relative mx-auto max-w-6xl px-6 pt-8 pb-20 sm:px-10 sm:pt-12">
          <DotGridBackground className="-z-10" />

          <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
            <div className="text-center lg:text-left">
              <Badge
                variant="outline"
                className="border-primary/20 bg-primary/5 text-primary mx-auto lg:mx-0"
              >
                <Sparkles className="size-3" />
                AI-powered attendance
              </Badge>

              <h1 className="mt-5 text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                Attendance that
                <br />
                <span className="text-brand-gradient">takes itself.</span>
              </h1>

              <p className="text-muted-foreground mx-auto mt-5 max-w-lg text-lg text-balance lg:mx-0">
                Face and voice recognition for the classroom. Point a camera
                at the room, and let the roll call happen on its own.
              </p>

              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <Button size="lg" asChild className="w-full sm:w-auto">
                  <a href="#get-started">
                    Get started
                    <ArrowRight />
                  </a>
                </Button>
                <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
                  <Link to="/login">Sign in to your account</Link>
                </Button>
              </div>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-4 lg:justify-start">
                {HERO_HIGHLIGHTS.map(({ icon: Icon, title, subtitle }) => (
                  <div key={title} className="flex items-center gap-2.5">
                    <span className="bg-accent text-accent-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
                      <Icon className="size-4" strokeWidth={1.9} />
                    </span>
                    <div className="text-left">
                      <p className="text-sm leading-tight font-medium">{title}</p>
                      <p className="text-muted-foreground text-xs leading-tight">
                        {subtitle}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <HeroPreviewCard />
          </div>
        </section>

        <section id="get-started" className="mx-auto max-w-5xl scroll-mt-10 px-6 pb-20 sm:px-10">
          <div className="text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Choose your role to get started
            </h2>
            <p className="text-muted-foreground mt-2">
              Different tools for students and teachers.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <RoleCard
              role="student"
              icon={GraduationCap}
              eyebrow="For students"
              title="I'm a Student"
              description="Sign in with your face, join classes with a code, and keep track of your own attendance."
              ctaLabel="Continue as Student"
            />
            <RoleCard
              role="teacher"
              icon={Presentation}
              eyebrow="For teachers"
              title="I'm a Teacher"
              description="Create subjects, scan the classroom, and let AI mark who showed up — you just confirm it."
              ctaLabel="Continue as Teacher"
            />
          </div>

          <div className="text-muted-foreground mt-14 flex items-center justify-center gap-2 text-sm">
            <ShieldCheck className="text-primary size-4" />
            Secure and private — built for education.
          </div>
        </section>
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
  icon: Icon,
  eyebrow,
  title,
  description,
  ctaLabel,
}: {
  role: "student" | "teacher"
  icon: typeof GraduationCap
  eyebrow: string
  title: string
  description: string
  ctaLabel: string
}) {
  return (
    <Card
      className={cn(
        "group ring-foreground/10 hover:ring-primary/30 relative gap-0 overflow-hidden rounded-3xl p-0 transition-all duration-300",
        "hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-primary/10"
      )}
    >
      <div className="from-accent/70 absolute inset-0 bg-gradient-to-br via-transparent to-transparent" />
      <div className="bg-primary/10 group-hover:bg-primary/20 absolute -top-10 -right-10 size-36 rounded-full blur-2xl transition-colors duration-300" />

      <CardContent className="relative flex flex-col items-start gap-5 p-8 text-left">
        <span className="bg-card ring-foreground/5 flex size-14 items-center justify-center rounded-2xl shadow-md ring-1 transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105">
          <Icon className="text-primary size-7" strokeWidth={1.75} />
        </span>

        <div>
          <p className="text-primary text-xs font-semibold tracking-wide uppercase">
            {eyebrow}
          </p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight">{title}</h3>
          <p className="text-muted-foreground mt-2 text-sm text-balance">
            {description}
          </p>
        </div>

        <Button asChild size="lg" className="mt-2 w-full">
          <Link to={`/login?role=${role}`}>
            {ctaLabel}
            <ArrowRight className="transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
