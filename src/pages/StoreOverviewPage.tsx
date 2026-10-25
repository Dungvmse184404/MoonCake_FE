import { Link } from "react-router-dom";
import { AlertTriangle, Mail, Phone, Store } from "lucide-react";
import { FormAlert } from "@/components/auth/FormField";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, ORGANIZER_STATUS_LABEL } from "@/lib/labels";
import { organizerApi } from "@/lib/organizerApi";
import { useAsync } from "@/lib/useAsync";

const COMING_SOON = ["Đăng bán bánh lẻ và hộp combo", "Tạo voucher gian hàng", "Xử lý đơn hàng theo thời gian thực", "Xem hoa hồng sàn"];

export function StoreOverviewPage() {
  const { data: org, loading, error } = useAsync(() => organizerApi.myOrganizer(), []);

  if (loading && !org) return <p className="text-sm text-ink-muted">Đang tải...</p>;
  if (error) return <FormAlert type="error">{error}</FormAlert>;
  if (!org) return null;

  const suspended = org.status === "Suspended";

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-4">
          <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Store size={28} />
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-serif text-xl font-black tracking-tight text-primary-dark">{org.brandName}</h1>
            <p className="text-xs text-ink-muted">Đối tác từ {formatDate(org.approvedAt ?? org.createdAt)}</p>
          </div>
        </div>
        <StatusBadge tone={suspended ? "danger" : "success"}>{ORGANIZER_STATUS_LABEL[org.status]}</StatusBadge>
      </div>

      {suspended && (
        <div className="flex gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm text-primary-dark">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Hồ sơ của bạn đang bị đình chỉ</p>
            {org.suspendReason && <p className="mt-0.5">Lý do: {org.suspendReason}</p>}
            <p className="mt-0.5 text-xs">Trong thời gian này bạn không thể đăng bán sản phẩm hoặc tạo voucher.</p>
          </div>
        </div>
      )}

      <section className="rounded-xl border border-line p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-ink">Thông tin liên hệ</h2>
          <Link to="/store/profile" className="text-sm font-semibold text-primary hover:underline">
            Chỉnh sửa
          </Link>
        </div>
        <dl className="mt-3 space-y-2 text-sm text-ink-soft">
          <div className="flex items-center gap-2">
            <Phone size={14} className="text-ink-muted" />
            <dd>{org.contactPhone || "Chưa cập nhật số điện thoại"}</dd>
          </div>
          <div className="flex items-center gap-2">
            <Mail size={14} className="text-ink-muted" />
            <dd>{org.contactEmail || "Chưa cập nhật email liên hệ"}</dd>
          </div>
          {org.businessInfo && <p className="whitespace-pre-line pt-1 text-ink-soft">{org.businessInfo}</p>}
        </dl>
      </section>

      <section className="rounded-xl border border-dashed border-line p-5">
        <h2 className="font-semibold text-ink">Sắp có</h2>
        <p className="mt-0.5 text-sm text-ink-muted">Các chức năng dưới đây sẽ mở khi backend hoàn thiện.</p>
        <ul className="mt-3 grid gap-2 text-sm text-ink-soft sm:grid-cols-2">
          {COMING_SOON.map((item) => (
            <li key={item} className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-gold" /> {item}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
