import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { CheckCircle2, type LucideIcon } from "lucide-react"

import { BlobIllustration } from "@/components/illustrations/BlobIllustration"
import { DotGridBackground } from "@/components/decoration/DotGridBackground"
import { Logo } from "@/components/branding/Logo"

export function AuthSplitLayout({
  icon,
  heading,
  subheading,
  features,
  children,
}: {
  icon: LucideIcon
  heading: string
  subheading: string
  features?: string[]
  children: ReactNode
}) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="bg-secondary/40 relative hidden flex-col justify-between overflow-hidden p-10 lg:flex">
        <DotGridBackground />

        <Link to="/" className="relative">
          <Logo />
        </Link>

        <div className="relative flex flex-1 flex-col items-center justify-center gap-8 py-10">
          <BlobIllustration icon={icon} />
          <div className="max-w-sm text-center">
            <h2 className="text-xl font-semibold tracking-tight">{heading}</h2>
            <p className="text-muted-foreground mt-2 text-sm text-balance">
              {subheading}
            </p>
          </div>

          {features && features.length > 0 && (
            <ul className="w-full max-w-xs space-y-3">
              {features.map((feature) => (
                <li
                  key={feature}
                  className="text-foreground/80 flex items-start gap-2.5 text-sm"
                >
                  <CheckCircle2 className="text-primary mt-0.5 size-4 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="text-muted-foreground relative text-xs">
          AI-powered attendance, without the roll call.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center p-6 sm:p-10">
        <Link to="/" className="mb-8 lg:hidden">
          <Logo />
        </Link>
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  )
}
