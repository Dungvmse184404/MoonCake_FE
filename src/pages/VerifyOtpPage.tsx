import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthShell } from "@/components/auth/AuthShell";
import { FormAlert, FormField, SubmitButton } from "@/components/auth/FormField";
import { ApiError } from "@/lib/api";
import { authApi } from "@/lib/authApi";
import { EMAIL_REGEX } from "@/lib/validation";

const RESEND_COOLDOWN_SECONDS = 60;

interface LocationState {
  email?: string;
  fresh?: boolean;
}

export function VerifyOtpPage() {
  const state = (useLocation().state ?? {}) as LocationState;
  const navigate = useNavigate();

  const [email, setEmail] = useState(state.email ?? "");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState(state.fresh ? "Đăng ký thành công. Mã xác thực đã được gửi tới email của bạn." : "");
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(state.fresh ? RESEND_COOLDOWN_SECONDS : 0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const emailValid = EMAIL_REGEX.test(email.trim());

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!emailValid) return setError("Email không hợp lệ.");
    if (!/^\d{6}$/.test(otp)) return setError("Mã OTP gồm 6 chữ số.");

    setSubmitting(true);
    try {
      await authApi.verifyOtp(email.trim(), otp);
      navigate("/dang-nhap", {
        replace: true,
        state: { email: email.trim(), notice: "Xác thực email thành công. Vui lòng đăng nhập." },
      });
    } catch (err) {
      setError(err instanceof ApiError ? translate(err.message) : "Không thể kết nối tới máy chủ.");
    } finally {
      setSubmitting(false);
    }
  };

  const onResend = async () => {
    setError("");
    setInfo("");
    if (!emailValid) return setError("Email không hợp lệ.");
    try {
      await authApi.resendOtp(email.trim());
      setInfo("Đã gửi lại mã OTP mới tới email của bạn.");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(err instanceof ApiError ? translate(err.message) : "Không thể kết nối tới máy chủ.");
    }
  };

  return (
    <AuthShell
      title="Xác thực email"
      subtitle="Nhập mã OTP gồm 6 chữ số đã gửi tới email của bạn."
      footer={
        <Link to="/dang-nhap" className="font-semibold text-primary hover:underline">
          Quay lại đăng nhập
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {info && <FormAlert type="success">{info}</FormAlert>}
        {error && <FormAlert type="error">{error}</FormAlert>}
        <FormField label="Email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <FormField
          label="Mã OTP"
          name="otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="______"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
        />
        <SubmitButton loading={submitting}>Xác thực</SubmitButton>
        <button
          type="button"
          onClick={onResend}
          disabled={cooldown > 0}
          className="w-full text-sm font-semibold text-primary hover:underline disabled:cursor-not-allowed disabled:text-ink-muted disabled:no-underline"
        >
          {cooldown > 0 ? `Gửi lại mã sau ${cooldown}s` : "Gửi lại mã"}
        </button>
      </form>
    </AuthShell>
  );
}

// Một số thông báo thường gặp từ backend (tiếng Anh) đổi sang tiếng Việt.
function translate(message: string): string {
  if (/invalid or has expired/i.test(message)) return "Mã OTP không hợp lệ hoặc đã hết hạn. Hãy gửi lại mã mới.";
  if (/too many|attempts/i.test(message)) return "Bạn đã nhập sai quá nhiều lần. Hãy gửi lại mã mới.";
  if (/invalid|incorrect/i.test(message)) return "Mã OTP không đúng.";
  if (/already verified/i.test(message)) return "Email này đã được xác thực. Hãy đăng nhập.";
  if (/not found/i.test(message)) return "Không tìm thấy tài khoản với email này.";
  return message;
}
