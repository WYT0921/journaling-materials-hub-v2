import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { adminLogin } from '../api/admin'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('admin_token') || '')
  const username = ref(localStorage.getItem('admin_username') || '')

  const isLoggedIn = computed(() => !!token.value)

  async function login(form) {
    const result = await adminLogin(form.username, form.password)
    token.value = result.token
    username.value = result.username
    localStorage.setItem('admin_token', result.token)
    localStorage.setItem('admin_username', result.username)
    return result
  }

  function logout() {
    token.value = ''
    username.value = ''
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_username')
  }

  return { token, username, isLoggedIn, login, logout }
})
