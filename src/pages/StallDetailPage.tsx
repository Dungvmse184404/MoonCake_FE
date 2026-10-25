import { Link, useParams } from "react-router-dom";
import { ChevronLeft, MapPin } from "lucide-react";
import { FormAlert } from "@/components/auth/FormField";
import { Container } from "@/components/layout/Container";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/context/AuthContext";
import { formatVnd, STALL_STATUS_LABEL } from "@/lib/labels";
import { organizerApi } from "@/lib/organizerApi";
import { useAsync } from "@/lib/useAsync";

export function StallDetailPage() {
  const { id = "" } = useParams();
  const { role } = useAuth();
  const { data: stall, loading, error } = useAsync(() => organizerApi.getStall(id), [id]);

  if (loading && !stall) return <Container className="py-16 text-center text-ink-muted">Đang tải...</Container>;

  if (error || !stall) {
    return (
      <Container className="py-16">
        <div className="mx-auto max-w-lg space-y-4 text-center">
          <FormAlert type="error">{error || "Không tìm thấy gian hàng."}</FormAlert>
          <Link to="/stalls" className="inline-block text-sm font-semibold text-primary hover:underline">
            Quay lại danh sách gian hàng
          </Link>
        </div>
      </Container>
    );
  }

  const available = stall.status === "Available";
  const canApply = role !== "manager";

  return (
    <Container className="py-8">
      <Link to="/stalls" className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-primary">
        <ChevronLeft size={16} /> Gian hàng
      </Link>

      <div className="mt-4 rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-primary">{stall.code}</p>
            <h1 className="font-serif text-3xl font-black text-primary-dark">{stall.name}</h1>
            {stall.location && (
              <p className="mt-1 flex items-center gap-1 text-sm text-ink-muted">
                <MapPin size={14} /> {stall.location}
              </p>
            )}
          </div>
          <StatusBadge tone={available ? "success" : "info"}>{STALL_STATUS_LABEL[stall.status]}</StatusBadge>
        </div>

        {stall.description && <p className="mt-5 text-sm leading-relaxed text-ink-soft">{stall.description}</p>}

        <dl className="mt-6">
          <div className="inline-block rounded-xl bg-cream p-4">
            <dt className="text-xs text-ink-muted">Giá thuê</dt>
            <dd className="mt-1 text-lg font-bold text-ink">{formatVnd(stall.rentalPrice)}</dd>
          </div>
        </dl>

        {canApply && (
          <Link
            to={`/become-partner?type=stall&stallId=${stall.id}`}
            className="mt-6 inline-block rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            {available ? "Đăng ký thuê gian hàng" : "Đăng ký thuê cho kỳ khác"}
          </Link>
        )}
      </div>
    </Container>
  );
}
