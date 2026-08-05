import { Link } from "react-router-dom"
import { Compass } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function NotFoundPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 text-center">
      <span className="bg-accent text-accent-foreground flex size-14 items-center justify-center rounded-2xl">
        <Compass className="size-6" strokeWidth={1.75} />
      </span>
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Page not found</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          That page doesn't exist, or you don't have access to it.
        </p>
      </div>
      <Button asChild>
        <Link to="/">Go home</Link>
      </Button>
    </div>
  )
}
