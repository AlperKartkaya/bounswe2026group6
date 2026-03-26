import { API_BASE_URL, STORAGE_KEYS } from './config'

export type ApiErrorPayload = {
  code?: string
  message?: string
}

export class ApiError extends Error {
  status: number
  code: string

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.message || 'Something went wrong.')
    this.name = 'ApiError'
    this.status = status
    this.code = payload.code || 'UNKNOWN_ERROR'
  }
}

export type AuthUser = {
  userId: string
  email: string
  isEmailVerified: boolean
  acceptedTerms?: boolean
  createdAt?: string
  isAdmin?: boolean
  adminRole?: string | null
}

export type LoginResponse = {
  message: string
  accessToken: string
  user: AuthUser
}

export type SignupPayload = {
  email: string
  password: string
  acceptedTerms: boolean
}

export type LoginPayload = {
  email: string
  password: string
}

export type ProfileBundle = {
  profile: {
    profileId: string
    userId: string
    firstName: string
    lastName: string
    phoneNumber: string | null
  }
  privacySettings: {
    profileVisibility: string
    healthInfoVisibility: string
    locationVisibility: string
    locationSharingEnabled: boolean
  }
  healthInfo: {
    medicalConditions: string[]
    chronicDiseases: string[]
    allergies: string[]
    medications: string[]
    bloodType: string | null
  }
  physicalInfo: {
    age: number | null
    gender: string | null
    height: number | null
    weight: number | null
  }
  locationProfile: {
    address: string | null
    city: string | null
    country: string | null
    latitude: number | null
    longitude: number | null
    lastUpdated: string | null
  }
}

export type ProfilePatchPayload = {
  firstName?: string
  lastName?: string
  phoneNumber?: string | null
}

export type PhysicalPatchPayload = {
  age?: number | null
  gender?: string | null
  height?: number | null
  weight?: number | null
}

export type HealthPatchPayload = {
  medicalConditions?: string[]
  chronicDiseases?: string[]
  allergies?: string[]
  medications?: string[]
  bloodType?: string | null
}

export type LocationPatchPayload = {
  address?: string | null
  city?: string | null
  country?: string | null
  latitude?: number | null
  longitude?: number | null
}

export type PrivacyPatchPayload = {
  profileVisibility?: string
  healthInfoVisibility?: string
  locationVisibility?: string
  locationSharingEnabled?: boolean
}

export type AdminStats = {
  totalUsers: number
  totalHelpRequests: number
  totalAnnouncements: number
  totalAdmins: number
}

export type AdminUserRecord = {
  user_id: string
  email: string
  is_email_verified: boolean
  created_at: string
  is_deleted: boolean
  accepted_terms: boolean
  admin_id: string | null
  admin_role: string | null
}

export type AdminHelpRequestRecord = {
  request_id: string
  user_id: string
  need_type: string
  description: string | null
  status: string
  created_at: string
  resolved_at: string | null
  is_saved_locally: boolean
}

export type AdminAnnouncementRecord = {
  announcement_id: string
  admin_id: string
  title: string
  content: string
  created_at: string
}

type RequestOptions = RequestInit & {
  token?: string | null
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers)

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (response.status === 204) {
    return undefined as T
  }

  const payload = (await response.json().catch(() => ({}))) as T & ApiErrorPayload

  if (!response.ok) {
    throw new ApiError(response.status, payload)
  }

  return payload as T
}

export function getStoredToken() {
  return window.localStorage.getItem(STORAGE_KEYS.accessToken)
}

export function setStoredToken(token: string) {
  window.localStorage.setItem(STORAGE_KEYS.accessToken, token)
}

export function clearStoredToken() {
  window.localStorage.removeItem(STORAGE_KEYS.accessToken)
}

export function signup(payload: SignupPayload) {
  return request<{ message: string; user: AuthUser }>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function login(payload: LoginPayload) {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function verifyEmail(token: string) {
  return request<{ message: string; user: AuthUser }>(
    `/auth/verify-email?token=${encodeURIComponent(token)}`,
  )
}

export function resendVerification(email: string) {
  return request<{ message: string }>('/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export function getCurrentUser(token: string) {
  return request<AuthUser>('/auth/me', { token })
}

export function getMyProfile(token: string) {
  return request<ProfileBundle>('/profiles/me', { token })
}

export function patchProfile(token: string, payload: ProfilePatchPayload) {
  return request<ProfileBundle>('/profiles/me', {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload),
  })
}

export function patchPhysical(token: string, payload: PhysicalPatchPayload) {
  return request<ProfileBundle>('/profiles/me/physical', {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload),
  })
}

export function patchHealth(token: string, payload: HealthPatchPayload) {
  return request<ProfileBundle>('/profiles/me/health', {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload),
  })
}

export function patchLocation(token: string, payload: LocationPatchPayload) {
  return request<ProfileBundle>('/profiles/me/location', {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload),
  })
}

export function patchPrivacy(token: string, payload: PrivacyPatchPayload) {
  return request<ProfileBundle>('/profiles/me/privacy', {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload),
  })
}

export function getAdminStats(token: string) {
  return request<{ stats: AdminStats }>('/auth/admin/stats', { token })
}

export function getAdminUsers(token: string) {
  return request<{ users: AdminUserRecord[] }>('/auth/admin/users', { token })
}

export function getAdminHelpRequests(token: string) {
  return request<{ helpRequests: AdminHelpRequestRecord[] }>('/auth/admin/help-requests', { token })
}

export function getAdminAnnouncements(token: string) {
  return request<{ announcements: AdminAnnouncementRecord[] }>('/auth/admin/announcements', { token })
}
