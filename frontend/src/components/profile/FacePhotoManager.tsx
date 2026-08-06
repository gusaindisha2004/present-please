import { useEffect, useRef, useState } from "react"
import { ScanFace, Plus, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { apiFetch, ApiError } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { BlobIllustration } from "@/components/illustrations/BlobIllustration"

interface FacePhoto {
  id: string
  url: string | null
  created_at: string
}

interface EnrollResult {
  enrolled: number
  skipped: { filename: string | null; reason: string }[]
}

export function FacePhotoManager() {
  const [photos, setPhotos] = useState<FacePhoto[] | null>(null)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadPhotos = async () => {
    try {
      const res = await apiFetch<{ photos: FacePhoto[] }>("/api/face/photos")
      setPhotos(res.photos)
    } catch {
      toast.error("Couldn't load your face photos")
      setPhotos([])
    }
  }

  useEffect(() => {
    loadPhotos()
  }, [])

  const handleFiles = async (fileList: FileList) => {
    setUploading(true)
    const formData = new FormData()
    Array.from(fileList).forEach((file) => formData.append("files", file))

    try {
      const res = await apiFetch<EnrollResult>("/api/face/enroll", {
        method: "POST",
        body: formData,
      })

      if (res.enrolled > 0) {
        toast.success(
          `Added ${res.enrolled} photo${res.enrolled > 1 ? "s" : ""}`
        )
      }
      for (const skip of res.skipped) {
        toast.error(`${skip.filename ?? "Photo"}: ${skip.reason}`)
      }
      await loadPhotos()
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Couldn't upload photos"
      )
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await apiFetch(`/api/face/photos/${id}`, { method: "DELETE" })
      setPhotos((prev) => prev?.filter((p) => p.id !== id) ?? null)
      toast.success("Photo removed")
    } catch {
      toast.error("Couldn't remove that photo")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScanFace className="text-primary size-5" />
          Face photos
        </CardTitle>
        <CardDescription>
          Add a few clear photos of your face. More angles help the AI
          recognize you more reliably.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="user"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />

        {photos === null ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="group ring-foreground/10 relative aspect-square overflow-hidden rounded-xl ring-1"
              >
                {photo.url && (
                  <img
                    src={photo.url}
                    alt="Enrolled face"
                    className="size-full object-cover"
                  />
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(photo.id)}
                  disabled={deletingId === photo.id}
                  className="bg-background/80 text-destructive absolute inset-0 flex items-center justify-center opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 disabled:opacity-100"
                >
                  {deletingId === photo.id ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <Trash2 className="size-5" />
                  )}
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="border-border text-muted-foreground hover:border-primary/40 hover:text-primary flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed text-xs font-medium transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <>
                  <Plus className="size-5" />
                  Add
                </>
              )}
            </button>
          </div>
        )}

        {photos !== null && photos.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <BlobIllustration icon={ScanFace} className="scale-[0.6]" />
            <p className="text-muted-foreground max-w-xs text-sm text-balance">
              No photos yet. Add one to enable face sign-in and attendance.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
