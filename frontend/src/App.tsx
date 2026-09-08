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
import TeacherAttendancePage from "@/pages/teacher/TeacherAttendancePage"
import TeacherSubjectClassesPage from "@/pages/teacher/TeacherSubjectClassesPage"
import TeacherTimetablePage from "@/pages/teacher/TeacherTimetablePage"
import StudentDashboardPage from "@/pages/student/StudentDashboardPage"
import StudentSubjectsPage from "@/pages/student/StudentSubjectsPage"
import StudentProfilePage from "@/pages/student/StudentProfilePage"
import StudentAttendancePage from "@/pages/student/StudentAttendancePage"
import StudentSubjectAttendancePage from "@/pages/student/StudentSubjectAttendancePage"
import StudentTimetablePage from "@/pages/student/StudentTimetablePage"

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
            path="/t/timetable"
            element={
              <ProtectedRoute requiredRole="teacher">
                <AppShell>
                  <TeacherTimetablePage />
                </AppShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/t/subjects/:subjectId/classes"
            element={
              <ProtectedRoute requiredRole="teacher">
                <AppShell>
                  <TeacherSubjectClassesPage />
                </AppShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/t/attendance/:subjectId"
            element={
              <ProtectedRoute requiredRole="teacher">
                <AppShell>
                  <TeacherAttendancePage />
                </AppShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/t/attendance/:subjectId/history"
            element={
              <ProtectedRoute requiredRole="teacher">
                <AppShell>
                  <TeacherSubjectClassesPage />
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
            path="/s/timetable"
            element={
              <ProtectedRoute requiredRole="student">
                <AppShell>
                  <StudentTimetablePage />
                </AppShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/s/attendance"
            element={
              <ProtectedRoute requiredRole="student">
                <AppShell>
                  <StudentAttendancePage />
                </AppShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/s/attendance/:subjectId"
            element={
              <ProtectedRoute requiredRole="student">
                <AppShell>
                  <StudentSubjectAttendancePage />
                </AppShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/s/attendance/:subjectId/history"
            element={
              <ProtectedRoute requiredRole="student">
                <AppShell>
                  <StudentSubjectAttendancePage />
                </AppShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/s/profile"
            element={
              <ProtectedRoute requiredRole="student">
                <AppShell>
                  <StudentProfilePage />
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
