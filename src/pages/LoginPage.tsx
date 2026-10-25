import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthShell } from "@/components/auth/AuthShell";
import { FormAlert, FormField, SubmitButton } from "@/components/auth/FormField";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import { EMAIL_REGEX } from "@/lib/validation";

interface LocationState {
  from?: string;
  notice?: string;
  email?: string;
}

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const state = (useLocation().state ?? {}) as LocationState;

  const [email, setEmail] = useState(state.email ?? "");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState("");
  const [unverified, setUnverified] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={state.from ?? "/"} replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();
    setEmail(cleanEmail);
    setPassword(cleanPassword);

    const next: typeof errors = {};
    if (!EMAIL_REGEX.test(cleanEmail)) next.email = "Email không hợp lệ.";
    setErrors(next);
    setServerError("");
    setUnverified(false);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      await login(cleanEmail, cleanPassword);
      navigate(state.from ?? "/", { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) setServerError("Email hoặc mật khẩu không đúng.");
        else if (error.status === 403 && /not verified/i.test(error.message)) {
          setUnverified(true);
          setServerError("Email chưa được xác thực. Hãy nhập mã OTP đã gửi tới email của bạn.");
        } else if (error.status === 403) setServerError("Tài khoản đã bị khóa.");
        else setServerError(error.message);
      } else setServerError("Không thể kết nối tới máy chủ.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Đăng nhập"
      subtitle="Chào mừng bạn quay lại MoonCake."
      footer={
        <>
          Chưa có tài khoản?{" "}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            Đăng ký ngay
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {state.notice && !serverError && <FormAlert type="success">{state.notice}</FormAlert>}
        {serverError && <FormAlert type="error">{serverError}</FormAlert>}
        {unverified && (
          <Link
            to="/verify-otp"
            state={{ email: email.trim() }}
            className="block text-sm font-semibold text-primary hover:underline"
          >
            Nhập mã xác thực
          </Link>
        )}
        <FormField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <FormField
          label="Mật khẩu"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <div className="text-right">
          <Link to="/forgot-password" className="text-sm font-semibold text-primary hover:underline">
            Quên mật khẩu?
          </Link>
        </div>
        <SubmitButton loading={submitting}>Đăng nhập</SubmitButton>
      </form>
    </AuthShell>
  );
}
