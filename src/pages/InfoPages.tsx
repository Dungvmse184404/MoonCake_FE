import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Ticket } from "lucide-react";
import { Container } from "@/components/layout/Container";

interface Section {
  title: string;
  body: ReactNode;
}

// Static help and policy pages linked from the footer
function InfoPage({ title, intro, sections, aside }: { title: string; intro: string; sections: Section[]; aside?: ReactNode }) {
  return (
    <Container className="py-8">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-primary">
        <ChevronLeft size={16} /> Trang chủ
      </Link>
      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <article className="rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
          <h1 className="font-serif text-3xl font-black text-primary-dark">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{intro}</p>
          <ol className="mt-6 space-y-6">
            {sections.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary">{i + 1}</span>
                <div className="min-w-0">
                  <h2 className="font-semibold text-ink">{s.title}</h2>
                  <div className="mt-1 space-y-2 text-sm leading-relaxed text-ink-soft">{s.body}</div>
                </div>
              </li>
            ))}
          </ol>
        </article>
        {aside && <aside className="rounded-2xl border border-line bg-white p-5 shadow-sm lg:sticky lg:top-36">{aside}</aside>}
      </div>
    </Container>
  );
}

const linkClass = "font-semibold text-primary hover:underline";

export function OrderGuidePage() {
  return (
    <InfoPage
      title="Hướng dẫn đặt hàng"
      intro="Mua bánh Trung thu trên MoonCake chỉ mất vài bước. Bạn cần đăng nhập để đặt hàng và theo dõi đơn."
      sections={[
        {
          title: "Chọn bánh hoặc hộp combo",
          body: (
            <p>
              Tìm bánh ở trang <Link to="/products" className={linkClass}>Sản phẩm</Link> hoặc{" "}
              <Link to="/cake-sets" className={linkClass}>Bánh &amp; hộp Trung thu</Link>. Với bánh lẻ, chọn loại bánh, nhân bánh và số
              lượng; với hộp combo, tự chọn bánh cho đủ số chiếc trong hộp.
            </p>
          ),
        },
        {
          title: "Mua ngay hoặc lưu vào giỏ",
          body: <p>"Mua ngay" đưa bạn tới trang thanh toán. "Thêm vào giỏ hàng" lưu sản phẩm để đặt cùng lúc nhiều món sau.</p>,
        },
        {
          title: "Thanh toán",
          body: (
            <p>
              Kiểm tra người nhận và địa chỉ, chọn giao tận nơi hoặc nhận tại gian hàng (với gian có địa điểm), rồi chọn phương thức
              thanh toán. Hiện MoonCake hỗ trợ thanh toán khi nhận hàng. Mỗi gian hàng tạo một đơn riêng.
            </p>
          ),
        },
        {
          title: "Theo dõi đơn",
          body: (
            <p>
              Xem trạng thái ở <Link to="/account/orders" className={linkClass}>Đơn hàng của tôi</Link>. Bạn có thể hủy đơn khi gian hàng
              chưa xác nhận; thông báo về đơn sẽ hiện ở chuông trên thanh tiêu đề.
            </p>
          ),
        },
      ]}
    />
  );
}

export function ReturnPolicyPage() {
  return (
    <InfoPage
      title="Chính sách đổi trả"
      intro="MoonCake hỗ trợ đổi trả trong 7 ngày cho bánh bị lỗi hoặc giao sai, theo các điều kiện dưới đây."
      sections={[
        {
          title: "Trường hợp được đổi trả",
          body: (
            <ul className="list-disc space-y-1 pl-5">
              <li>Bánh giao sai loại, sai nhân hoặc thiếu số lượng so với đơn.</li>
              <li>Bánh hư hỏng, móp méo nặng hoặc quá hạn sử dụng khi nhận.</li>
              <li>Hộp combo thiếu bánh so với lựa chọn lúc đặt.</li>
            </ul>
          ),
        },
        {
          title: "Thời hạn và cách yêu cầu",
          body: <p>Liên hệ gian hàng trong vòng 7 ngày kể từ khi nhận, kèm mã đơn và hình ảnh bánh. Giữ nguyên bao bì để gian hàng kiểm tra.</p>,
        },
        {
          title: "Không áp dụng",
          body: <p>Bánh đã dùng một phần, hư hỏng do bảo quản sai hướng dẫn, hoặc đổi ý sau khi đã nhận đúng hàng.</p>,
        },
        {
          title: "Hoàn tiền",
          body: <p>Với đơn thanh toán khi nhận hàng, gian hàng sẽ giao bánh thay thế hoặc hoàn tiền mặt theo thỏa thuận với bạn.</p>,
        },
      ]}
    />
  );
}

export function CommissionPolicyPage() {
  return (
    <InfoPage
      title="Chính sách hoa hồng"
      intro="MoonCake có hai hình thức hợp tác. Chi phí của mỗi hình thức khác nhau."
      sections={[
        {
          title: "Thuê gian hàng",
          body: (
            <p>
              Bạn trả giá thuê cố định của gian cho thời gian thuê, không chia hoa hồng trên đơn. Giá thuê hiển thị ở trang chi tiết từng{" "}
              <Link to="/stalls" className={linkClass}>gian hàng</Link>.
            </p>
          ),
        },
        {
          title: "Bán online",
          body: (
            <p>
              Không cần thuê gian. Sau khi xem đơn đăng ký, Ban quản lý đề xuất một tỷ lệ hoa hồng tính trên mỗi đơn hàng; bạn xác nhận
              tỷ lệ đó thì trở thành đối tác.
            </p>
          ),
        },
        {
          title: "Thay đổi và chấm dứt",
          body: <p>Đối tác vi phạm quy định có thể bị đình chỉ. Hợp đồng thuê gian có thể bị chấm dứt trước hạn trong trường hợp này.</p>,
        },
      ]}
      aside={
        <div className="space-y-3 text-sm">
          <p className="font-semibold text-ink">Muốn hợp tác cùng MoonCake?</p>
          <Link to="/become-partner?type=stall" className="block rounded-lg bg-primary px-4 py-2.5 text-center font-semibold text-white hover:bg-primary-dark">
            Thuê gian hàng
          </Link>
          <Link to="/become-partner?type=online" className="block rounded-lg border border-primary px-4 py-2.5 text-center font-semibold text-primary hover:bg-primary-soft">
            Đăng ký bán online
          </Link>
        </div>
      }
    />
  );
}

export function VouchersPage() {
  return (
    <Container className="py-16 text-center">
      <Ticket className="mx-auto text-primary" size={48} strokeWidth={1.25} />
      <h1 className="mt-4 font-serif text-3xl font-black text-primary-dark">Voucher và khuyến mãi</h1>
      <p className="mx-auto mt-2 max-w-md text-ink-soft">Chương trình voucher của MoonCake và các gian hàng sẽ sớm ra mắt. Hãy quay lại sau nhé.</p>
      <Link to="/products" className="mt-6 inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark">
        Xem sản phẩm
      </Link>
    </Container>
  );
}

export function NotFoundPage() {
  return (
    <Container className="py-20 text-center">
      <p className="font-serif text-7xl font-black text-primary/30">404</p>
      <h1 className="mt-2 font-serif text-3xl font-black text-primary-dark">Không tìm thấy trang</h1>
      <p className="mx-auto mt-2 max-w-md text-ink-soft">Đường dẫn có thể đã thay đổi hoặc không tồn tại.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link to="/" className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark">
          Về trang chủ
        </Link>
        <Link to="/products" className="rounded-lg border border-primary px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary-soft">
          Xem sản phẩm
        </Link>
      </div>
    </Container>
  );
}
