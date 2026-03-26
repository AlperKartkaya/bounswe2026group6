import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import {
  ApiError,
  clearStoredToken,
  getCurrentUser,
  getStoredToken,
  login,
  setStoredToken,
  signup,
  type AuthUser,
  type LoginPayload,
  type SignupPayload,
} from '../lib/api'

type AuthContextValue = {
  accessToken: string | null
  currentUser: AuthUser | null
  isBootstrapping: boolean
  loginUser: (payload: LoginPayload) => Promise<void>
  signupUser: (payload: SignupPayload) => Promise<{ message: string; user: AuthUser }>
  logoutUser: () => void
  refreshCurrentUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(() => getStoredToken())
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)

  const logoutUser = useCallback(() => {
    clearStoredToken()
    setAccessToken(null)
    setCurrentUser(null)
  }, [])

  const refreshCurrentUser = useCallback(async () => {
    if (!accessToken) {
      setCurrentUser(null)
      return
    }

    try {
      const user = await getCurrentUser(accessToken)
      setCurrentUser(user)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logoutUser()
        return
      }

      throw error
    }
  }, [accessToken, logoutUser])

  useEffect(() => {
    async function bootstrap() {
      try {
        if (accessToken) {
          await refreshCurrentUser()
        }
      } finally {
        setIsBootstrapping(false)
      }
    }

    void bootstrap()
  }, [accessToken, refreshCurrentUser])

  const loginUser = useCallback(async (payload: LoginPayload) => {
    const response = await login(payload)
    setStoredToken(response.accessToken)
    setAccessToken(response.accessToken)
    setCurrentUser(response.user)
  }, [])

  const signupUser = useCallback(async (payload: SignupPayload) => {
    return signup(payload)
  }, [])

  const value = useMemo(
    () => ({
      accessToken,
      currentUser,
      isBootstrapping,
      loginUser,
      signupUser,
      logoutUser,
      refreshCurrentUser,
    }),
    [accessToken, currentUser, isBootstrapping, loginUser, signupUser, logoutUser, refreshCurrentUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.')
  }

  return context
}
