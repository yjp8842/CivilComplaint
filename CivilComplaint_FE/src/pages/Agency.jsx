import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getAgencies, getStatus } from '../api/civilApi'

const PRESET_KEYS = [
  { label: '서울특별시청', value: 'govkey-seoul-001' },
  { label: '경기도청', value: 'govkey-gyeonggi-002' },
  { label: '행정안전부', value: 'govkey-mois-003' },
]

const STATUS_STYLE = {
  접수:   'bg-yellow-100 text-yellow-800',
  처리중: 'bg-blue-100 text-blue-800',
  완료:   'bg-green-100 text-green-800',
  반려:   'bg-red-100 text-red-800',
}

function ErrorBox({ data, status }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mt-3">
      <p className="text-sm font-semibold text-red-700">
        {status === 401 ? '인증 오류' : status === 403 ? '권한 오류' : '오류'}
      </p>
      {data.code && <p className="text-xs text-red-500 mt-0.5">{data.code}</p>}
      <p className="text-sm text-red-600 mt-1">{data.message ?? '알 수 없는 오류'}</p>
    </div>
  )
}

function AgencyList({ apiKey }) {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleFetch() {
    try {
      setLoading(true)
      setResult(null)
      const data = await getAgencies(apiKey)
      setResult({ data, error: false })
    } catch (e) {
      setResult({ data: e.response?.data ?? { message: e.message }, status: e.response?.status, error: true })
    } finally {
      setLoading(false)
    }
  }

  const agencies = Array.isArray(result?.data)
    ? result.data
    : Array.isArray(result?.data?.agencies)
    ? result.data.agencies
    : null

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-800">기관 목록</h2>
          <p className="text-xs text-gray-400 mt-0.5">GET /civil/agencies</p>
        </div>
        <button
          onClick={handleFetch}
          disabled={loading || !apiKey}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '조회 중...' : '목록 조회'}
        </button>
      </div>

      {result?.error && <ErrorBox data={result.data} status={result.status} />}

      {agencies && (
        agencies.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">조회된 기관이 없습니다.</p>
        ) : (
          <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
            {agencies.map((agency, i) => (
              <div key={agency.id ?? i} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-800">{agency.name ?? agency.id}</p>
                  {agency.code && <p className="text-xs text-gray-400">{agency.code}</p>}
                </div>
                {agency.region && <span className="text-xs text-gray-500">{agency.region}</span>}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}

const COMPLAINT_FIELD_LABELS = {
  id:           '민원 번호',
  type:         '민원 종류',
  purpose:      '발급 목적',
  appliedAt:    '신청일',
  internalCode: '내부 처리 코드',
}

function AllComplaints({ apiKey }) {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleFetch() {
    try {
      setLoading(true)
      setResult(null)
      const data = await getStatus({ 'X-API-Key': apiKey })
      setResult({ data, error: false })
    } catch (e) {
      setResult({ data: e.response?.data ?? { message: e.message }, status: e.response?.status, error: true })
    } finally {
      setLoading(false)
    }
  }

  const complaints = Array.isArray(result?.data?.complaints) ? result.data.complaints : []

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-800">전체 민원 현황</h2>
          <p className="text-xs text-gray-400 mt-0.5">GET /civil/status — 내부 처리 코드 포함</p>
        </div>
        <button
          onClick={handleFetch}
          disabled={loading || !apiKey}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '조회 중...' : '전체 조회'}
        </button>
      </div>

      {result?.error && <ErrorBox data={result.data} status={result.status} />}

      {result && !result.error && (
        complaints.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">접수된 민원이 없습니다.</p>
        ) : (
          <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
            {complaints.map((c, i) => (
              <details key={c.id ?? i} className="group">
                <summary className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 list-none">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{c.type}</p>
                    <p className="text-xs font-mono text-gray-400 mt-0.5">{c.id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[c.status] ?? 'bg-gray-100 text-gray-700'}`}>
                      {c.status}
                    </span>
                    <span className="text-gray-400 text-xs group-open:rotate-180 transition-transform">▼</span>
                  </div>
                </summary>
                <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                  <dl className="space-y-1.5">
                    {Object.entries(c).filter(([key]) => key !== 'status' && COMPLAINT_FIELD_LABELS[key]).map(([key, value]) => (
                      <div key={key} className="flex gap-3 text-sm">
                        <dt className="w-32 shrink-0 text-gray-500">{COMPLAINT_FIELD_LABELS[key]}</dt>
                        <dd className={`font-medium ${key === 'internalCode' ? 'font-mono text-indigo-700' : 'text-gray-800'}`}>
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </details>
            ))}
          </div>
        )
      )}
    </div>
  )
}

export default function Agency() {
  const [apiKey, setApiKey] = useState('')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">기관 서비스</h1>
          <p className="text-xs text-gray-400 mt-0.5">OpenAPI Key 인증</p>
        </div>
        <Link to="/login" className="text-sm text-gray-500 hover:text-gray-800 border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50">
          시민 로그인
        </Link>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* API Key 입력 */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-3">API Key 설정</h2>
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="X-API-Key"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
          />
          <div className="flex flex-wrap gap-2">
            {PRESET_KEYS.map((k) => (
              <button
                key={k.value}
                onClick={() => setApiKey(k.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                  apiKey === k.value
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {k.label}
              </button>
            ))}
          </div>
        </div>

        <AgencyList apiKey={apiKey} />
        <AllComplaints apiKey={apiKey} />
      </div>
    </div>
  )
}
