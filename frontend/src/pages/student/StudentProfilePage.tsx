import { FacePhotoManager } from "@/components/profile/FacePhotoManager"
import { VoiceEnrollmentCard } from "@/components/profile/VoiceEnrollmentCard"

export default function StudentProfilePage() {
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
    </div>
  )
}
