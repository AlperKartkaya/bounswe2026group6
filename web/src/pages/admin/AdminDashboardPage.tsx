import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'
import { ApiError, getAdminStats, type AdminStats } from '../../lib/api'

const statCards = [
  { key: 'totalUsers', label: 'Registered users' },
  { key: 'totalHelpRequests', label: 'Help requests' },
  { key: 'totalAnnouncements', label: 'Announcements' },
  { key: 'totalAdmins', label: 'Admins' },
] as const

export function AdminDashboardPage() {
  const { accessToken, currentUser } = useAuth()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      if (!accessToken) {
        return
      }

      setIsLoading(true)
      setErrorMessage(null)

      try {
        const response = await getAdminStats(accessToken)
        setStats(response.stats)
      } catch (error) {
        setErrorMessage(error instanceof ApiError ? error.message : 'Unable to load admin stats.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadStats()
  }, [accessToken])

  return (
    <section className="info-page">
      <div className="info-page-header">
        <p className="eyebrow">Admin</p>
        <h1>Admin dashboard</h1>
        <p className="lead-copy">Signed in as {currentUser?.email}.</p>
      </div>

      {isLoading ? <p className="status-copy">Loading admin stats...</p> : null}
      {!isLoading && errorMessage ? <p className="form-error">{errorMessage}</p> : null}

      {stats ? (
        <div className="info-grid">
          {statCards.map((item) => (
            <article className="info-card" key={item.key}>
              <p className="info-card-label">Overview</p>
              <h2>{stats[item.key]}</h2>
              <p>{item.label}</p>
            </article>
          ))}
        </div>
      ) : null}

      <section className="panel-card section-stack">
        <div className="section-intro">
          <p className="eyebrow">Admin tools</p>
          <h2>Available pages</h2>
        </div>

        <div className="info-grid">
          <article className="info-card">
            <p className="info-card-label">Users</p>
            <h3>Registered users</h3>
            <p>Review account status, verification, and roles.</p>
            <Link className="secondary-button" to="/admin/users">
              Open users
            </Link>
          </article>

          <article className="info-card">
            <p className="info-card-label">Requests</p>
            <h3>Help requests</h3>
            <p>Review help requests and their status.</p>
            <Link className="secondary-button" to="/admin/help-requests">
              Open requests
            </Link>
          </article>

          <article className="info-card">
            <p className="info-card-label">Announcements</p>
            <h3>Preparedness updates</h3>
            <p>Review current announcements.</p>
            <Link className="secondary-button" to="/admin/announcements">
              Open announcements
            </Link>
          </article>
        </div>
      </section>
    </section>
  )
}
