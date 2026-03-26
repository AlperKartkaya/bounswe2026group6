import { Link } from 'react-router-dom'

import { workflowSteps } from '../lib/publicContent'

export function HomePage() {
  return (
    <div className="home-stack">
      <div className="hero-grid">
        <section className="hero-card hero-card-primary">
          <p className="eyebrow">Neighborhood support</p>
          <h1>Preparedness first. Clear access when things get chaotic.</h1>
          <p className="lead-copy">
            Find emergency contacts, stay informed, and keep your account and profile ready before an emergency happens.
          </p>
          <div className="hero-actions">
            <Link className="primary-button" to="/signup">
              Create account
            </Link>
            <Link className="secondary-button" to="/login">
              Log in
            </Link>
          </div>
        </section>

        <section className="hero-card hero-card-secondary">
          <h2>What you can do here</h2>
          <ul className="feature-list">
            <li>Create an account and sign in securely</li>
            <li>Verify your email address</li>
            <li>View and update your profile</li>
            <li>See emergency numbers and local updates</li>
          </ul>
        </section>
      </div>

      <section className="panel-card section-stack">
        <div className="section-intro">
          <p className="eyebrow">How it works</p>
          <h2>How this works</h2>
        </div>

        <div className="info-grid">
          {workflowSteps.map((step, index) => (
            <article className="info-card" key={step.title}>
              <p className="info-card-label">Step {index + 1}</p>
              <h3>{step.title}</h3>
              <p>{step.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel-card section-stack">
        <div className="section-intro">
          <p className="eyebrow">Public pages</p>
          <h2>Explore public pages</h2>
        </div>

        <div className="info-grid">
          <article className="info-card">
            <p className="info-card-label">Emergency numbers</p>
            <h3>Quick access contacts</h3>
            <p>Open a quick list of emergency and disaster contact numbers.</p>
            <Link className="secondary-button" to="/emergency-numbers">
              View numbers
            </Link>
          </article>

          <article className="info-card">
            <p className="info-card-label">Preparedness updates</p>
            <h3>News and announcements</h3>
            <p>Read safety tips, community reminders, and public updates.</p>
            <Link className="secondary-button" to="/news">
              View updates
            </Link>
          </article>
        </div>
      </section>
    </div>
  )
}
