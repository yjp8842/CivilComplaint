import axios from 'axios'

const api = axios.create()

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('userName')
      window.dispatchEvent(new Event('auth:logout'))
    }
    return Promise.reject(error)
  }
)

export async function register(body) {
  const res = await api.post('/auth/register', body)
  return res.data
}

export async function loginUser(body) {
  const res = await api.post('/auth/login', body)
  return res.data
}

export async function getAgencies(apiKey) {
  const res = await api.get('/civil/agencies', {
    headers: { 'X-API-Key': apiKey },
  })
  return res.data
}

export async function applyCivil(token, body) {
  const res = await api.post('/civil/apply', body, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.data
}

// authHeader: { Authorization: `Bearer ${token}` } 또는 { 'X-API-Key': apiKey }
// OAUTH → 해당 시민의 민원 목록, OPEN_API → 전체 민원 목록
export async function getStatus(authHeader) {
  const res = await api.get('/civil/status', { headers: authHeader })
  return res.data
}

export async function issueToken(body) {
  const res = await api.post('/auth/token', body)
  return res.data
}
