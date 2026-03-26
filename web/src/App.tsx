import { Navigate, Route, Routes } from 'react-router-dom'

import { AdminRoute } from './components/AdminRoute'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Shell } from './components/Shell'
import { EmergencyNumbersPage } from './pages/EmergencyNumbersPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { NewsPage } from './pages/NewsPage'
import { ProfilePage } from './pages/ProfilePage'
import { SignupPage } from './pages/SignupPage'
import { VerifyEmailPage } from './pages/VerifyEmailPage'
import { AdminAnnouncementsPage } from './pages/admin/AdminAnnouncementsPage'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { AdminHelpRequestsPage } from './pages/admin/AdminHelpRequestsPage'
import { AdminUsersPage } from './pages/admin/AdminUsersPage'

function App() {
  return (
    <Routes>
      <Route element={<Shell />} path="/">
        <Route element={<HomePage />} index />
        <Route element={<EmergencyNumbersPage />} path="emergency-numbers" />
        <Route element={<NewsPage />} path="news" />
        <Route element={<LoginPage />} path="login" />
        <Route element={<SignupPage />} path="signup" />
        <Route element={<VerifyEmailPage />} path="verify-email" />

        <Route element={<ProtectedRoute />}>
          <Route element={<ProfilePage />} path="profile" />

          <Route element={<AdminRoute />}>
            <Route element={<AdminDashboardPage />} path="admin" />
            <Route element={<AdminUsersPage />} path="admin/users" />
            <Route element={<AdminHelpRequestsPage />} path="admin/help-requests" />
            <Route element={<AdminAnnouncementsPage />} path="admin/announcements" />
          </Route>
        </Route>

        <Route element={<Navigate replace to="/" />} path="*" />
      </Route>
    </Routes>
  )
}

export default App
