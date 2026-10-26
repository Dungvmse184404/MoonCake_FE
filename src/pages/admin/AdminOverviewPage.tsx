import { Link } from "react-router-dom";
import { ClipboardCheck, FileText, Store, UserCog, Users } from "lucide-react";
import type { ComponentType } from "react";
import { adminApi } from "@/lib/adminApi";
import { useAsync } from "@/lib/useAsync";

interface Stat {
  label: string;
  value: number | null;
  to: string;
  highlight?: boolean;
}

// Totals come from the paged lists (pageSize 1, only totalCount is read)
async function loadStats() {
  const count = (p: Promise<{ totalCount: number }>) => p.then((r) => r.totalCount).catch(() => null);
  const [pending, awaiting, available, rented, activeOrganizers, suspended, activeRentals, users] = await Promise.all([
    count(adminApi.listRegistrations({ status: "Pending", pageSize: 1 })),
    count(adminApi.listRegistrations({ status: "AwaitingConfirmation", pageSize: 1 })),
    count(adminApi.listStalls({ status: "Available", pageSize: 1 })),
    count(adminApi.listStalls({ status: "Rented", pageSize: 1 })),
    count(adminApi.listOrganizers({ status: "Active", pageSize: 1 })),
    count(adminApi.listOrganizers({ status: "Suspended", pageSize: 1 })),
    count(adminApi.listRentals({ status: "Active", pageSize: 1 })),
    count(adminApi.listUsers({ pageSize: 1 })),
  ]);
  return { pending, awaiting, available, rented, activeOrganizers, suspended, activeRentals, users };
}

function StatGroup({ title, icon: Icon, stats }: { title: string; icon: ComponentType<{ size?: number; className?: string }>; stats: Stat[] }) {
  return (
    <section className="rounded-xl border border-line p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
        <Icon size={16} className="text-primary" /> {title}
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            to={s.to}
            className={`rounded-lg p-3 transition hover:ring-2 hover:ring-primary/30 ${s.highlight && s.value ? "bg-primary-soft" : "bg-cream"}`}
          >
            <p className={`text-2xl font-black ${s.highlight && s.value ? "text-primary" : "text-primary-dark"}`}>{s.value ?? "—"}</p>
            <p className="mt-0.5 text-xs text-ink-muted">{s.label}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function AdminOverviewPage() {
  const { data: s, loading } = useAsync(loadStats, []);

  return (
    <div className="w-full">
      <h1 className="font-serif text-xl font-black tracking-tight text-primary-dark">Tổng quan</h1>
      <p className="mt-0.5 text-sm text-ink-muted">Những việc cần xử lý và tình hình sàn hiện tại.</p>
      {loading && !s && <p className="mt-4 text-sm text-ink-muted">Đang tải...</p>}

      {s && (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <StatGroup
            title="Đơn đăng ký đối tác"
            icon={ClipboardCheck}
            stats={[
              { label: "Chờ duyệt", value: s.pending, to: "/admin/registrations", highlight: true },
              { label: "Chờ xác nhận hoa hồng", value: s.awaiting, to: "/admin/registrations" },
            ]}
          />
          <StatGroup
            title="Gian hàng"
            icon={Store}
            stats={[
              { label: "Còn trống", value: s.available, to: "/admin/stalls" },
              { label: "Đã có người thuê", value: s.rented, to: "/admin/stalls" },
            ]}
          />
          <StatGroup
            title="Organizer"
            icon={Users}
            stats={[
              { label: "Đang hoạt động", value: s.activeOrganizers, to: "/admin/organizers" },
              { label: "Bị đình chỉ", value: s.suspended, to: "/admin/organizers", highlight: true },
            ]}
          />
          <StatGroup
            title="Hợp đồng và người dùng"
            icon={FileText}
            stats={[
              { label: "Hợp đồng đang thuê", value: s.activeRentals, to: "/admin/rentals" },
              { label: "Tài khoản", value: s.users, to: "/admin/users" },
            ]}
          />
        </div>
      )}

      <p className="mt-4 flex items-center gap-1.5 text-xs text-ink-muted">
        <UserCog size={13} /> Bấm vào một ô để mở danh sách tương ứng.
      </p>
    </div>
  );
}
