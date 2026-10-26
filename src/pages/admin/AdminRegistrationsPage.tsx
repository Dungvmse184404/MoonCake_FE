import { useState } from "react";
import { SearchInput } from "@/components/ui/SearchInput";
import { CalendarDays, Mail } from "lucide-react";
import { FormAlert, FormField, TextAreaField } from "@/components/auth/FormField";
import { Pager } from "@/components/ui/Pager";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { adminApi } from "@/lib/adminApi";
import { friendlyError } from "@/lib/errors";
import { formatDate, REGISTRATION_STATUS_LABEL, REGISTRATION_STATUS_TONE, REGISTRATION_TYPE_LABEL } from "@/lib/labels";
import type { OrganizerRegistration, RegistrationStatus, RegistrationType } from "@/lib/organizerApi";
import { useAsync } from "@/lib/useAsync";

const PAGE_SIZE = 6;

type Action = { id: string; kind: "approve" | "reject" };

// Flow 3: the manager reviews applications. Online ones need a commission rate that the applicant must then confirm.
export function AdminRegistrationsPage() {
  const [status, setStatus] = useState<RegistrationStatus | "">("Pending");
  const [type, setType] = useState<RegistrationType | "">("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [action, setAction] = useState<Action | null>(null);
  const [commission, setCommission] = useState("");
  const [reason, setReason] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const { data, loading, error, reload } = useAsync(
    () =>
      adminApi.listRegistrations({
        status: status || undefined,
        type: type || undefined,
        search: query,
        page,
        pageSize: PAGE_SIZE,
      }),
    [status, type, query, page],
  );

  const open = (r: OrganizerRegistration, kind: Action["kind"]) => {
    setAction({ id: r.id, kind });
    setCommission("");
    setReason("");
    setFieldError("");
  };

  const submit = async (r: OrganizerRegistration) => {
    if (!action) return;
    setFieldError("");

    if (action.kind === "reject" && !reason.trim()) return setFieldError("Vui lòng nhập lý do từ chối.");
    let rate: number | undefined;
    if (action.kind === "approve" && r.type === "Online") {
      rate = Number(commission);
      if (!commission.trim() || Number.isNaN(rate) || rate < 0 || rate > 100) return setFieldError("Hoa hồng phải từ 0 đến 100.");
    }

    setBusy(true);
    setNotice(null);
    try {
      if (action.kind === "approve") await adminApi.approveRegistration(r.id, rate);
      else await adminApi.rejectRegistration(r.id, reason.trim());
      setNotice({
        type: "success",
        message:
          action.kind === "reject"
            ? "Đã từ chối đơn."
            : r.type === "Online"
              ? "Đã đề xuất hoa hồng, chờ người đăng ký xác nhận."
              : "Đã duyệt đơn và tạo hợp đồng thuê.",
      });
      setAction(null);
      reload();
    } catch (e) {
      setNotice({ type: "error", message: friendlyError(e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full">
      <h1 className="font-serif text-xl font-black tracking-tight text-primary-dark">Đơn đăng ký đối tác</h1>
      <p className="mt-0.5 text-sm text-ink-muted">Duyệt hoặc từ chối đơn thuê gian hàng và bán online.</p>

      <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as RegistrationStatus | "");
            setPage(1);
          }}
          aria-label="Lọc theo trạng thái"
          className="rounded-lg border border-line bg-white px-3 py-1.5 outline-none focus:border-primary"
        >
          <option value="">Mọi trạng thái</option>
          {(Object.keys(REGISTRATION_STATUS_LABEL) as RegistrationStatus[]).map((s) => (
            <option key={s} value={s}>
              {REGISTRATION_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value as RegistrationType | "");
            setPage(1);
          }}
          aria-label="Lọc theo hình thức"
          className="rounded-lg border border-line bg-white px-3 py-1.5 outline-none focus:border-primary"
        >
          <option value="">Mọi hình thức</option>
          {(Object.keys(REGISTRATION_TYPE_LABEL) as RegistrationType[]).map((t) => (
            <option key={t} value={t}>
              {REGISTRATION_TYPE_LABEL[t]}
            </option>
          ))}
        </select>
        <SearchInput
          value={query}
          onSearch={(q) => {
            setPage(1);
            setQuery(q);
          }}
          placeholder="Tìm thương hiệu, tên, email"
          className="w-64"
        />
      </div>

      {notice && (
        <div className="mt-4">
          <FormAlert type={notice.type}>{notice.message}</FormAlert>
        </div>
      )}
      {error && <div className="mt-4"><FormAlert type="error">{error}</FormAlert></div>}
      {loading && !data && <p className="mt-4 text-sm text-ink-muted">Đang tải...</p>}
      {data && data.items.length === 0 && (
        <p className="mt-4 rounded-xl border border-dashed border-line px-6 py-10 text-center text-sm text-ink-muted">
          Không có đơn nào phù hợp.
        </p>
      )}

      <ul className="mt-4 space-y-4">
        {data?.items.map((r) => (
          <li key={r.id} className="rounded-xl border border-line p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink">{r.brandName}</p>
                <p className="text-xs text-ink-muted">
                  {REGISTRATION_TYPE_LABEL[r.type]} · Gửi ngày {formatDate(r.createdAt)}
                </p>
              </div>
              <StatusBadge tone={REGISTRATION_STATUS_TONE[r.status]}>{REGISTRATION_STATUS_LABEL[r.status]}</StatusBadge>
            </div>

            <dl className="mt-3 grid gap-x-6 gap-y-1.5 text-sm text-ink-soft sm:grid-cols-2">
              <div className="flex items-center gap-1.5">
                <Mail size={14} className="text-ink-muted" />
                <dd>
                  {r.userFullName} ({r.userEmail})
                </dd>
              </div>
              {r.contactPhone && (
                <div className="flex gap-1.5">
                  <dt className="text-ink-muted">Liên hệ:</dt>
                  <dd>{r.contactPhone}</dd>
                </div>
              )}
              {r.type === "Stall" && (
                <>
                  <div className="flex gap-1.5">
                    <dt className="text-ink-muted">Gian hàng:</dt>
                    <dd>{[r.stallCode, r.stallName].filter(Boolean).join(" - ")}</dd>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CalendarDays size={14} className="text-ink-muted" />
                    <dd>
                      {formatDate(r.startDate)} đến {formatDate(r.endDate)}
                    </dd>
                  </div>
                </>
              )}
              {r.commissionRate != null && (
                <div className="flex gap-1.5">
                  <dt className="text-ink-muted">Hoa hồng:</dt>
                  <dd className="font-semibold text-primary-dark">{r.commissionRate}%</dd>
                </div>
              )}
            </dl>
            {r.businessInfo && <p className="mt-3 whitespace-pre-line rounded-lg bg-cream px-3 py-2 text-sm text-ink-soft">{r.businessInfo}</p>}
            {r.rejectReason && <p className="mt-3 text-sm text-primary-dark">Lý do từ chối: {r.rejectReason}</p>}
            {r.cancelReason && <p className="mt-3 text-sm text-ink-muted">Lý do hủy: {r.cancelReason}</p>}

            {r.status === "Pending" && action?.id !== r.id && (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => open(r, "approve")}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
                >
                  Duyệt
                </button>
                <button
                  onClick={() => open(r, "reject")}
                  className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink-soft hover:border-primary hover:text-primary"
                >
                  Từ chối
                </button>
              </div>
            )}

            {action?.id === r.id && (
              <div className="mt-4 space-y-3 rounded-lg bg-cream p-4">
                {action.kind === "approve" && r.type === "Online" && (
                  <FormField
                    label="Tỷ lệ hoa hồng (%) đề xuất cho mỗi đơn hàng"
                    name={`commission-${r.id}`}
                    inputMode="decimal"
                    value={commission}
                    onChange={(e) => setCommission(e.target.value)}
                    placeholder="10"
                  />
                )}
                {action.kind === "approve" && r.type === "Stall" && (
                  <p className="text-sm text-ink-soft">Duyệt đơn sẽ tạo hợp đồng thuê và chuyển người đăng ký thành Organizer.</p>
                )}
                {action.kind === "reject" && (
                  <TextAreaField label="Lý do từ chối" name={`reject-${r.id}`} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
                )}
                {fieldError && <p className="text-xs text-primary">{fieldError}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={() => submit(r)}
                    disabled={busy}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
                  >
                    {busy ? "Đang xử lý..." : action.kind === "approve" ? "Xác nhận duyệt" : "Xác nhận từ chối"}
                  </button>
                  <button
                    onClick={() => setAction(null)}
                    className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold text-ink-soft hover:text-primary"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {data && <Pager page={data.currentPage} totalPages={data.totalPages} onChange={setPage} />}
    </div>
  );
}
