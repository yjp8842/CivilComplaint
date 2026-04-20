import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import CivilForm from "../components/CivilForm";
import { getStatus } from "../api/civilApi";

const STATUS_STYLE = {
  접수: "bg-yellow-100 text-yellow-800",
  처리중: "bg-blue-100 text-blue-800",
  완료: "bg-green-100 text-green-800",
  반려: "bg-red-100 text-red-800",
};

const FIELD_LABELS = {
  id: "민원 번호",
  type: "민원 종류",
  purpose: "발급 목적",
  appliedAt: "신청일",
  contact: "담당자 연락처",
};

function formatDate(str) {
  if (!str) return "";
  return new Date(str).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ComplaintItem({ complaint }) {
  const badgeStyle =
    STATUS_STYLE[complaint.status] ?? "bg-gray-100 text-gray-700";
  const detailFields = Object.entries(complaint).filter(
    ([key]) => key !== "status" && FIELD_LABELS[key],
  );

  return (
    <details className="border border-gray-200 rounded-lg overflow-hidden group">
      <summary className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 list-none">
        <div>
          <p className="text-sm font-medium text-gray-800">{complaint.type}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {formatDate(complaint.appliedAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeStyle}`}
          >
            {complaint.status}
          </span>
          <span className="text-gray-400 text-xs group-open:rotate-180 transition-transform">
            ▼
          </span>
        </div>
      </summary>

      <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
        <dl className="space-y-1.5">
          {detailFields.map(([key, value]) => (
            <div key={key} className="flex gap-3 text-sm">
              <dt className="w-28 shrink-0 text-gray-500">
                {FIELD_LABELS[key]}
              </dt>
              <dd className="text-gray-800 font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </details>
  );
}

export default function Home({ auth }) {
  const { token, userName, logout } = auth;
  const navigate = useNavigate();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["myComplaints"],
    queryFn: () => getStatus({ Authorization: `Bearer ${token}` }),
    enabled: !!token,
  });

  const complaints = data?.complaints ?? [];

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">민원 서비스</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{userName} 님</span>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-800 border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50"
          >
            로그아웃
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <CivilForm token={token} onSuccess={refetch} />

        <div>
          <h2 className="text-base font-semibold text-gray-800 mb-3">
            내 민원 목록
          </h2>

          {isLoading && (
            <div className="bg-white border border-gray-200 rounded-xl px-5 py-8 text-center">
              <p className="text-sm text-gray-400">불러오는 중...</p>
            </div>
          )}

          {isError && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4">
              <p className="text-sm text-red-600">
                민원 목록을 불러오지 못했습니다.
              </p>
            </div>
          )}

          {!isLoading && !isError && complaints.length === 0 && (
            <div className="bg-white border border-gray-200 rounded-xl px-5 py-8 text-center">
              <p className="text-sm text-gray-400">신청한 민원이 없습니다.</p>
            </div>
          )}

          {complaints.length > 0 && (
            <div className="space-y-2">
              {complaints.map((c) => (
                <ComplaintItem key={c.id} complaint={c} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
