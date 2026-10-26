import { Link, useParams } from "react-router-dom";
import { isMappable, StallsMap } from "@/components/address/StallsMap";
import { ChevronLeft, MapPin } from "lucide-react";
import { FormAlert } from "@/components/auth/FormField";
import { BoxCard } from "@/components/catalog/BoxCard";
import { ProductCard } from "@/components/catalog/ProductCard";
import { Container } from "@/components/layout/Container";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/context/AuthContext";
import { boxApi } from "@/lib/boxApi";
import { catalogApi } from "@/lib/catalog";
import { formatVnd, STALL_STATUS_LABEL } from "@/lib/labels";
import { organizerApi } from "@/lib/organizerApi";
import { useAsync } from "@/lib/useAsync";

export function StallDetailPage() {
  const { id = "" } = useParams();
  const { role } = useAuth();
  const { data: stall, loading, error } = useAsync(() => organizerApi.getStall(id), [id]);
  const { data: products } = useAsync(() => catalogApi.listProducts({ stallId: id, pageSize: 8 }), [id]);
  const { data: boxes } = useAsync(() => boxApi.list({ stallId: id, pageSize: 4 }), [id]);

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

      <div
        className={`mt-4 grid gap-6 rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8 ${
          isMappable(stall.location) ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]" : ""
        }`}
      >
        <div>
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

        {isMappable(stall.location) && <StallsMap stalls={[stall]} height={320} linkToStall={false} />}
      </div>

      {!!boxes?.items.length && (
        <section className="mt-8" aria-labelledby="stall-boxes-title">
          <h2 id="stall-boxes-title" className="font-serif text-xl font-black text-primary-dark">
            Hộp combo tại gian này
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {boxes.items.map((b) => (
              <BoxCard key={b.id} box={b} />
            ))}
          </div>
        </section>
      )}

      {!!products?.items.length && (
        <section className="mt-8" aria-labelledby="stall-products-title">
          <h2 id="stall-products-title" className="font-serif text-xl font-black text-primary-dark">
            Đang bán tại gian này
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {products.items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </Container>
  );
}
