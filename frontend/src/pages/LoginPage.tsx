import { useEffect, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { GraduationCap, Presentation, Loader2, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/AuthContext"
import type { Role } from "@/types/database"
import { AuthSplitLayout } from "@/components/layout/AuthSplitLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
})

export default function LoginPage() {
  const [searchParams] = useSearchParams()
  const role: Role = searchParams.get("role") === "teacher" ? "teacher" : "student"
  const navigate = useNavigate()
  const { user, profile, loading: authLoading } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!authLoading && user && profile) {
      navigate(profile.role === "teacher" ? "/t" : "/s", { replace: true })
    }
  }, [authLoading, user, profile, navigate])

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    setSubmitting(true)
    const { data, error } = await supabase.auth.signInWithPassword(values)

    if (error) {
      toast.error(error.message)
      setSubmitting(false)
      return
    }

    const { data: profileRowRaw } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single()
    const profileRow = profileRowRaw as { role: Role } | null

    if (!profileRow) {
      toast.error("Signed in, but couldn't load your profile.")
      setSubmitting(false)
      return
    }

    toast.success("Welcome back!")
    navigate(profileRow.role === "teacher" ? "/t" : "/s", { replace: true })
  }

  return (
    <AuthSplitLayout
      icon={role === "teacher" ? Presentation : GraduationCap}
      heading={role === "teacher" ? "Welcome back, teacher" : "Welcome back!"}
      subheading={
        role === "teacher"
          ? "Sign in to take attendance and manage your subjects."
          : "Sign in to view your subjects and attendance history."
      }
      features={
        role === "teacher"
          ? [
              "Scan classroom photos and let AI mark attendance",
              "Track every subject's attendance in one place",
              "Export reports whenever you need them",
            ]
          : [
              "Sign in with your face — no password to remember",
              "Join classes instantly with a share code",
              "See your attendance history at a glance",
            ]
      }
    >
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          {role === "teacher" ? "Teacher sign in" : "Student sign in"}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {role === "teacher" ? "Not a teacher?" : "Not a student?"}{" "}
          <Link
            to={`/login?role=${role === "teacher" ? "student" : "teacher"}`}
            className="text-primary underline-offset-4 hover:underline"
          >
            Switch to {role === "teacher" ? "student" : "teacher"} sign in
          </Link>
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="you@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex items-center pr-3"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting && <Loader2 className="animate-spin" />}
            Sign in
          </Button>
        </form>
      </Form>

      <p className="text-muted-foreground mt-6 text-center text-sm">
        Don't have an account?{" "}
        <Link
          to={`/signup?role=${role}`}
          className="text-primary underline-offset-4 hover:underline"
        >
          Create one
        </Link>
      </p>
    </AuthSplitLayout>
  )
}
