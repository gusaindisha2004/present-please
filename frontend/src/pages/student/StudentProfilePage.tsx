import { useNavigate } from "react-router-dom"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

import { FacePhotoManager } from "@/components/profile/FacePhotoManager"
import { VoiceEnrollmentCard } from "@/components/profile/VoiceEnrollmentCard"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function StudentProfilePage() {
  const navigate = useNavigate()

  const handleDone = () => {
    toast.success("All saved!", {
      description:
        "Your face photos and voice recording are stored on your profile.",
    })
    navigate("/s/subjects")
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Your profile</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage the face and voice data used to recognize you for attendance.
        </p>
      </div>

      <FacePhotoManager />
      <VoiceEnrollmentCard />

      {/* Both cards above save as you go, which leaves the page feeling
          unfinished with nothing to press. This is the closing step: it
          confirms the state and gives somewhere to go next. */}
      <Card className="rounded-2xl">
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="text-success mt-0.5 size-5 shrink-0" />
            <div>
              <p className="text-sm font-medium">
                Everything here saves automatically
              </p>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Your photos and voice recording are stored as soon as you add
                them — there's nothing left to submit.
              </p>
            </div>
          </div>
          <Button onClick={handleDone}>
            Done
            <ArrowRight />
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
