import { useState } from 'react'
import { getAgencies, applyCivil, getStatus, issueToken } from '../api/civilApi'

function ResponseViewer({ result }) {
  if (!result) return null

  const isError = result.error
  const status = result.status
  const isAuthError = status === 401 || status === 403

  return (
    <div className={`mt-2 rounded p-3 text-sm font-mono ${isAuthError || isError ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-800'}`}>
      {status && (
        <span className={`inline-block mb-1 text-xs font-semibold px-1.5 py-0.5 rounded ${isAuthError ? 'bg-red-200 text-red-800' : 'bg-gray-200 text-gray-700'}`}>
          HTTP {status}
        </span>
      )}
      <pre className="whitespace-pre-wrap break-all">{JSON.stringify(result.data, null, 2)}</pre>
    </div>
  )
}

function Section({ title, badge, children }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{badge}</span>
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      </div>
      {children}
    </div>
  )
}

async function callApi(fn) {
  try {
    const data = await fn()
    return { data, status: 200 }
  } catch (e) {
    return {
      data: e.response?.data ?? { message: e.message },
      status: e.response?.status,
      error: true,
    }
  }
}

export default function ApiTester({ authType, apiKey, token }) {
  const [agencyResult, setAgencyResult] = useState(null)
  const [applyType, setApplyType] = useState('주민등록등본')
  const [applyPurpose, setApplyPurpose] = useState('대출용')
  const [applyResult, setApplyResult] = useState(null)
  const [statusResult, setStatusResult] = useState(null)
  const [tokenUserId, setTokenUserId] = useState('citizen-001')
  const [tokenName, setTokenName] = useState('홍길동')
  const [tokenResult, setTokenResult] = useState(null)
  async function handleGetAgencies() {
    setAgencyResult(await callApi(() => getAgencies(apiKey)))
  }

  async function handleApply() {
    setApplyResult(await callApi(() => applyCivil(token, { type: applyType, purpose: applyPurpose })))
  }

  async function handleGetStatus() {
    const authHeader =
      authType === 'API_KEY'
        ? { 'X-API-Key': apiKey }
        : { Authorization: `Bearer ${token}` }
    setStatusResult(await callApi(() => getStatus(authHeader)))
  }

  async function handleIssueToken() {
    setTokenResult(await callApi(() => issueToken({ userId: tokenUserId, name: tokenName, roles: ['CITIZEN'] })))
  }

  return (
    <div className="space-y-4">
      <Section title="기관 목록 조회" badge="GET /civil/agencies">
        <p className="text-xs text-gray-500 mb-2">OPEN_API 전용 — X-API-Key 필요</p>
        <button onClick={handleGetAgencies} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
          호출
        </button>
        <ResponseViewer result={agencyResult} />
      </Section>

      <Section title="민원 신청" badge="POST /civil/apply">
        <p className="text-xs text-gray-500 mb-2">OAUTH 전용 — Bearer Token 필요</p>
        <div className="flex gap-2 mb-2">
          <input
            value={applyType}
            onChange={(e) => setApplyType(e.target.value)}
            placeholder="type"
            className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            value={applyPurpose}
            onChange={(e) => setApplyPurpose(e.target.value)}
            placeholder="purpose"
            className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button onClick={handleApply} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
          호출
        </button>
        <ResponseViewer result={applyResult} />
      </Section>

      <Section title="민원 목록 조회" badge="GET /civil/status">
        <p className="text-xs text-gray-500 mb-2">BOTH — API Key: 전체 목록 / OAuth: 본인 목록</p>
        <button onClick={handleGetStatus} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
          호출
        </button>
        <ResponseViewer result={statusResult} />
      </Section>

      <Section title="토큰 발급" badge="POST /auth/token">
        <div className="flex gap-2 mb-2">
          <input
            value={tokenUserId}
            onChange={(e) => setTokenUserId(e.target.value)}
            placeholder="userId"
            className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            value={tokenName}
            onChange={(e) => setTokenName(e.target.value)}
            placeholder="이름"
            className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={handleIssueToken} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
            호출
          </button>
        </div>
        <ResponseViewer result={tokenResult} />
      </Section>

    </div>
  )
}
