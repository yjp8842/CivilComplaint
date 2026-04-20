import { useState } from 'react'
import { applyCivil } from '../api/civilApi'

const CIVIL_TYPES = ['주민등록등본', '주민등록초본', '가족관계증명서', '건강보험료납부확인서']
const PURPOSES = ['대출용', '취업용', '행정처리용', '기타']

export default function CivilForm({ token, onSuccess }) {
  const [type, setType] = useState(CIVIL_TYPES[0])
  const [purpose, setPurpose] = useState(PURPOSES[0])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)
      await applyCivil(token, { type, purpose })
      onSuccess?.()
    } catch (e) {
      const status = e.response?.status
      const msg = e.response?.data?.message ?? '알 수 없는 오류가 발생했습니다.'
      setError({ status, message: msg, code: e.response?.data?.code })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h2 className="text-base font-semibold text-gray-800 mb-4">민원 신청</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">민원 종류</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CIVIL_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">발급 목적</label>
          <select
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {PURPOSES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '신청 중...' : '민원 신청하기'}
        </button>
      </form>

      {error && (
        <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <p className="text-sm font-semibold text-red-700">
            {error.status === 401 ? '인증 오류' : error.status === 403 ? '권한 오류' : '신청 실패'}
          </p>
          {error.code && <p className="text-xs text-red-500 mt-0.5">{error.code}</p>}
          <p className="text-sm text-red-600 mt-1">{error.message}</p>
        </div>
      )}
    </div>
  )
}
