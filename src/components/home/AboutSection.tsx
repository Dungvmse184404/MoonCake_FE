import { Handshake, Store, Truck } from "lucide-react";

const POINTS = [
  { icon: Store, title: "Nhiều gian hàng", desc: "Bánh từ nhiều thương hiệu và cửa hàng đối tác, gom về một nơi để bạn dễ chọn." },
  { icon: Handshake, title: "Đối tác minh bạch", desc: "Mỗi gian hàng được MoonCake duyệt và quản lý hợp đồng thuê rõ ràng." },
  { icon: Truck, title: "Mùa Trung thu trọn vẹn", desc: "Từ bánh nướng, bánh dẻo đến hộp quà, đủ cho biếu tặng và sum họp gia đình." },
] as const;

export function AboutSection() {
  return (
    <section id="about" aria-labelledby="about-title" className="scroll-mt-32">
      <h2 id="about-title" className="font-serif text-2xl font-black text-primary-dark">
        Về MoonCake
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-ink-soft">
        MoonCake là sàn thương mại bánh Trung thu nhiều gian hàng, kết nối người làm bánh với khách hàng trong mùa lễ.
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {POINTS.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-xl border border-line bg-white p-5">
            <span className="grid size-10 place-items-center rounded-full bg-primary-soft text-primary">
              <Icon size={20} />
            </span>
            <h3 className="mt-3 font-semibold text-ink">{title}</h3>
            <p className="mt-1 text-sm text-ink-soft">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
