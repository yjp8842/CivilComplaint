import { useAuth } from '../hooks/useAuth'
import AuthPanel from '../components/AuthPanel'
import ApiTester from '../components/ApiTester'

export default function Dashboard() {
  const auth = useAuth()

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">API 테스트 대시보드</h1>
        <p className="text-sm text-gray-500 mt-1">백엔드 API를 직접 호출하고 응답을 확인합니다.</p>
      </div>

      <AuthPanel {...auth} />
      <ApiTester authType={auth.authType} apiKey={auth.apiKey} token={auth.token} />
    </div>
  )
}
