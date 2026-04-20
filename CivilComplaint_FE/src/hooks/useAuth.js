import { useState, useEffect } from 'react'

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

function getValidToken() {
  const token = localStorage.getItem('token') ?? ''
  if (token && isTokenExpired(token)) {
    localStorage.removeItem('token')
    localStorage.removeItem('userName')
    return ''
  }
  return token
}

export function useAuth() {
  const [token, setToken] = useState(() => getValidToken())
  const [userName, setUserName] = useState(() => (getValidToken() ? (localStorage.getItem('userName') ?? '') : ''))

  useEffect(() => {
    function handleForceLogout() {
      setToken('')
      setUserName('')
    }
    window.addEventListener('auth:logout', handleForceLogout)
    return () => window.removeEventListener('auth:logout', handleForceLogout)
  }, [])

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
