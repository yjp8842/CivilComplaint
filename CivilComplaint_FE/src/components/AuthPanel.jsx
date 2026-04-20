import { useState } from "react";
import { issueToken } from "../api/civilApi";

export default function AuthPanel({
  authType,
  setAuthType,
  apiKey,
  setApiKey,
  token,
  setToken,
}) {
  const [userId, setUserId] = useState("citizen-001");
  const [name, setName] = useState("홍길동");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleIssueToken() {
    try {
      setError(null);
      setLoading(true);
      const data = await issueToken({ userId, name, roles: ["CITIZEN"] });
      setToken(data.token);
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        인증 설정
      </h2>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setAuthType("API_KEY")}
          className={`px-3 py-1.5 rounded text-sm font-medium ${
            authType === "API_KEY"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          API Key
        </button>
        <button
          onClick={() => setAuthType("OAUTH")}
          className={`px-3 py-1.5 rounded text-sm font-medium ${
            authType === "OAUTH"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          OAuth
        </button>
      </div>

      {authType === "API_KEY" ? (
        <input
          type="text"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="X-API-Key (예: govkey-seoul-001)"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="userId"
              className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름"
              className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleIssueToken}
              disabled={loading}
              className="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "발급 중..." : "토큰 발급"}
            </button>
          </div>
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Access Token"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
