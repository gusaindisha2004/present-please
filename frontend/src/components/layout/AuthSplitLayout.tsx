import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { GraduationCap, type LucideIcon } from "lucide-react"

import { BlobIllustration } from "@/components/illustrations/BlobIllustration"

export function AuthSplitLayout({
  icon,
  heading,
  subheading,
  children,
}: {
  icon: LucideIcon
  heading: string
  subheading: string
  children: ReactNode
}) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="bg-accent/60 relative hidden flex-col justify-between p-10 lg:flex">
        <Link
          to="/"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight"
        >
          <GraduationCap className="text-primary size-6" />
          Present Please!
        </Link>

        <div className="flex flex-1 flex-col items-center justify-center gap-8">
          <BlobIllustration icon={icon} />
          <div className="max-w-sm text-center">
            <h2 className="text-xl font-semibold">{heading}</h2>
            <p className="text-muted-foreground mt-2 text-sm">{subheading}</p>
          </div>
        </div>

        <p className="text-muted-foreground text-xs">
          AI-powered attendance, without the roll call.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center p-6 sm:p-10">
        <Link
          to="/"
          className="mb-8 flex items-center gap-2 text-lg font-semibold tracking-tight lg:hidden"
        >
          <GraduationCap className="text-primary size-6" />
          Present Please!
        </Link>
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  )
}
