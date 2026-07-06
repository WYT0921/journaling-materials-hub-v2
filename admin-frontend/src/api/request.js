import axios from 'axios'
import { useAuthStore } from '../stores/auth'

const http = axios.create({
  baseURL: '/api',
  timeout: 15000
})

http.interceptors.request.use(config => {
  const token = localStorage.getItem('admin_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  response => {
    const data = response.data
    if (data.success) {
      return data.data
    } else {
      const err = new Error(data.error?.message || data.message || '请求失败')
      err.code = data.error?.statusCode || data.code
      throw err
    }
  },
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_username')
      window.location.href = '/login'
    }
    const msg = error.response?.data?.error?.message || error.message || '网络错误'
    const err = new Error(msg)
    err.code = error.response?.status
    throw err
  }
)

export default http
