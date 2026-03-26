import { preparednessUpdates } from '../lib/publicContent'

export function NewsPage() {
  return (
    <section className="info-page">
      <div className="info-page-header">
        <p className="eyebrow">Public information</p>
        <h1>Preparedness news and announcements</h1>
        <p className="lead-copy">Read preparedness updates, reminders, and community notices in one place.</p>
      </div>

      <div className="updates-list">
        {preparednessUpdates.map((item) => (
          <article className="update-card" key={item.title}>
            <p className="update-tag">{item.category}</p>
            <h2>{item.title}</h2>
            <p>{item.body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
