import { useEffect, useState } from 'react'

import { useAuth } from '../../context/AuthContext'
import { ApiError, getAdminHelpRequests, type AdminHelpRequestRecord } from '../../lib/api'

function formatDate(value: string) {
  return new Date(value).toLocaleString()
}

export function AdminHelpRequestsPage() {
  const { accessToken } = useAuth()
  const [requests, setRequests] = useState<AdminHelpRequestRecord[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadRequests() {
      if (!accessToken) {
        return
      }

      setIsLoading(true)
      setErrorMessage(null)

      try {
        const response = await getAdminHelpRequests(accessToken)
        setRequests(response.helpRequests)
      } catch (error) {
        setErrorMessage(error instanceof ApiError ? error.message : 'Unable to load help requests.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadRequests()
  }, [accessToken])

  return (
    <section className="info-page">
      <div className="info-page-header">
        <p className="eyebrow">Admin</p>
        <h1>Help requests</h1>
      </div>

      {isLoading ? <p className="status-copy">Loading help requests...</p> : null}
      {!isLoading && errorMessage ? <p className="form-error">{errorMessage}</p> : null}

      {!isLoading && !errorMessage ? (
        <div className="admin-table-shell">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Need type</th>
                <th>Status</th>
                <th>User</th>
                <th>Saved on device</th>
                <th>Created</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.request_id}>
                  <td>{request.need_type}</td>
                  <td>{request.status}</td>
                  <td>{request.user_id}</td>
                  <td>{request.is_saved_locally ? 'Yes' : 'No'}</td>
                  <td>{formatDate(request.created_at)}</td>
                  <td>{request.description || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  )
}
