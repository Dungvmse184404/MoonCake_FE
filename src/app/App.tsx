import { Navigate, Route, Routes } from "react-router-dom";
import { RequireRole } from "@/components/layout/RequireRole";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProfileLayout } from "@/components/layout/ProfileLayout";
import { HomePage } from "@/pages/HomePage";
import { CakeSetsPage } from "@/pages/CakeSetsPage";
import { ProductsPage } from "@/pages/ProductsPage";
import { StoreManagePage } from "@/pages/StoreManagePage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { VerifyOtpPage } from "@/pages/VerifyOtpPage";
import { ProfileInfoPage } from "@/pages/ProfileInfoPage";

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="banh-trung-thu" element={<CakeSetsPage />} />
        <Route path="san-pham" element={<ProductsPage />} />
        <Route
          path="quan-ly-cua-hang"
          element={
            <RequireRole roles={["organizer", "manager"]}>
              <StoreManagePage />
            </RequireRole>
          }
        />
        <Route
          path="tai-khoan"
          element={
            <RequireRole roles={["user", "organizer", "manager"]}>
              <ProfileLayout />
            </RequireRole>
          }
        >
          <Route index element={<Navigate to="thong-tin" replace />} />
          <Route path="thong-tin" element={<ProfileInfoPage />} />
        </Route>
        <Route path="dang-nhap" element={<LoginPage />} />
        <Route path="dang-ky" element={<RegisterPage />} />
        <Route path="xac-thuc-otp" element={<VerifyOtpPage />} />
        <Route path="*" element={<HomePage />} />
      </Route>
    </Routes>
  );
}
