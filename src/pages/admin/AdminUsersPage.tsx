import { useState } from "react";
import { Mail, Phone } from "lucide-react";
import { FormAlert } from "@/components/auth/FormField";
import { Pager } from "@/components/ui/Pager";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { adminApi } from "@/lib/adminApi";
import type { ApiUserRole, CurrentUser } from "@/lib/authApi";
import { formatDate } from "@/lib/labels";
import { useAsync } from "@/lib/useAsync";

const PAGE_SIZE = 10;

const ROLE_LABEL: Record<ApiUserRole, string> = {
  User: "Khách hàng",
  Organization: "Organizer",
  Manager: "Quản lý",
};

const STATUS_LABEL: Record<CurrentUser["status"], string> = {
  Active: "Hoạt động",
  Locked: "Bị khóa",
};

// Read-only user directory for managers (the API has no lock or unlock endpoint yet).
export function AdminUsersPage() {
  const [role, setRole] = useState<ApiUserRole | "">("");
  const [status, setStatus] = useState<CurrentUser["status"] | "">("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const { data, loading, error } = useAsync(
    () =>
      adminApi.listUsers({
        role: role || undefined,
        status: status || undefined,
        search: query,
        page,
        pageSize: PAGE_SIZE,
      }),
    [role, status, query, page],
  );

  return (
    <div className="w-full">
      <h1 className="font-serif text-xl font-black tracking-tight text-primary-dark">Người dùng</h1>
      <p className="mt-0.5 text-sm text-ink-muted">Danh sách tài khoản trên sàn.</p>

      <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value as ApiUserRole | "");
            setPage(1);
          }}
          aria-label="Lọc theo vai trò"
          className="rounded-lg border border-line bg-white px-3 py-1.5 outline-none focus:border-primary"
        >
          <option value="">Mọi vai trò</option>
          {(Object.keys(ROLE_LABEL) as ApiUserRole[]).map((r) => (
            <option key={r} value={r}>
              {ROLE_LABEL[r]}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as CurrentUser["status"] | "");
            setPage(1);
          }}
          aria-label="Lọc theo trạng thái"
          className="rounded-lg border border-line bg-white px-3 py-1.5 outline-none focus:border-primary"
        >
          <option value="">Mọi trạng thái</option>
          {(Object.keys(STATUS_LABEL) as CurrentUser["status"][]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setQuery(search.trim());
          }}
          className="flex"
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm tên hoặc email"
            className="w-56 rounded-l-lg border border-line bg-white px-3 py-1.5 outline-none focus:border-primary"
          />
          <button type="submit" className="rounded-r-lg bg-primary px-3 font-semibold text-white hover:bg-primary-dark">
            Tìm
          </button>
        </form>
      </div>

      {error && <div className="mt-4"><FormAlert type="error">{error}</FormAlert></div>}
      {loading && !data && <p className="mt-4 text-sm text-ink-muted">Đang tải...</p>}
      {data && data.items.length === 0 && (
        <p className="mt-4 rounded-xl border border-dashed border-line px-6 py-10 text-center text-sm text-ink-muted">Không có người dùng nào.</p>
      )}

      <ul className="mt-4 space-y-3">
        {data?.items.map((u) => (
          <li key={u.id} className="rounded-xl border border-line p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink">{u.fullName}</p>
                <p className="text-xs text-ink-muted">
                  {ROLE_LABEL[u.role]} · Tham gia {formatDate(u.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!u.isEmailVerified && <StatusBadge tone="warning">Chưa xác thực email</StatusBadge>}
                <StatusBadge tone={u.status === "Active" ? "success" : "danger"}>{STATUS_LABEL[u.status]}</StatusBadge>
              </div>
            </div>
            <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink-soft">
              <div className="flex items-center gap-1.5">
                <Mail size={14} className="text-ink-muted" />
                <dd>{u.email}</dd>
              </div>
              {u.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone size={14} className="text-ink-muted" />
                  <dd>{u.phone}</dd>
                </div>
              )}
            </dl>
          </li>
        ))}
      </ul>

      {data && <Pager page={data.currentPage} totalPages={data.totalPages} onChange={setPage} />}
    </div>
  );
}
