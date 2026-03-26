import { useEffect, useState } from 'react'

import { useAuth } from '../../context/AuthContext'
import { ApiError, getAdminUsers, type AdminUserRecord } from '../../lib/api'

function formatDate(value: string) {
  return new Date(value).toLocaleString()
}

export function AdminUsersPage() {
  const { accessToken } = useAuth()
  const [users, setUsers] = useState<AdminUserRecord[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadUsers() {
      if (!accessToken) {
        return
      }

      setIsLoading(true)
      setErrorMessage(null)

      try {
        const response = await getAdminUsers(accessToken)
        setUsers(response.users)
      } catch (error) {
        setErrorMessage(error instanceof ApiError ? error.message : 'Unable to load users.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadUsers()
  }, [accessToken])

  return (
    <section className="info-page">
      <div className="info-page-header">
        <p className="eyebrow">Admin</p>
        <h1>Registered users</h1>
      </div>

      {isLoading ? <p className="status-copy">Loading users...</p> : null}
      {!isLoading && errorMessage ? <p className="form-error">{errorMessage}</p> : null}

      {!isLoading && !errorMessage ? (
        <div className="admin-table-shell">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Verified</th>
                <th>Accepted terms</th>
                <th>Deactivated</th>
                <th>Admin role</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.user_id}>
                  <td>{user.email}</td>
                  <td>{user.is_email_verified ? 'Yes' : 'No'}</td>
                  <td>{user.accepted_terms ? 'Yes' : 'No'}</td>
                  <td>{user.is_deleted ? 'Yes' : 'No'}</td>
                  <td>{user.admin_role || '—'}</td>
                  <td>{formatDate(user.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  )
}
