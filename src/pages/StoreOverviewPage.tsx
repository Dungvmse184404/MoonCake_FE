import { Link } from "react-router-dom";
import { AlertTriangle, Mail, Phone, Store } from "lucide-react";
import { boxApi } from "@/lib/boxApi";
import { orderApi } from "@/lib/orderApi";
import { productApi } from "@/lib/productApi";
import { FormAlert } from "@/components/auth/FormField";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, ORGANIZER_STATUS_LABEL } from "@/lib/labels";
import { organizerApi } from "@/lib/organizerApi";
import { useAsync } from "@/lib/useAsync";

const COMING_SOON = ["Tạo voucher gian hàng", "Xem hoa hồng sàn"];

// Totals come from the paged lists (pageSize 1, only totalCount is read)
async function loadStats() {
  const count = (p: Promise<{ totalCount: number }>) => p.then((r) => r.totalCount).catch(() => null);
  const [pending, confirmed, activeProducts, outOfStock, boxes] = await Promise.all([
    count(orderApi.organizerOrders({ status: "Pending", pageSize: 1 })),
    count(orderApi.organizerOrders({ status: "Confirmed", pageSize: 1 })),
    count(productApi.myProducts({ status: "Active", pageSize: 1 })),
    count(productApi.myProducts({ status: "OutOfStock", pageSize: 1 })),
    count(boxApi.mine({ status: "Active", pageSize: 1 })),
  ]);
  return [
    { label: "Đơn chờ xác nhận", value: pending, to: "/store/orders" },
    { label: "Đơn đã xác nhận", value: confirmed, to: "/store/orders" },
    { label: "Sản phẩm đang bán", value: activeProducts, to: "/store/products" },
    { label: "Sản phẩm hết hàng", value: outOfStock, to: "/store/products" },
    { label: "Hộp combo đang bán", value: boxes, to: "/store/boxes" },
  ];
}

export function StoreOverviewPage() {
  const { data: org, loading, error } = useAsync(() => organizerApi.myOrganizer(), []);
  const { data: stats } = useAsync(loadStats, []);

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

      {stats && (
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" aria-label="Số liệu cửa hàng">
          {stats.map((s) => (
            <Link key={s.label} to={s.to} className="rounded-xl border border-line p-4 transition hover:border-primary">
              <p className="text-2xl font-black text-primary-dark">{s.value ?? "—"}</p>
              <p className="mt-0.5 text-xs text-ink-muted">{s.label}</p>
            </Link>
          ))}
        </section>
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
