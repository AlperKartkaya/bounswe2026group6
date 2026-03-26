import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { ApiError } from '../lib/api'
import { useAuth } from '../context/AuthContext'

export function SignupPage() {
  const { signupUser } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setSuccessMessage(null)
    setErrorMessage(null)

    try {
      const response = await signupUser({ email, password, acceptedTerms })
      setSuccessMessage(response.message)
      setEmail('')
      setPassword('')
      setAcceptedTerms(false)
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Unable to create your account.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="form-card">
      <p className="eyebrow">Authentication</p>
      <h1>Create your account</h1>
      <p className="form-copy">Use an email address you can access so you can verify your account.</p>

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
            autoComplete="new-password"
            minLength={8}
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>

        <label className="checkbox-row">
          <input
            checked={acceptedTerms}
            onChange={(event) => setAcceptedTerms(event.target.checked)}
            required
            type="checkbox"
          />
          <span>I accept the terms and conditions.</span>
        </label>

        {successMessage ? <p className="form-success">{successMessage}</p> : null}
        {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

        <button className="primary-button" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="muted-copy">
        Already registered? <Link to="/login">Go to login.</Link>
      </p>
    </section>
  )
}
