import { Routes, Route, Navigate } from 'react-router-dom';
import RequireAuth from './components/auth/RequireAuth';
import RequireAdmin from './components/auth/RequireAdmin';
import AppShell from './components/layout/AppShell';
import SignIn from './pages/Auth/SignIn';
import FirebaseSetup from './pages/Setup/FirebaseSetup';
import StudentDashboard from './pages/Student/StudentDashboard';
import CourseOverview from './pages/Student/CourseOverview';
import LessonPlayer from './pages/Student/LessonPlayer';
import AdminDashboard from './pages/Admin/AdminDashboard';
import Students from './pages/Admin/Students';
import StudentDetail from './pages/Admin/StudentDetail';
import AttemptDetail from './pages/Admin/AttemptDetail';
import AdminUsers from './pages/Admin/AdminUsers';
import Courses from './pages/Admin/Courses';
import CourseEditor from './pages/Admin/CourseEditor';
import Assignments from './pages/Admin/Assignments';

export default function App() {
  return (
    <Routes>
      <Route path="/signin" element={<SignIn />} />
      <Route path="/setup" element={<FirebaseSetup />} />
      <Route element={<RequireAuth><AppShell /></RequireAuth>}>
        <Route index element={<StudentDashboard />} />
        <Route path="course/:courseId" element={<CourseOverview />} />
        <Route path="course/:courseId/lesson/:lessonId" element={<LessonPlayer />} />
        <Route path="admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
        <Route path="admin/students" element={<RequireAdmin><Students /></RequireAdmin>} />
        <Route path="admin/students/:uid" element={<RequireAdmin><StudentDetail /></RequireAdmin>} />
        <Route path="admin/attempts/:attemptId" element={<RequireAdmin><AttemptDetail /></RequireAdmin>} />
        <Route path="admin/users" element={<RequireAdmin><AdminUsers /></RequireAdmin>} />
        <Route path="admin/courses" element={<RequireAdmin><Courses /></RequireAdmin>} />
        <Route path="admin/courses/:courseId" element={<RequireAdmin><CourseEditor /></RequireAdmin>} />
        <Route path="admin/assignments" element={<RequireAdmin><Assignments /></RequireAdmin>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
