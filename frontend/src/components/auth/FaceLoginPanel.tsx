import { useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Camera, Loader2, ScanFace } from "lucide-react"
import { toast } from "sonner"

import { apiFetch, ApiError } from "@/lib/api"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"

interface IdentifyResult {
  token_hash: string
  full_name: string
}

export function FaceLoginPanel() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [status, setStatus] = useState<"idle" | "checking">("idle")

  const handleCapture = async (file: File) => {
    setPreviewUrl(URL.createObjectURL(file))
    setStatus("checking")

    const formData = new FormData()
    formData.append("file", file)

    try {
      const result = await apiFetch<IdentifyResult>("/api/face/identify", {
        method: "POST",
        body: formData,
      })

      const { error } = await supabase.auth.verifyOtp({
        token_hash: result.token_hash,
        type: "magiclink",
      })

      if (error) {
        toast.error("Signed in, but couldn't start your session — try again")
        setStatus("idle")
        return
      }

      toast.success(`Welcome back, ${result.full_name.split(" ")[0]}!`)
      navigate("/s", { replace: true })
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Couldn't verify your face"
      )
      setStatus("idle")
      setPreviewUrl(null)
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <div className="flex flex-col items-center gap-5 py-2 text-center">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleCapture(file)
        }}
      />

      <div className="ring-foreground/10 relative flex size-40 items-center justify-center overflow-hidden rounded-full ring-1">
        {previewUrl ? (
          <img src={previewUrl} alt="" className="size-full object-cover" />
        ) : (
          <span className="bg-accent text-accent-foreground flex size-full items-center justify-center">
            <ScanFace className="size-14" strokeWidth={1.5} />
          </span>
        )}
        {status === "checking" && (
          <div className="bg-background/70 absolute inset-0 flex items-center justify-center backdrop-blur-sm">
            <Loader2 className="text-primary size-8 animate-spin" />
          </div>
        )}
      </div>

      <p className="text-muted-foreground max-w-xs text-sm text-balance">
        {status === "checking"
          ? "Checking your face…"
          : "Take a photo to sign in — make sure you're enrolled first."}
      </p>

      <Button
        type="button"
        className="w-full"
        onClick={() => fileInputRef.current?.click()}
        disabled={status === "checking"}
      >
        <Camera />
        {previewUrl ? "Try again" : "Take a photo"}
      </Button>
    </div>
  )
}
