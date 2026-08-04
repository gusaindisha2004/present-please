import { useEffect, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  GraduationCap,
  Presentation,
  Loader2,
  Eye,
  EyeOff,
  MailCheck,
} from "lucide-react"
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

const baseSchema = {
  fullName: z.string().min(1, "Enter your full name"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Confirm your password"),
}

const studentSchema = z
  .object({ ...baseSchema, rollNumber: z.string().min(1, "Enter your roll number") })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

const teacherSchema = z
  .object(baseSchema)
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

export default function SignupPage() {
  const [searchParams] = useSearchParams()
  const role: Role = searchParams.get("role") === "teacher" ? "teacher" : "student"
  const navigate = useNavigate()
  const { user, profile, loading: authLoading } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false)

  useEffect(() => {
    if (!authLoading && user && profile) {
      navigate(profile.role === "teacher" ? "/t" : "/s", { replace: true })
    }
  }, [authLoading, user, profile, navigate])

  const schema = role === "student" ? studentSchema : teacherSchema
  const form = useForm<z.infer<typeof studentSchema>>({
    // Both branches validate the same field set the teacher form actually
    // submits; the cast just satisfies the shared form type below.
    resolver: zodResolver(schema as typeof studentSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      ...(role === "student" ? { rollNumber: "" } : {}),
    },
  })

  const onSubmit = async (values: z.infer<typeof studentSchema>) => {
    setSubmitting(true)
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          role,
          full_name: values.fullName,
          ...(role === "student" ? { roll_number: values.rollNumber } : {}),
        },
      },
    })

    if (error) {
      toast.error(error.message)
      setSubmitting(false)
      return
    }

    if (!data.session) {
      // Email confirmation is required before a session is issued.
      setAwaitingConfirmation(true)
      setSubmitting(false)
      return
    }

    toast.success("Account created!")
    navigate(role === "teacher" ? "/t" : "/s", { replace: true })
  }

  if (awaitingConfirmation) {
    return (
      <AuthSplitLayout
        icon={role === "teacher" ? Presentation : GraduationCap}
        heading="Almost there"
        subheading="Confirm your email to activate your account."
      >
        <div className="flex flex-col items-center text-center">
          <div className="bg-accent flex size-14 items-center justify-center rounded-full">
            <MailCheck className="text-primary size-6" />
          </div>
          <h1 className="mt-4 text-xl font-semibold">Check your inbox</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            We've sent a confirmation link to your email. Click it to
            activate your account, then sign in.
          </p>
          <Button asChild className="mt-6 w-full">
            <Link to={`/login?role=${role}`}>Go to sign in</Link>
          </Button>
        </div>
      </AuthSplitLayout>
    )
  }

  return (
    <AuthSplitLayout
      icon={role === "teacher" ? Presentation : GraduationCap}
      heading={role === "teacher" ? "Set up your classroom" : "Join your class"}
      subheading={
        role === "teacher"
          ? "Create subjects and let AI take attendance for you."
          : "Enroll with a code and sign in with just your face."
      }
    >
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Create your {role} account
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Wrong role?{" "}
          <Link
            to={`/signup?role=${role === "teacher" ? "student" : "teacher"}`}
            className="text-primary underline-offset-4 hover:underline"
          >
            Sign up as a {role === "teacher" ? "student" : "teacher"}
          </Link>
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <Input placeholder="Ananya Roy" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {role === "student" && (
            <FormField
              control={form.control}
              name="rollNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Roll number</FormLabel>
                  <FormControl>
                    <Input placeholder="21CS1042" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

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
                      placeholder="At least 6 characters"
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

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm password</FormLabel>
                <FormControl>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Re-enter your password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting && <Loader2 className="animate-spin" />}
            Create account
          </Button>
        </form>
      </Form>

      <p className="text-muted-foreground mt-6 text-center text-sm">
        Already have an account?{" "}
        <Link
          to={`/login?role=${role}`}
          className="text-primary underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </AuthSplitLayout>
  )
}
