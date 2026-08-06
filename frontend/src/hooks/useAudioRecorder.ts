import { useCallback, useEffect, useRef, useState } from "react"

import { blobToWav } from "@/lib/audio"

type RecorderState = "idle" | "recording" | "processing"

export function useAudioRecorder() {
  const [state, setState] = useState<RecorderState>("idle")
  const [wavBlob, setWavBlob] = useState<Blob | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  const clearPreview = useCallback(() => {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
  }, [])

  const start = useCallback(async () => {
    setError(null)
    setWavBlob(null)
    clearPreview()

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []

      const recorder = new MediaRecorder(stream)
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = async () => {
        setState("processing")
        streamRef.current?.getTracks().forEach((track) => track.stop())
        try {
          const rawBlob = new Blob(chunksRef.current, { type: recorder.mimeType })
          const wav = await blobToWav(rawBlob)
          setWavBlob(wav)
          setPreviewUrl(URL.createObjectURL(wav))
        } catch {
          setError("Couldn't process that recording — try again")
        } finally {
          setState("idle")
        }
      }

      recorderRef.current = recorder
      recorder.start()
      setState("recording")
    } catch {
      setError("Microphone access denied or unavailable")
      setState("idle")
    }
  }, [clearPreview])

  const stop = useCallback(() => {
    recorderRef.current?.stop()
  }, [])

  const reset = useCallback(() => {
    setWavBlob(null)
    setError(null)
    clearPreview()
  }, [clearPreview])

  useEffect(() => clearPreview, [clearPreview])

  return { state, wavBlob, previewUrl, error, start, stop, reset }
}
