import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthShell } from "@/components/auth/AuthShell";
import { FormAlert, FormField, SubmitButton } from "@/components/auth/FormField";
import { authApi } from "@/lib/authApi";
import { friendlyError } from "@/lib/errors";
import { EMAIL_REGEX } from "@/lib/validation";

// Step 1 asks for an OTP by email, step 2 sets the new password with that OTP.
export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const sendOtp = async (e?: FormEvent) => {
    e?.preventDefault();
    const clean = email.trim();
    setEmail(clean);
    setError("");
    setInfo("");
    if (!EMAIL_REGEX.test(clean)) return setError("Email không hợp lệ.");

    setSubmitting(true);
    try {
      await authApi.forgotPassword(clean);
      setStep("reset");
      setInfo("Nếu email tồn tại, mã OTP đã được gửi. Mã có hiệu lực trong thời gian ngắn.");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const reset = async (e: FormEvent) => {
    e.preventDefault();
    const cleanPassword = password.trim();
    const cleanConfirm = confirm.trim();
    setPassword(cleanPassword);
    setConfirm(cleanConfirm);
    setError("");
    setInfo("");
    if (!/^\d{6}$/.test(otp)) return setError("Mã OTP gồm 6 chữ số.");
    if (!cleanPassword) return setError("Vui lòng nhập mật khẩu mới.");
    if (cleanPassword !== cleanConfirm) return setError("Mật khẩu xác nhận không khớp.");

    setSubmitting(true);
    try {
      await authApi.resetPassword({
        email: email.trim(),
        otpCode: otp,
        newPassword: cleanPassword,
        confirmNewPassword: cleanConfirm,
      });
      navigate("/login", {
        replace: true,
        state: { email: email.trim(), notice: "Đã đặt lại mật khẩu. Vui lòng đăng nhập bằng mật khẩu mới." },
      });
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Quên mật khẩu"
      subtitle={step === "email" ? "Nhập email để nhận mã OTP đặt lại mật khẩu." : "Nhập mã OTP và mật khẩu mới."}
      footer={
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Quay lại đăng nhập
        </Link>
      }
    >
      {step === "email" ? (
        <form onSubmit={sendOtp} className="space-y-4" noValidate>
          {error && <FormAlert type="error">{error}</FormAlert>}
          <FormField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <SubmitButton loading={submitting}>Gửi mã OTP</SubmitButton>
        </form>
      ) : (
        <form onSubmit={reset} className="space-y-4" noValidate>
          {info && <FormAlert type="success">{info}</FormAlert>}
          {error && <FormAlert type="error">{error}</FormAlert>}
          <FormField label="Email" name="email" type="email" value={email} readOnly />
          <FormField
            label="Mã OTP"
            name="otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="123456"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          />
          <FormField
            label="Mật khẩu mới"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <FormField
            label="Nhập lại mật khẩu mới"
            name="confirmNewPassword"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <SubmitButton loading={submitting}>Đặt lại mật khẩu</SubmitButton>
          <button
            type="button"
            onClick={() => sendOtp()}
            disabled={submitting}
            className="w-full text-sm font-semibold text-primary hover:underline disabled:opacity-60"
          >
            Gửi lại mã
          </button>
        </form>
      )}
    </AuthShell>
  );
}
