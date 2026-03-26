import { useEffect, useState } from 'react'

import { useAuth } from '../../context/AuthContext'
import { ApiError, getAdminAnnouncements, type AdminAnnouncementRecord } from '../../lib/api'

function formatDate(value: string) {
  return new Date(value).toLocaleString()
}

export function AdminAnnouncementsPage() {
  const { accessToken } = useAuth()
  const [announcements, setAnnouncements] = useState<AdminAnnouncementRecord[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadAnnouncements() {
      if (!accessToken) {
        return
      }

      setIsLoading(true)
      setErrorMessage(null)

      try {
        const response = await getAdminAnnouncements(accessToken)
        setAnnouncements(response.announcements)
      } catch (error) {
        setErrorMessage(error instanceof ApiError ? error.message : 'Unable to load announcements.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadAnnouncements()
  }, [accessToken])

  return (
    <section className="info-page">
      <div className="info-page-header">
        <p className="eyebrow">Admin</p>
        <h1>Announcements</h1>
      </div>

      {isLoading ? <p className="status-copy">Loading announcements...</p> : null}
      {!isLoading && errorMessage ? <p className="form-error">{errorMessage}</p> : null}

      {!isLoading && !errorMessage ? (
        <div className="updates-list">
          {announcements.map((announcement) => (
            <article className="update-card" key={announcement.announcement_id}>
              <p className="update-tag">Created {formatDate(announcement.created_at)}</p>
              <h2>{announcement.title}</h2>
              <p>{announcement.content}</p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  )
}
