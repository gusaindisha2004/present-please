import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"

import { apiFetch, ApiError } from "@/lib/api"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const schema = z.object({
  code: z.string().min(1, "Enter a class code"),
})

interface SubjectLookup {
  id: string
  name: string
  code: string
  section: string
}

export function EnrollDialog({
  studentId,
  onEnrolled,
}: {
  studentId: string
  onEnrolled: () => void
}) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { code: "" },
  })

  const onSubmit = async ({ code }: z.infer<typeof schema>) => {
    setSubmitting(true)
    try {
      const subject = await apiFetch<SubjectLookup>(
        `/api/subjects/lookup/${encodeURIComponent(code.trim())}`
      )

      const { data: existing } = await supabase
        .from("enrollments")
        .select("id")
        .eq("subject_id", subject.id)
        .eq("student_id", studentId)
        .maybeSingle()

      if (existing) {
        toast.info("You're already enrolled in this subject")
        setOpen(false)
        return
      }

      const { error } = await supabase
        .from("enrollments")
        .insert({ subject_id: subject.id, student_id: studentId })

      if (error) throw error

      toast.success(`Enrolled in ${subject.name}!`)
      form.reset()
      setOpen(false)
      onEnrolled()
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? "No subject found for that code"
          : "Couldn't enroll — please try again"
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) form.reset()
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus />
          Enroll in Subject
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enroll in a subject</DialogTitle>
          <DialogDescription>
            Enter the join code your teacher shared with you.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Join code</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Eg. 7F3K9Q"
                      className="text-center text-lg tracking-[0.3em] uppercase"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="animate-spin" />}
                Enroll now
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
