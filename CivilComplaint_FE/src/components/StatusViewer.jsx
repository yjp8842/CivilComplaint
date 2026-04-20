import { useState } from 'react'
import { getStatus } from '../api/civilApi'

const STATUS_STYLE = {
  접수:   'bg-yellow-100 text-yellow-800',
  처리중: 'bg-blue-100 text-blue-800',
  완료:   'bg-green-100 text-green-800',
  반려:   'bg-red-100 text-red-800',
}

const FIELD_LABELS = {
  id:           '민원 번호',
  type:         '민원 종류',
  purpose:      '발급 목적',
  appliedAt:    '신청일',
  contact:      '담당자 연락처',
  internalCode: '내부 처리 코드',
}

function ComplaintList({ complaints }) {
  if (complaints.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-4">조회된 민원이 없습니다.</p>
  }

  return (
    <div className="space-y-2">
      {complaints.map((c) => {
        const badgeStyle = STATUS_STYLE[c.status] ?? 'bg-gray-100 text-gray-700'
        const fields = Object.entries(c).filter(([key]) => key !== 'status' && FIELD_LABELS[key])

        return (
          <details key={c.id} className="border border-gray-200 rounded-lg overflow-hidden group">
            <summary className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 list-none">
              <div>
                <p className="text-sm font-medium text-gray-800">{c.type}</p>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{c.id}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeStyle}`}>
                  {c.status}
                </span>
                <span className="text-gray-400 text-xs group-open:rotate-180 transition-transform">▼</span>
              </div>
            </summary>
            <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
              <dl className="space-y-1.5">
                {fields.map(([key, value]) => (
                  <div key={key} className="flex gap-3 text-sm">
                    <dt className="w-32 shrink-0 text-gray-500">{FIELD_LABELS[key]}</dt>
                    <dd className={`font-medium ${key === 'internalCode' ? 'font-mono text-indigo-700' : 'text-gray-800'}`}>
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </details>
        )
      })}
    </div>
  )
}

export default function StatusViewer({ authType, apiKey, token }) {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleFetch() {
    const authHeader = authType === 'API_KEY'
      ? { 'X-API-Key': apiKey }
      : { Authorization: `Bearer ${token}` }

    try {
      setLoading(true)
      setResult(null)
      const data = await getStatus(authHeader)
      setResult({ data, error: false })
    } catch (e) {
      setResult({
        data: e.response?.data ?? { message: e.message },
        status: e.response?.status,
        error: true,
      })
    } finally {
      setLoading(false)
    }
  }

  const complaints = result?.data?.complaints ?? []

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">민원 목록 조회</h2>
        <button
          onClick={handleFetch}
          disabled={loading}
          className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '조회 중...' : '조회'}
        </button>
      </div>

      <p className="text-xs text-gray-400 mb-3">
        {authType === 'API_KEY' ? 'API Key → 전체 민원 목록' : 'OAuth → 해당 시민의 민원 목록'}
      </p>

      {result?.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <p className="text-sm font-semibold text-red-700">
            {result.status === 401 ? '인증 오류' : result.status === 403 ? '권한 오류' : '오류'}
          </p>
          {result.data.code && <p className="text-xs text-red-500 mt-0.5">{result.data.code}</p>}
          <p className="text-sm text-red-600 mt-1">{result.data.message ?? '알 수 없는 오류'}</p>
        </div>
      )}

      {result && !result.error && <ComplaintList complaints={complaints} />}
    </div>
  )
}
