# Screenshots

These are the images referenced by the root `README.md`.

All of them were captured from the running application at a 1440x900
viewport in light mode, against a seeded demo dataset (three teachers, six
subjects with weekly timetables, thirty enrolled students and several
conducted attendance sessions). No screenshot contains a real account.

| File | Page |
| --- | --- |
| `landing.png` | `/` |
| `login-teacher.png` | `/login?role=teacher` |
| `login-student.png` | `/login?role=student` |
| `signup.png` | `/signup` |
| `teacher-dashboard.png` | `/t` |
| `teacher-timetable.png` | `/t/timetable` |
| `teacher-class-detail.png` | `/t/timetable`, with a class opened |
| `teacher-subjects.png` | `/t/subjects` |
| `teacher-subject-classes.png` | `/t/subjects/:subjectId/classes` |
| `teacher-take-attendance.png` | `/t/attendance/:subjectId` |
| `student-dashboard.png` | `/s` |
| `student-timetable.png` | `/s/timetable` |
| `student-attendance.png` | `/s/attendance` |
| `student-subject-attendance.png` | `/s/attendance/:subjectId` |
| `student-subjects.png` | `/s/subjects` |
| `student-profile.png` | `/s/profile` |

To refresh them, run both servers, sign in as a teacher and a student, and
recapture at the same viewport so the set stays visually consistent. If you
automate it, hide toast notifications with CSS rather than removing the
nodes: the toaster is rendered by React, and removing it from the DOM
crashes the render and produces a blank page.
