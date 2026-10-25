import { Link } from "react-router-dom";
import { ArrowRight, Globe, Store } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const OPTIONS = [
  {
    type: "stall",
    icon: Store,
    title: "Thuê gian hàng",
    desc: "Chọn gian hàng phù hợp, đăng ký thời gian thuê và bắt đầu bán bánh Trung thu ngay trong mùa lễ.",
    cta: "Xem gian hàng",
  },
  {
    type: "online",
    icon: Globe,
    title: "Bán online",
    desc: "Không cần thuê gian hàng. Đăng bán sản phẩm trực tuyến, MoonCake chỉ thu hoa hồng trên mỗi đơn hoàn tất.",
    cta: "Đăng ký bán online",
  },
] as const;

// Entry points to Flow 2 (apply to become an Organizer). Hidden for managers, who do not apply.
export function PartnerSection() {
  const { role } = useAuth();
  if (role === "manager") return null;

  const heading = role === "organizer" ? "Mở rộng việc bán hàng" : "Trở thành đối tác của MoonCake";
  const subtitle =
    role === "organizer"
      ? "Thuê thêm gian hàng hoặc đăng ký bán online để tiếp cận nhiều khách hơn."
      : "Thuê gian hàng hoặc bán online, MoonCake lo phần kết nối khách hàng và thanh toán hoa hồng.";

  return (
    <section aria-labelledby="partner-title" className="rounded-2xl bg-gradient-to-br from-primary-dark to-primary p-6 text-white shadow-md sm:p-8">
      <h2 id="partner-title" className="font-serif text-2xl font-black">
        {heading}
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-white/85">{subtitle}</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {OPTIONS.map(({ type, icon: Icon, title, desc, cta }) => (
          <Link
            key={type}
            to={type === "stall" && role === "guest" ? "/stalls" : `/become-partner?type=${type}`}
            className="group rounded-xl bg-white/10 p-5 transition hover:bg-white/20"
          >
            <span className="grid size-11 place-items-center rounded-full bg-white/90 text-primary">
              <Icon size={22} />
            </span>
            <h3 className="mt-3 text-lg font-bold">{title}</h3>
            <p className="mt-1 text-sm text-white/80">{desc}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary-soft transition-all group-hover:gap-2">
              {cta} <ArrowRight size={14} />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
