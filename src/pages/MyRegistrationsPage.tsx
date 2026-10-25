import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CalendarDays, Percent, Plus } from "lucide-react";
import { FormAlert, TextAreaField } from "@/components/auth/FormField";
import { Pager } from "@/components/ui/Pager";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/context/AuthContext";
import { friendlyError } from "@/lib/errors";
import {
  formatDate,
  REGISTRATION_STATUS_LABEL,
  REGISTRATION_STATUS_TONE,
  REGISTRATION_TYPE_LABEL,
} from "@/lib/labels";
import { organizerApi, type OrganizerRegistration, type RegistrationStatus } from "@/lib/organizerApi";
import { useAsync } from "@/lib/useAsync";

const PAGE_SIZE = 5;

const canCancel = (r: OrganizerRegistration) =>
  r.status === "Pending" || (r.type === "Online" && r.status === "AwaitingConfirmation");

export function MyRegistrationsPage() {
  const { role, refreshUser } = useAuth();
  const location = useLocation();
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(
    (location.state as { notice?: string } | null)?.notice
      ? { type: "success", message: (location.state as { notice: string }).notice }
      : null,
  );
  const [status, setStatus] = useState<RegistrationStatus | "">("");
  const [page, setPage] = useState(1);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data, loading, error, reload } = useAsync(
    () => organizerApi.myRegistrations({ status: status || undefined, page, pageSize: PAGE_SIZE }),
    [status, page],
  );

  const onConfirm = async (r: OrganizerRegistration) => {
    setBusyId(r.id);
    setNotice(null);
    try {
      await organizerApi.confirmRegistration(r.id);
      await refreshUser();
      setNotice({ type: "success", message: "Bạn đã trở thành đối tác của MoonCake. Hãy vào khu quản lý cửa hàng." });
      reload();
    } catch (e) {
      setNotice({ type: "error", message: friendlyError(e) });
    } finally {
      setBusyId(null);
    }
  };

  const onCancel = async (r: OrganizerRegistration) => {
    setBusyId(r.id);
    setNotice(null);
    try {
      await organizerApi.cancelRegistration(r.id, cancelReason.trim());
      setNotice({ type: "success", message: "Đã hủy đơn đăng ký." });
      setCancelingId(null);
      setCancelReason("");
      reload();
    } catch (e) {
      setNotice({ type: "error", message: friendlyError(e) });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-xl font-black tracking-tight text-primary-dark">Đơn đăng ký đối tác</h1>
          <p className="mt-0.5 text-sm text-ink-muted">Theo dõi trạng thái các đơn đăng ký làm Organizer của bạn.</p>
        </div>
        {role === "user" && (
          <Link
            to="/become-partner"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            <Plus size={16} /> Gửi đơn mới
          </Link>
        )}
      </div>

      {notice && (
        <div className="mb-4">
          <FormAlert type={notice.type}>
            {notice.message}{" "}
            {notice.type === "success" && role === "organizer" && (
              <Link to="/store" className="font-semibold underline">
                Vào quản lý cửa hàng
              </Link>
            )}
          </FormAlert>
        </div>
      )}

      <div className="mb-4 flex items-center gap-2 text-sm">
        <label htmlFor="status-filter" className="text-ink-soft">
          Lọc theo trạng thái
        </label>
        <select
          id="status-filter"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as RegistrationStatus | "");
            setPage(1);
          }}
          className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm outline-none focus:border-primary"
        >
          <option value="">Tất cả</option>
          {(Object.keys(REGISTRATION_STATUS_LABEL) as RegistrationStatus[]).map((s) => (
            <option key={s} value={s}>
              {REGISTRATION_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      {error && <FormAlert type="error">{error}</FormAlert>}
      {loading && !data && <p className="text-sm text-ink-muted">Đang tải...</p>}

      {data && data.items.length === 0 && (
        <div className="rounded-xl border border-dashed border-line px-6 py-10 text-center">
          <p className="text-sm text-ink-soft">Bạn chưa có đơn đăng ký nào.</p>
          {role === "user" && (
            <Link to="/become-partner" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
              Đăng ký làm đối tác ngay
            </Link>
          )}
        </div>
      )}

      <ul className="space-y-4">
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
                <div className="flex items-center gap-1.5">
                  <Percent size={14} className="text-ink-muted" />
                  <dd>
                    Hoa hồng: <span className="font-semibold text-primary-dark">{r.commissionRate}%</span> mỗi đơn hàng
                  </dd>
                </div>
              )}
              {r.contactPhone && (
                <div className="flex gap-1.5">
                  <dt className="text-ink-muted">Liên hệ:</dt>
                  <dd>{r.contactPhone}</dd>
                </div>
              )}
            </dl>

            {r.status === "Rejected" && r.rejectReason && (
              <p className="mt-3 rounded-lg bg-primary/5 px-3 py-2 text-sm text-primary-dark">Lý do từ chối: {r.rejectReason}</p>
            )}
            {r.status === "Cancelled" && r.cancelReason && (
              <p className="mt-3 text-sm text-ink-muted">Lý do hủy: {r.cancelReason}</p>
            )}

            {r.status === "AwaitingConfirmation" && (
              <p className="mt-3 rounded-lg bg-[#fbecc9] px-3 py-2 text-sm text-[#8a5a0a]">
                Manager đề xuất mức hoa hồng <strong>{r.commissionRate}%</strong> cho mỗi đơn hàng. Bạn cần đồng ý để đơn có
                hiệu lực, hoặc hủy đơn nếu không đồng ý.
              </p>
            )}

            {(r.status === "AwaitingConfirmation" || canCancel(r)) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {r.status === "AwaitingConfirmation" && (
                  <button
                    onClick={() => onConfirm(r)}
                    disabled={busyId === r.id}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
                  >
                    {busyId === r.id ? "Đang xử lý..." : `Đồng ý hoa hồng ${r.commissionRate}%`}
                  </button>
                )}
                {canCancel(r) && cancelingId !== r.id && (
                  <button
                    onClick={() => {
                      setCancelingId(r.id);
                      setCancelReason("");
                    }}
                    className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink-soft hover:border-primary hover:text-primary"
                  >
                    {r.status === "AwaitingConfirmation" ? "Không đồng ý, hủy đơn" : "Hủy đơn"}
                  </button>
                )}
              </div>
            )}

            {cancelingId === r.id && (
              <div className="mt-4 space-y-3 rounded-lg bg-cream p-4">
                <TextAreaField
                  label="Lý do hủy (không bắt buộc)"
                  name={`cancel-${r.id}`}
                  rows={2}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => onCancel(r)}
                    disabled={busyId === r.id}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
                  >
                    {busyId === r.id ? "Đang xử lý..." : "Xác nhận hủy"}
                  </button>
                  <button
                    onClick={() => setCancelingId(null)}
                    className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold text-ink-soft hover:text-primary"
                  >
                    Giữ lại đơn
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
