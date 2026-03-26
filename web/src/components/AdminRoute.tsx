import { Navigate, Outlet } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'

export function AdminRoute() {
  const { currentUser, isBootstrapping } = useAuth()

  if (isBootstrapping) {
    return (
      <div className="page-shell">
        <p className="status-copy">Checking admin access...</p>
      </div>
    )
  }

  if (!currentUser?.isAdmin) {
    return <Navigate replace to="/profile" />
  }

  return <Outlet />
}
