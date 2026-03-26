import { emergencyContacts } from '../lib/publicContent'

export function EmergencyNumbersPage() {
  return (
    <section className="info-page">
      <div className="info-page-header">
        <p className="eyebrow">Public information</p>
        <h1>Emergency contact numbers</h1>
        <p className="lead-copy">Keep these numbers close so they are easy to reach in an emergency.</p>
      </div>

      <div className="info-grid">
        {emergencyContacts.map((contact) => (
          <article className="info-card" key={contact.number}>
            <p className="info-card-label">{contact.name}</p>
            <h2>{contact.number}</h2>
            <p>{contact.note}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
