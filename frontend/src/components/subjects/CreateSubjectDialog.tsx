import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"

import { supabase } from "@/lib/supabase"
import type { Subject } from "@/types/database"
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
  name: z.string().min(1, "Enter a subject name"),
  code: z.string().min(1, "Enter a subject code").max(20, "Keep it short"),
  section: z.string().min(1, "Enter a section"),
})

export function CreateSubjectDialog({
  teacherId,
  onCreated,
}: {
  teacherId: string
  onCreated: (subject: Subject) => void
}) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", code: "", section: "" },
  })

  const onSubmit = async (values: z.infer<typeof schema>) => {
    setSubmitting(true)
    const { data, error } = await supabase
      .from("subjects")
      .insert({ ...values, teacher_id: teacherId })
      .select()
      .single()

    if (error) {
      toast.error(
        error.code === "23505"
          ? "You already have a subject with that code"
          : error.message
      )
      setSubmitting(false)
      return
    }

    toast.success("Subject created!")
    form.reset()
    setSubmitting(false)
    setOpen(false)
    onCreated(data as Subject)
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
          Create Subject
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new subject</DialogTitle>
          <DialogDescription>
            Students enroll using a code you can share after this.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject name</FormLabel>
                  <FormControl>
                    <Input placeholder="Introduction to Computer Science" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject code</FormLabel>
                    <FormControl>
                      <Input placeholder="CS101" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="section"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Section</FormLabel>
                    <FormControl>
                      <Input placeholder="A" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="animate-spin" />}
                Create Subject
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
