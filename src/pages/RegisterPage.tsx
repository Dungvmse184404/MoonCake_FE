import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { AuthShell } from "@/components/auth/AuthShell";
import { FormAlert, FormField, SubmitButton } from "@/components/auth/FormField";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import { authApi } from "@/lib/authApi";
import { EMAIL_REGEX, PHONE_REGEX /*, validatePassword */ } from "@/lib/validation";

const EMPTY = { fullName: "", email: "", phone: "", address: "", password: "", confirmPassword: "" };
type Form = typeof EMPTY;

const trimForm = (form: Form): Form =>
  Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim()])) as Form;

export function RegisterPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Partial<Form>>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = (clean: Form): Partial<Form> => {
    const next: Partial<Form> = {};
    if (!clean.fullName) next.fullName = "Vui lòng nhập họ tên.";
    else if (clean.fullName.length > 100) next.fullName = "Họ tên tối đa 100 ký tự.";
    if (!EMAIL_REGEX.test(clean.email)) next.email = "Email không hợp lệ.";
    if (!PHONE_REGEX.test(clean.phone)) next.phone = "Số điện thoại không hợp lệ (ví dụ 0912345678).";
    if (clean.address.length > 255) next.address = "Địa chỉ tối đa 255 ký tự.";
    // const passwordError = validatePassword(clean.password);
    // if (passwordError) next.password = passwordError;
    if (clean.confirmPassword !== clean.password) next.confirmPassword = "Mật khẩu xác nhận không khớp.";
    return next;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const clean = trimForm(form);
    setForm(clean); // show the trimmed values
    const next = validate(clean);
    setErrors(next);
    setServerError("");
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      await authApi.register(clean);
      navigate("/verify-otp", { state: { email: clean.email, fresh: true } });
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) setErrors({ email: "Email này đã được đăng ký." });
      else setServerError(error instanceof ApiError ? error.message : "Không thể kết nối tới máy chủ.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      wide
      title="Tạo tài khoản"
      subtitle="Đăng ký để mua bánh Trung thu hoặc trở thành đối tác bán hàng."
      footer={
        <>
          Đã có tài khoản?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Đăng nhập
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {serverError && <FormAlert type="error">{serverError}</FormAlert>}
        <FormField label="Họ và tên" name="fullName" autoComplete="name" value={form.fullName} onChange={set("fullName")} error={errors.fullName} />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Email" name="email" type="email" autoComplete="email" value={form.email} onChange={set("email")} error={errors.email} />
          <FormField label="Số điện thoại" name="phone" type="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} error={errors.phone} />
        </div>
        <FormField label="Địa chỉ (không bắt buộc)" name="address" autoComplete="street-address" value={form.address} onChange={set("address")} error={errors.address} />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Mật khẩu" name="password" type="password" autoComplete="new-password" value={form.password} onChange={set("password")} error={errors.password} />
          <FormField label="Nhập lại mật khẩu" name="confirmPassword" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={set("confirmPassword")} error={errors.confirmPassword} />
        </div>
        <p className="text-xs text-ink-muted">Mật khẩu tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt.</p>
        <SubmitButton loading={submitting}>Đăng ký</SubmitButton>
      </form>
    </AuthShell>
  );
}
