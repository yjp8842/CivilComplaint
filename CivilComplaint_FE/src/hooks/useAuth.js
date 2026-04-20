import { useState } from 'react'

export function useAuth() {
  const [token, setToken] = useState(() => localStorage.getItem('token') ?? '')
  const [userName, setUserName] = useState(() => localStorage.getItem('userName') ?? '')

  function login(accessToken, name) {
    setToken(accessToken)
    setUserName(name)
    localStorage.setItem('token', accessToken)
    localStorage.setItem('userName', name)
  }

  function logout() {
    setToken('')
    setUserName('')
    localStorage.removeItem('token')
    localStorage.removeItem('userName')
  }

  return { token, userName, isLoggedIn: !!token, login, logout }
}
