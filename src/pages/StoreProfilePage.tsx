import { useEffect, useState, type FormEvent } from "react";
import { FormAlert, FormField, SubmitButton, TextAreaField } from "@/components/auth/FormField";
import { friendlyError } from "@/lib/errors";
import { organizerApi } from "@/lib/organizerApi";
import { useAsync } from "@/lib/useAsync";
import { EMAIL_REGEX, PHONE_REGEX } from "@/lib/validation";

interface Form {
  brandName: string;
  contactPhone: string;
  contactEmail: string;
  businessInfo: string;
}

const EMPTY: Form = { brandName: "", contactPhone: "", contactEmail: "", businessInfo: "" };

export function StoreProfilePage() {
  const { data: org, loading, error } = useAsync(() => organizerApi.myOrganizer(), []);
  const [saved, setSaved] = useState<Form>(EMPTY);
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Partial<Form>>({});
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!org) return;
    const next: Form = {
      brandName: org.brandName,
      contactPhone: org.contactPhone ?? "",
      contactEmail: org.contactEmail ?? "",
      businessInfo: org.businessInfo ?? "",
    };
    setSaved(next);
    setForm(next);
  }, [org]);

  const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setFeedback(null);
  };

  const clean: Form = {
    brandName: form.brandName.trim(),
    contactPhone: form.contactPhone.trim(),
    contactEmail: form.contactEmail.trim(),
    businessInfo: form.businessInfo.trim(),
  };
  const isDirty = (Object.keys(clean) as (keyof Form)[]).some((k) => clean[k] !== saved[k]);

  const validate = (): Partial<Form> => {
    const next: Partial<Form> = {};
    if (!clean.brandName) next.brandName = "Tên thương hiệu không được để trống.";
    else if (clean.brandName.length > 100) next.brandName = "Tên thương hiệu tối đa 100 ký tự.";
    if (clean.contactPhone && !PHONE_REGEX.test(clean.contactPhone)) next.contactPhone = "Số điện thoại không hợp lệ.";
    if (clean.contactEmail && !EMAIL_REGEX.test(clean.contactEmail)) next.contactEmail = "Email không hợp lệ.";
    if (clean.businessInfo.length > 1000) next.businessInfo = "Thông tin kinh doanh tối đa 1000 ký tự.";
    return next;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setForm(clean);
    const next = validate();
    setErrors(next);
    setFeedback(null);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      const updated = await organizerApi.updateMyOrganizer(clean);
      const nextSaved: Form = {
        brandName: updated.brandName,
        contactPhone: updated.contactPhone ?? "",
        contactEmail: updated.contactEmail ?? "",
        businessInfo: updated.businessInfo ?? "",
      };
      setSaved(nextSaved);
      setForm(nextSaved);
      setFeedback({ type: "success", message: "Đã cập nhật hồ sơ thương hiệu." });
    } catch (err) {
      setFeedback({ type: "error", message: friendlyError(err) });
    } finally {
      setSaving(false);
    }
  };

  if (loading && !org) return <p className="text-sm text-ink-muted">Đang tải...</p>;
  if (error) return <FormAlert type="error">{error}</FormAlert>;

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="font-serif text-xl font-black tracking-tight text-primary-dark">Hồ sơ thương hiệu</h1>
        <p className="mt-0.5 text-sm text-ink-muted">
          Thông tin hiển thị cho khách hàng. Ô để trống sẽ giữ nguyên giá trị hiện tại.
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {feedback && <FormAlert type={feedback.type}>{feedback.message}</FormAlert>}
        <FormField label="Tên thương hiệu" name="brandName" value={form.brandName} onChange={set("brandName")} error={errors.brandName} />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Số điện thoại liên hệ"
            name="contactPhone"
            type="tel"
            value={form.contactPhone}
            onChange={set("contactPhone")}
            error={errors.contactPhone}
            placeholder="0912345678"
          />
          <FormField
            label="Email liên hệ"
            name="contactEmail"
            type="email"
            value={form.contactEmail}
            onChange={set("contactEmail")}
            error={errors.contactEmail}
          />
        </div>
        <TextAreaField
          label="Thông tin kinh doanh"
          name="businessInfo"
          rows={5}
          value={form.businessInfo}
          onChange={set("businessInfo")}
          error={errors.businessInfo}
        />
        <div className="flex items-center gap-3 pt-1">
          <div className="min-w-40">
            <SubmitButton loading={saving} disabled={!isDirty}>
              Lưu thay đổi
            </SubmitButton>
          </div>
          {isDirty && !saving && (
            <button
              type="button"
              onClick={() => {
                setForm(saved);
                setErrors({});
              }}
              className="text-sm font-semibold text-ink-soft hover:text-primary"
            >
              Hoàn tác
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
