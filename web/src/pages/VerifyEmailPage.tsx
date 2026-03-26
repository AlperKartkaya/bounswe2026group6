import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { ApiError, resendVerification, verifyEmail } from '../lib/api'

type VerificationState = 'idle' | 'loading' | 'success' | 'error'

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const email = searchParams.get('email') || ''
  const [state, setState] = useState<VerificationState>('idle')
  const [message, setMessage] = useState('Checking your verification...')
  const [isResending, setIsResending] = useState(false)

  const canResend = useMemo(() => !token && !!email, [email, token])

  useEffect(() => {
    async function runVerification() {
      if (!token) {
        setState('error')
        setMessage('We could not verify your email from this link. Please use the email we sent you or request a new one.')
        return
      }

      setState('loading')

      try {
        const response = await verifyEmail(token)
        setState('success')
        setMessage(response.message)
      } catch (error) {
        setState('error')
        setMessage(error instanceof ApiError ? error.message : 'We could not verify your email right now.')
      }
    }

    void runVerification()
  }, [token])

  async function handleResend() {
    if (!email) {
      return
    }

    setIsResending(true)

    try {
      const response = await resendVerification(email)
      setState('success')
      setMessage(response.message)
    } catch (error) {
      setState('error')
      setMessage(error instanceof ApiError ? error.message : 'We could not resend the verification email right now.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <section className="form-card status-card">
      <p className="eyebrow">Verification</p>
      <h1>Email verification</h1>
      <p className={`status-copy status-copy-${state}`}>{message}</p>

      {canResend ? (
        <button className="secondary-button" disabled={isResending} onClick={handleResend} type="button">
          {isResending ? 'Resending...' : 'Resend verification email'}
        </button>
      ) : null}

      <p className="muted-copy">
        <Link to="/login">Back to login</Link>
      </p>
    </section>
  )
}
