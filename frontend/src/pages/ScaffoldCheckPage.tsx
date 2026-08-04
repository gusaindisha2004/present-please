import { GraduationCap, ScanFace, Mic, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Temporary placeholder — replaced by the real landing page in Phase 1.
// Exists to prove the toolchain (Tailwind v4 tokens, shadcn/ui, lucide,
// Inter font, dark mode) actually renders end to end.
export default function ScaffoldCheckPage() {
  return (
    <div className="min-h-svh bg-background text-foreground flex items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <GraduationCap className="size-5 text-primary" />
            Present Please!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Phase 0 scaffold — routing, design tokens, and shadcn/ui
            components are wired up.
          </p>
          <div className="flex gap-2 flex-wrap">
            <Badge className="bg-success text-success-foreground">
              <CheckCircle2 className="size-3" /> Present
            </Badge>
            <Badge variant="destructive">Absent</Badge>
            <Badge className="bg-warning text-warning-foreground">
              Low confidence
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button>
              <ScanFace /> Face
            </Button>
            <Button variant="secondary">
              <Mic /> Voice
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
