import { Navigate, Route, Routes } from "react-router-dom";
import { RequireRole } from "@/components/layout/RequireRole";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProfileLayout } from "@/components/layout/ProfileLayout";
import { HomePage } from "@/pages/HomePage";
import { CakeSetsPage } from "@/pages/CakeSetsPage";
import { ProductsPage } from "@/pages/ProductsPage";
import { ProductDetailPage } from "@/pages/ProductDetailPage";
import { StallsPage } from "@/pages/StallsPage";
import { StallDetailPage } from "@/pages/StallDetailPage";
import { StoreLayout } from "@/components/layout/StoreLayout";
import { StoreOverviewPage } from "@/pages/StoreOverviewPage";
import { StoreProfilePage } from "@/pages/StoreProfilePage";
import { ProductsManagePage } from "@/pages/ProductsManagePage";
import { NotificationsPage } from "@/pages/NotificationsPage";
import { StoreRentalsPage } from "@/pages/StoreRentalsPage";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminRegistrationsPage } from "@/pages/admin/AdminRegistrationsPage";
import { AdminStallsPage } from "@/pages/admin/AdminStallsPage";
import { AdminOrganizersPage } from "@/pages/admin/AdminOrganizersPage";
import { AdminRentalsPage } from "@/pages/admin/AdminRentalsPage";
import { ProductFormPage } from "@/pages/ProductFormPage";
import { PartnerRegisterPage } from "@/pages/PartnerRegisterPage";
import { MyRegistrationsPage } from "@/pages/MyRegistrationsPage";
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage";
import { StoreCatalogPage } from "@/pages/StoreCatalogPage";
import { AdminUsersPage } from "@/pages/admin/AdminUsersPage";
import { CartPage } from "@/pages/CartPage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { VerifyOtpPage } from "@/pages/VerifyOtpPage";
import { ProfileInfoPage } from "@/pages/ProfileInfoPage";

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="cake-sets" element={<CakeSetsPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/:id" element={<ProductDetailPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="stalls" element={<StallsPage />} />
        <Route path="stalls/:id" element={<StallDetailPage />} />
        <Route
          path="store"
          element={
            <RequireRole roles={["organizer"]}>
              <StoreLayout />
            </RequireRole>
          }
        >
          <Route index element={<StoreOverviewPage />} />
          <Route path="profile" element={<StoreProfilePage />} />
          <Route path="rentals" element={<StoreRentalsPage />} />
          <Route path="catalog" element={<StoreCatalogPage />} />
          <Route path="products" element={<ProductsManagePage />} />
          <Route path="products/new" element={<ProductFormPage />} />
          <Route path="products/:id/edit" element={<ProductFormPage />} />
        </Route>
        <Route
          path="admin"
          element={
            <RequireRole roles={["manager"]}>
              <AdminLayout />
            </RequireRole>
          }
        >
          <Route index element={<Navigate to="registrations" replace />} />
          <Route path="registrations" element={<AdminRegistrationsPage />} />
          <Route path="stalls" element={<AdminStallsPage />} />
          <Route path="organizers" element={<AdminOrganizersPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="rentals" element={<AdminRentalsPage />} />
        </Route>
        <Route
          path="become-partner"
          element={
            <RequireRole roles={["user", "organizer", "manager"]}>
              <PartnerRegisterPage />
            </RequireRole>
          }
        />
        <Route
          path="account"
          element={
            <RequireRole roles={["user", "organizer", "manager"]}>
              <ProfileLayout />
            </RequireRole>
          }
        >
          <Route index element={<Navigate to="profile" replace />} />
          <Route path="profile" element={<ProfileInfoPage />} />
          <Route path="registrations" element={<MyRegistrationsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="verify-otp" element={<VerifyOtpPage />} />
        <Route path="*" element={<HomePage />} />
      </Route>
    </Routes>
  );
}
