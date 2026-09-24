// Central place for API URLs.
// In dev: defaults to localhost:8080
// In prod (Vercel): reads VITE_API_URL from env
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

// WebSocket URL — usually same as API_URL
export const WS_URL = import.meta.env.VITE_WS_URL || API_URL

// Convenience: resolve an image path to a full URL
export const resolveImageUrl = (path) => {
  if (!path) return null
  if (path.startsWith('http') || path.startsWith('data:')) return path
  return API_URL + (path.startsWith('/') ? path : '/' + path)
}
