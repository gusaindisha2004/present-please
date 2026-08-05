import { useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Check, Copy } from "lucide-react"
import { toast } from "sonner"

import type { Subject } from "@/types/database"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

async function copyToClipboard(text: string) {
  await navigator.clipboard.writeText(text)
}

export function ShareSubjectDialog({
  subject,
  onOpenChange,
}: {
  subject: Subject | null
  onOpenChange: (open: boolean) => void
}) {
  const [copied, setCopied] = useState<"link" | "code" | null>(null)

  if (!subject) return null

  const joinUrl = `${window.location.origin}/join/${subject.join_code}`

  const handleCopy = async (text: string, which: "link" | "code") => {
    await copyToClipboard(text)
    setCopied(which)
    toast.success("Copied to clipboard")
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <Dialog open={!!subject} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share {subject.name}</DialogTitle>
          <DialogDescription>
            Students can scan the code or use the link below to join.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-5 py-2">
          <div className="ring-foreground/10 rounded-2xl bg-white p-4 ring-1">
            <QRCodeSVG value={joinUrl} size={168} fgColor="#1e1b4b" level="M" />
          </div>

          <div className="w-full space-y-2">
            <div className="flex items-center gap-2">
              <code className="bg-secondary text-secondary-foreground flex-1 truncate rounded-lg px-3 py-2 text-sm">
                {joinUrl}
              </code>
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => handleCopy(joinUrl, "link")}
              >
                {copied === "link" ? <Check className="text-success" /> : <Copy />}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <code className="bg-secondary text-secondary-foreground flex-1 rounded-lg px-3 py-2 text-center text-lg font-semibold tracking-[0.3em]">
                {subject.join_code}
              </code>
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => handleCopy(subject.join_code, "code")}
              >
                {copied === "code" ? <Check className="text-success" /> : <Copy />}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
