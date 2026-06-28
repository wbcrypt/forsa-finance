import axios from 'axios'

const BASE = (import.meta.env.VITE_API_URL || '') + '/api/v1'
const api = axios.create({ baseURL: BASE, withCredentials: true })

let token: string | null = localStorage.getItem('finance_token')

api.interceptors.request.use(cfg => {
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(r => r, async err => {
  if (err.response?.status === 401 && !err.config._retry) {
    err.config._retry = true
    try {
      const r = await api.post('/auth/refresh')
      token = r.data.accessToken
      localStorage.setItem('finance_token', token!)
      err.config.headers.Authorization = `Bearer ${token}`
      return api(err.config)
    } catch {
      localStorage.removeItem('finance_token')
      window.location.href = '/login'
    }
  }
  return Promise.reject(err)
})

export const setToken = (t: string) => { token = t; localStorage.setItem('finance_token', t) }
export const clearToken = () => { token = null; localStorage.removeItem('finance_token') }

export const authApi = {
  login: (d: any) => api.post('/auth/login', d),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
}

export const financeApi = {
  listReceipts: (params?: any) => api.get('/payments/receipts', { params }),
  verifyPayment: (id: string, notes?: string) =>
    api.patch(`/payments/${id}/verify`, { status: 'verified', notes }),
  rejectPayment: (id: string, reason: string) =>
    api.patch(`/payments/${id}/verify`, { status: 'rejected', reason }),
  lateInstallments: (params?: any) => api.get('/collections/late', { params }),
  reportFinance: (params?: any) => api.get('/reports/finance', { params }),
  reportCollections: (params?: any) => api.get('/reports/collections', { params }),
  auditLogs: (params?: any) => api.get('/reports/audit', { params }),
  studentPayments: (studentId: string) => api.get(`/students/${studentId}/payments`),
  scheduleForApp: (appId: string) => api.get(`/payments/schedules/applications/${appId}`),
  installmentPayments: (id: string) => api.get(`/payments/installments/${id}/payments`),
}

export default api
