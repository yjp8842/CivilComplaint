import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../api/civilApi";

export default function Login({ onLogin }) {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const data = await loginUser({ userId, password });
      const payload = JSON.parse(atob(data.token.split(".")[1]));
      console.log(payload);
      onLogin(data.token, userId);
      navigate("/");
    } catch (e) {
      setError(e.response?.data?.message || "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 w-full max-w-sm p-8">
        <h1 className="text-xl font-bold text-gray-900 mb-1">민원 서비스</h1>
        <p className="text-sm text-gray-500 mb-6">
          로그인하여 민원을 신청하세요.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">아이디</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="아이디를 입력하세요"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !userId || !password}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <div className="mt-6 space-y-2 text-center text-xs text-gray-400">
          <p>
            계정이 없으신가요?{" "}
            <Link to="/register" className="text-blue-600 hover:underline">
              회원가입
            </Link>
          </p>
          <p>
            기관 시스템이신가요?{" "}
            <Link to="/agency" className="text-blue-600 hover:underline">
              기관 서비스 접속
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
