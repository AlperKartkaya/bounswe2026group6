import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import { ApiError } from '../lib/api'

export function LoginPage() {
  const { loginUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const redirectPath = (location.state as { from?: string } | null)?.from || '/profile'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      await loginUser({ email, password })
      navigate(redirectPath, { replace: true })
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Unable to log in right now.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="form-card">
      <p className="eyebrow">Authentication</p>
      <h1>Log in to your account</h1>
      <p className="form-copy">Use the email address and password linked to your account.</p>

      <form className="stack-form" onSubmit={handleSubmit}>
        <label>
          <span>Email</span>
          <input
            autoComplete="email"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </label>

        <label>
          <span>Password</span>
          <input
            autoComplete="current-password"
            minLength={8}
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>

        {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

        <button className="primary-button" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Logging in...' : 'Log in'}
        </button>
      </form>

      <p className="muted-copy">
        Need an account? <Link to="/signup">Create one here.</Link>
      </p>
    </section>
  )
}
