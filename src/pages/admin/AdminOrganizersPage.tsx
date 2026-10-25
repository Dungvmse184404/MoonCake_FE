import { useState } from "react";
import { Mail, Phone } from "lucide-react";
import { FormAlert, TextAreaField } from "@/components/auth/FormField";
import { Pager } from "@/components/ui/Pager";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { adminApi } from "@/lib/adminApi";
import { friendlyError } from "@/lib/errors";
import { formatDate, ORGANIZER_STATUS_LABEL } from "@/lib/labels";
import type { Organizer, OrganizerStatus } from "@/lib/organizerApi";
import { useAsync } from "@/lib/useAsync";

const PAGE_SIZE = 8;

// Manager view of organizers: suspend (reason required) or reactivate.
export function AdminOrganizersPage() {
  const [status, setStatus] = useState<OrganizerStatus | "">("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [suspendingId, setSuspendingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const { data, loading, error, reload } = useAsync(
    () => adminApi.listOrganizers({ status: status || undefined, search: query, page, pageSize: PAGE_SIZE }),
    [status, query, page],
  );

  const change = async (o: Organizer, next: OrganizerStatus) => {
    if (next === "Suspended" && !reason.trim()) return setReasonError("Vui lòng nhập lý do đình chỉ.");
    setReasonError("");
    setBusyId(o.id);
    setNotice(null);
    try {
      await adminApi.setOrganizerStatus(o.id, next, next === "Suspended" ? reason.trim() : undefined);
      setNotice({ type: "success", message: next === "Suspended" ? "Đã đình chỉ Organizer." : "Đã mở lại Organizer." });
      setSuspendingId(null);
      setReason("");
      reload();
    } catch (e) {
      setNotice({ type: "error", message: friendlyError(e) });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="w-full">
      <h1 className="font-serif text-xl font-black tracking-tight text-primary-dark">Organizer</h1>
      <p className="mt-0.5 text-sm text-ink-muted">Organizer bị đình chỉ không thể đăng bán sản phẩm hay thuê thêm gian hàng.</p>

      <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as OrganizerStatus | "");
            setPage(1);
          }}
          aria-label="Lọc theo trạng thái"
          className="rounded-lg border border-line bg-white px-3 py-1.5 outline-none focus:border-primary"
        >
          <option value="">Mọi trạng thái</option>
          {(Object.keys(ORGANIZER_STATUS_LABEL) as OrganizerStatus[]).map((s) => (
            <option key={s} value={s}>
              {ORGANIZER_STATUS_LABEL[s]}
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
            placeholder="Tìm thương hiệu, tên, email"
            className="w-56 rounded-l-lg border border-line bg-white px-3 py-1.5 outline-none focus:border-primary"
          />
          <button type="submit" className="rounded-r-lg bg-primary px-3 font-semibold text-white hover:bg-primary-dark">
            Tìm
          </button>
        </form>
      </div>

      {notice && <div className="mt-4"><FormAlert type={notice.type}>{notice.message}</FormAlert></div>}
      {error && <div className="mt-4"><FormAlert type="error">{error}</FormAlert></div>}
      {loading && !data && <p className="mt-4 text-sm text-ink-muted">Đang tải...</p>}
      {data && data.items.length === 0 && (
        <p className="mt-4 rounded-xl border border-dashed border-line px-6 py-10 text-center text-sm text-ink-muted">Chưa có Organizer nào.</p>
      )}

      <ul className="mt-4 space-y-3">
        {data?.items.map((o) => (
          <li key={o.id} className="rounded-xl border border-line p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink">{o.brandName}</p>
                <p className="text-xs text-ink-muted">
                  {o.userFullName} · Đối tác từ {formatDate(o.approvedAt ?? o.createdAt)}
                </p>
              </div>
              <StatusBadge tone={o.status === "Active" ? "success" : "danger"}>{ORGANIZER_STATUS_LABEL[o.status]}</StatusBadge>
            </div>

            <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink-soft">
              <div className="flex items-center gap-1.5">
                <Mail size={14} className="text-ink-muted" />
                <dd>{o.contactEmail || o.userEmail}</dd>
              </div>
              {o.contactPhone && (
                <div className="flex items-center gap-1.5">
                  <Phone size={14} className="text-ink-muted" />
                  <dd>{o.contactPhone}</dd>
                </div>
              )}
            </dl>
            {o.status === "Suspended" && o.suspendReason && (
              <p className="mt-3 rounded-lg bg-primary/5 px-3 py-2 text-sm text-primary-dark">
                Đình chỉ ngày {formatDate(o.suspendedAt)}: {o.suspendReason}
              </p>
            )}

            {suspendingId === o.id ? (
              <div className="mt-4 space-y-3 rounded-lg bg-cream p-4">
                <TextAreaField label="Lý do đình chỉ" name={`suspend-${o.id}`} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
                {reasonError && <p className="text-xs text-primary">{reasonError}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={() => change(o, "Suspended")}
                    disabled={busyId === o.id}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
                  >
                    Xác nhận đình chỉ
                  </button>
                  <button
                    onClick={() => setSuspendingId(null)}
                    className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold text-ink-soft hover:text-primary"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4">
                {o.status === "Active" ? (
                  <button
                    onClick={() => {
                      setSuspendingId(o.id);
                      setReason("");
                      setReasonError("");
                    }}
                    className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink-soft hover:border-primary hover:text-primary"
                  >
                    Đình chỉ
                  </button>
                ) : (
                  <button
                    onClick={() => change(o, "Active")}
                    disabled={busyId === o.id}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
                  >
                    Mở lại
                  </button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>

      {data && <Pager page={data.currentPage} totalPages={data.totalPages} onChange={setPage} />}
    </div>
  );
}
