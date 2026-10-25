import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { BadgeCheck, LogOut } from "lucide-react";
import { FormAlert, FormField, SubmitButton } from "@/components/auth/FormField";
import { ROLE_LABEL, useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import { authApi } from "@/lib/authApi";
import { PHONE_REGEX } from "@/lib/validation";

interface ProfileForm {
  fullName: string;
  phone: string;
  address: string;
}

type FormErrors = Partial<ProfileForm>;

const trimForm = (form: ProfileForm): ProfileForm => ({
  fullName: form.fullName.trim(),
  phone: form.phone.trim(),
  address: form.address.trim(),
});

function validate(form: ProfileForm): FormErrors {
  const errors: FormErrors = {};
  if (!form.fullName) errors.fullName = "Vui lòng nhập họ tên.";
  else if (form.fullName.length > 100) errors.fullName = "Họ tên tối đa 100 ký tự.";
  if (form.phone && !PHONE_REGEX.test(form.phone)) errors.phone = "Số điện thoại không hợp lệ (ví dụ 0912345678).";
  if (form.address.length > 255) errors.address = "Địa chỉ tối đa 255 ký tự.";
  return errors;
}

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("vi-VN");

export function ProfileInfoPage() {
  const { user, role, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const saved: ProfileForm = {
    fullName: user?.fullName ?? "",
    phone: user?.phone ?? "",
    address: user?.address ?? "",
  };

  const [form, setForm] = useState<ProfileForm>(saved);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    setForm({ fullName: user?.fullName ?? "", phone: user?.phone ?? "", address: user?.address ?? "" });
  }, [user?.fullName, user?.phone, user?.address]);

  if (!user) return null;

  const set = (key: keyof ProfileForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setFeedback(null);
  };

  const clean = trimForm(form);
  const isDirty = (Object.keys(clean) as (keyof ProfileForm)[]).some((key) => clean[key] !== saved[key]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setForm(clean); // show the trimmed values
    const next = validate(clean);
    setErrors(next);
    setFeedback(null);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      const updated = await authApi.updateProfile({
        fullName: clean.fullName,
        phone: clean.phone || null,
        address: clean.address || null,
      });
      updateUser(updated);
      setFeedback({ type: "success", message: "Đã cập nhật thông tin cá nhân." });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof ApiError ? error.message : "Không thể kết nối tới máy chủ.",
      });
    } finally {
      setSaving(false);
    }
  };

  const onReset = () => {
    setForm(saved);
    setErrors({});
    setFeedback(null);
  };

  const onLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="font-serif text-xl font-black tracking-tight text-primary-dark">Thông tin cá nhân</h1>
        <p className="mt-0.5 text-sm text-ink-muted">Quản lý thông tin hồ sơ của bạn trên MoonCake.</p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-6 border-b border-line pb-6">
          <div className="grid size-20 shrink-0 place-items-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
            {user.fullName.trim()[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-semibold text-ink">{user.fullName}</h2>
            <p className="mt-1 inline-block rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary-dark">
              {ROLE_LABEL[role]}
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} noValidate className="space-y-4">
          {feedback && <FormAlert type={feedback.type}>{feedback.message}</FormAlert>}

          <FormField
            label="Họ và tên"
            name="fullName"
            autoComplete="name"
            value={form.fullName}
            onChange={set("fullName")}
            error={errors.fullName}
          />

          <div>
            <label htmlFor="email" className="mb-1 flex items-center gap-2 text-sm font-medium text-ink">
              Email
              {user.isEmailVerified && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-[#6b5416]">
                  <BadgeCheck size={14} /> Đã xác thực
                </span>
              )}
            </label>
            <input
              id="email"
              value={user.email}
              disabled
              className="w-full cursor-not-allowed rounded-lg border border-line bg-cream px-3.5 py-2.5 text-sm text-ink opacity-70"
            />
          </div>

          <FormField
            label="Số điện thoại"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={set("phone")}
            error={errors.phone}
            placeholder="0912345678"
          />

          <FormField
            label="Địa chỉ"
            name="address"
            autoComplete="street-address"
            value={form.address}
            onChange={set("address")}
            error={errors.address}
            placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <ReadOnlyField label="Ngày tham gia" value={formatDate(user.createdAt)} />
            <ReadOnlyField label="Trạng thái tài khoản" value={user.status === "Active" ? "Đang hoạt động" : "Đã khóa"} />
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="w-full sm:w-auto sm:min-w-40">
              <SubmitButton loading={saving} disabled={!isDirty}>
                Lưu thay đổi
              </SubmitButton>
            </div>
            {isDirty && !saving && (
              <button type="button" onClick={onReset} className="text-sm font-semibold text-ink-soft hover:text-primary">
                Hoàn tác
              </button>
            )}
            <button
              type="button"
              onClick={onLogout}
              className="ml-auto inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-ink-soft transition hover:border-primary hover:text-primary"
            >
              <LogOut size={16} /> Đăng xuất
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-sm font-medium text-ink">{label}</p>
      <p className="rounded-lg border border-line bg-cream px-3.5 py-2.5 text-sm text-ink-soft">{value}</p>
    </div>
  );
}
