/**
 * Central API Client for FarmAssist AI Backend
 * Provides robust error translation, CORS support, and automatic token management.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'

export class ApiError extends Error {
  status?: number
  detail?: string

  constructor(message: string, status?: number, detail?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const url = `${API_BASE_URL}${cleanEndpoint}`

  const token = localStorage.getItem('farmassist_token')
  const headers = new Headers(options.headers || {})

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  let response: Response
  try {
    response = await fetch(url, {
      ...options,
      headers,
    })
  } catch (err: any) {
    console.error(`[API Network Error] ${options.method || 'GET'} ${url}:`, err)
    throw new ApiError(
      'Unable to connect to the FarmAssist server. Please ensure your connection is active and backend is running.',
      0,
      err.message
    )
  }

  if (!response.ok) {
    let errorDetail = ''
    try {
      const errData = await response.json()
      errorDetail = errData.detail || errData.message || ''
    } catch {
      errorDetail = await response.text().catch(() => '')
    }

    let userMessage = errorDetail
    if (response.status === 400) {
      userMessage = errorDetail || 'Invalid request. Please check your inputs.'
    } else if (response.status === 401) {
      userMessage = errorDetail || 'Authentication required or session expired. Please sign in again.'
    } else if (response.status === 403) {
      userMessage = errorDetail || 'Access denied. You do not have permission for this resource.'
    } else if (response.status === 404) {
      userMessage = errorDetail || 'The requested resource was not found.'
    } else if (response.status >= 500) {
      userMessage = 'A server error occurred. Please try again later.'
    }

    throw new ApiError(userMessage, response.status, errorDetail)
  }

  if (response.status === 204) {
    return {} as T
  }

  return response.json()
}
