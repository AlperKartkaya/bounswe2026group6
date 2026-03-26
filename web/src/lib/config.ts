export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || '/api'

export const STORAGE_KEYS = {
  accessToken: 'neph.accessToken',
} as const
