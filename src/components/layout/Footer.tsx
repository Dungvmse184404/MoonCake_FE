import { Link } from "react-router-dom";
import { Moon } from "lucide-react";
import { Container } from "./Container";

export function Footer() {
  return (
    <footer id="home-page" className="relative z-10 mt-16 bg-primary-dark text-primary-soft">
      <Container className="grid gap-8 py-10 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 font-serif text-xl font-black text-white">
            <Moon size={20} /> MoonCake
          </div>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-primary-soft/80">
            Sàn thương mại bánh Trung thu nhiều gian hàng. MoonCake vừa kết nối các gian hàng đối tác, vừa trực tiếp
            bán bánh đến tay khách hàng.
          </p>
        </div>
        <div className="text-sm">
          <h3 className="mb-3 font-semibold text-white">Dành cho khách hàng</h3>
          <ul className="space-y-2 text-primary-soft/80">
            <li>
              <Link to="/help/ordering" className="hover:text-white">
                Hướng dẫn đặt hàng
              </Link>
            </li>
            <li>
              <Link to="/policies/returns" className="hover:text-white">
                Chính sách đổi trả
              </Link>
            </li>
            <li>
              <Link to="/vouchers" className="hover:text-white">
                Voucher và khuyến mãi
              </Link>
            </li>
          </ul>
        </div>
        <div className="text-sm">
          <h3 className="mb-3 font-semibold text-white">Dành cho đối tác</h3>
          <ul className="space-y-2 text-primary-soft/80">
            <li>
              <Link to="/become-partner?type=stall" className="hover:text-white">
                Thuê gian hàng
              </Link>
            </li>
            <li>
              <Link to="/become-partner?type=online" className="hover:text-white">
                Bán online cùng MoonCake
              </Link>
            </li>
            <li>
              <Link to="/policies/commission" className="hover:text-white">
                Chính sách hoa hồng
              </Link>
            </li>
          </ul>
        </div>
      </Container>
      <div className="border-t border-white/10 py-4 text-center text-xs text-primary-soft/60">
        © 2026 MoonCake. Dự án PRN232.
      </div>
    </footer>
  );
}
