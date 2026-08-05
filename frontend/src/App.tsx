import { Routes, Route } from "react-router-dom"

import { AuthProvider } from "@/context/AuthContext"
import { ProtectedRoute } from "@/routes/ProtectedRoute"
import { AppShell } from "@/components/layout/AppShell"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"

import LandingPage from "@/pages/LandingPage"
import LoginPage from "@/pages/LoginPage"
import SignupPage from "@/pages/SignupPage"
import NotFoundPage from "@/pages/NotFoundPage"
import JoinByCodePage from "@/pages/JoinByCodePage"
import TeacherDashboardPage from "@/pages/teacher/TeacherDashboardPage"
import TeacherSubjectsPage from "@/pages/teacher/TeacherSubjectsPage"
import StudentDashboardPage from "@/pages/student/StudentDashboardPage"
import StudentSubjectsPage from "@/pages/student/StudentSubjectsPage"

function App() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          <Route
            path="/t"
            element={
              <ProtectedRoute requiredRole="teacher">
                <AppShell>
                  <TeacherDashboardPage />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/t/subjects"
            element={
              <ProtectedRoute requiredRole="teacher">
                <AppShell>
                  <TeacherSubjectsPage />
                </AppShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/s"
            element={
              <ProtectedRoute requiredRole="student">
                <AppShell>
                  <StudentDashboardPage />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/s/subjects"
            element={
              <ProtectedRoute requiredRole="student">
                <AppShell>
                  <StudentSubjectsPage />
                </AppShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/join/:code"
            element={
              <ProtectedRoute requiredRole="student">
                <JoinByCodePage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <Toaster />
      </TooltipProvider>
    </AuthProvider>
  )
}

export default App
