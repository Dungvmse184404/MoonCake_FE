import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Globe, Store } from "lucide-react";
import { FormAlert, FormField, SubmitButton, TextAreaField } from "@/components/auth/FormField";
import { Container } from "@/components/layout/Container";
import { StallPicker } from "@/components/partner/StallPicker";
import { useAuth } from "@/context/AuthContext";
import { friendlyError } from "@/lib/errors";
import { organizerApi, type RegistrationType } from "@/lib/organizerApi";
import { PHONE_REGEX } from "@/lib/validation";

const MAX_STALLS_PER_REQUEST = 10;

const TYPES: Array<{ value: RegistrationType; title: string; desc: string; icon: typeof Store }> = [
  {
    value: "Stall",
    title: "Thuê gian hàng",
    desc: "Chọn gian hàng và thời gian thuê. Gian đang có người thuê vẫn đăng ký được cho kỳ không trùng lịch.",
    icon: Store,
  },
  {
    value: "Online",
    title: "Bán online",
    desc: "Không thuê gian hàng, không giới hạn thời gian. Manager đề xuất mức hoa hồng, bạn xác nhận sau khi được duyệt.",
    icon: Globe,
  },
];

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function TypeSelector({ value, onChange }: { value: RegistrationType; onChange: (type: RegistrationType) => void }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-ink">Hình thức</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {TYPES.map(({ value: option, title, desc, icon: Icon }) => (
          <button
            type="button"
            key={option}
            aria-pressed={value === option}
            onClick={() => onChange(option)}
            className={`rounded-xl border p-4 text-left transition ${
              value === option ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-line hover:border-primary/50"
            }`}
          >
            <span className="flex items-center gap-2 font-semibold text-ink">
              <Icon size={18} className="text-primary" /> {title}
            </span>
            <span className="mt-1 block text-xs text-ink-soft">{desc}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function Shell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <Container className="py-8">
      <div className="mx-auto max-w-3xl rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
        <h1 className="font-serif text-2xl font-black text-primary-dark">{title}</h1>
        <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>
        {children}
      </div>
    </Container>
  );
}

interface RentalDates {
  startDate: string;
  endDate: string;
}

function validateDates({ startDate, endDate }: RentalDates): Partial<RentalDates> {
  const next: Partial<RentalDates> = {};
  if (!startDate) next.startDate = "Vui lòng chọn ngày bắt đầu.";
  else if (startDate < todayIso()) next.startDate = "Ngày bắt đầu không được ở quá khứ.";
  if (!endDate) next.endDate = "Vui lòng chọn ngày kết thúc.";
  else if (startDate && endDate <= startDate) next.endDate = "Ngày kết thúc phải sau ngày bắt đầu.";
  return next;
}

// Flow 2 for a customer: first application, either a stall rental or online selling.
function CustomerForm() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [type, setType] = useState<RegistrationType>(params.get("type")?.toLowerCase() === "online" ? "Online" : "Stall");
  const [brandName, setBrandName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [businessInfo, setBusinessInfo] = useState("");
  const [stallId, setStallId] = useState(params.get("stallId") ?? "");
  const [dates, setDates] = useState<RentalDates>({ startDate: "", endDate: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const clean = { brandName: brandName.trim(), contactPhone: contactPhone.trim(), businessInfo: businessInfo.trim() };
    setBrandName(clean.brandName);
    setContactPhone(clean.contactPhone);
    setBusinessInfo(clean.businessInfo);

    const next: Record<string, string> = {};
    if (!clean.brandName) next.brandName = "Vui lòng nhập tên thương hiệu.";
    else if (clean.brandName.length > 100) next.brandName = "Tên thương hiệu tối đa 100 ký tự.";
    if (clean.contactPhone && !PHONE_REGEX.test(clean.contactPhone)) next.contactPhone = "Số điện thoại không hợp lệ (ví dụ 0912345678).";
    if (clean.businessInfo.length > 1000) next.businessInfo = "Thông tin kinh doanh tối đa 1000 ký tự.";
    if (type === "Stall") {
      if (!stallId) next.stallId = "Vui lòng chọn một gian hàng.";
      Object.assign(next, validateDates(dates));
    }
    setErrors(next);
    setServerError("");
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      await organizerApi.createRegistration({ type, ...clean, stallId, ...dates });
      navigate("/account/registrations", { state: { notice: "Đã gửi đơn đăng ký. Đội ngũ hỗ trợ sẽ phản hồi bạn sớm nhất có thể." } });
    } catch (error) {
      setServerError(friendlyError(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Shell title="Đăng ký làm đối tác bán hàng" subtitle="Gửi đơn để mở gian hàng trên MoonCake. Đơn sẽ được Manager xem xét và phản hồi qua email.">
      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-5">
        {serverError && <FormAlert type="error">{serverError}</FormAlert>}
        <TypeSelector value={type} onChange={(t) => { setType(t); setErrors({}); }} />

        <FormField label="Tên thương hiệu" name="brandName" value={brandName} onChange={(e) => setBrandName(e.target.value)} error={errors.brandName} />
        <FormField
          label="Số điện thoại liên hệ (không bắt buộc)"
          name="contactPhone"
          type="tel"
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
          error={errors.contactPhone}
          placeholder="0912345678"
        />
        <TextAreaField
          label="Thông tin kinh doanh (không bắt buộc)"
          name="businessInfo"
          value={businessInfo}
          onChange={(e) => setBusinessInfo(e.target.value)}
          error={errors.businessInfo}
          placeholder="Giới thiệu ngắn về cơ sở, loại bánh, kinh nghiệm..."
        />

        {type === "Stall" && (
          <>
            <StallPicker selected={stallId ? [stallId] : []} onToggle={setStallId} error={errors.stallId} />
            <DateRange dates={dates} onChange={setDates} errors={errors} />
          </>
        )}

        <div className="sm:max-w-48">
          <SubmitButton loading={submitting}>Gửi đơn đăng ký</SubmitButton>
        </div>
      </form>
    </Shell>
  );
}

function DateRange({ dates, onChange, errors }: { dates: RentalDates; onChange: (d: RentalDates) => void; errors: Record<string, string> }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField
        label="Ngày bắt đầu thuê"
        name="startDate"
        type="date"
        min={todayIso()}
        value={dates.startDate}
        onChange={(e) => onChange({ ...dates, startDate: e.target.value })}
        error={errors.startDate}
      />
      <FormField
        label="Ngày kết thúc thuê"
        name="endDate"
        type="date"
        min={dates.startDate || todayIso()}
        value={dates.endDate}
        onChange={(e) => onChange({ ...dates, endDate: e.target.value })}
        error={errors.endDate}
      />
    </div>
  );
}

// Flow 2 for an existing organizer: rent more stalls (shared period) or ask to sell online as well.
function OrganizerForm() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [type, setType] = useState<RegistrationType>(params.get("type")?.toLowerCase() === "online" ? "Online" : "Stall");
  const [stallIds, setStallIds] = useState<string[]>(params.get("stallId") ? [params.get("stallId")!] : []);
  const [dates, setDates] = useState<RentalDates>({ startDate: "", endDate: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const toggle = (id: string) => setStallIds((ids) => (ids.includes(id) ? ids.filter((s) => s !== id) : [...ids, id]));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (type === "Stall") {
      if (stallIds.length === 0) next.stallId = "Chọn ít nhất một gian hàng.";
      else if (stallIds.length > MAX_STALLS_PER_REQUEST) next.stallId = `Mỗi đơn tối đa ${MAX_STALLS_PER_REQUEST} gian hàng.`;
      Object.assign(next, validateDates(dates));
    }
    setErrors(next);
    setServerError("");
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      if (type === "Stall") await organizerApi.createAdditionalStalls({ stallIds, ...dates });
      else await organizerApi.createAdditionalOnline();
      navigate("/account/registrations", { state: { notice: "Đã gửi đơn đăng ký bổ sung. Manager sẽ xem xét và phản hồi sớm." } });
    } catch (error) {
      setServerError(friendlyError(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Shell title="Đăng ký bổ sung" subtitle="Thuê thêm gian hàng hoặc đăng ký bán online. Thông tin thương hiệu lấy từ hồ sơ Organizer của bạn.">
      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-5">
        {serverError && <FormAlert type="error">{serverError}</FormAlert>}
        <TypeSelector value={type} onChange={(t) => { setType(t); setErrors({}); }} />

        {type === "Stall" ? (
          <>
            <StallPicker
              label={`Chọn gian hàng (tối đa ${MAX_STALLS_PER_REQUEST}, đã chọn ${stallIds.length})`}
              selected={stallIds}
              onToggle={toggle}
              error={errors.stallId}
            />
            <p className="text-xs text-ink-muted">Tất cả gian hàng trong một đơn dùng chung một khoảng thời gian thuê.</p>
            <DateRange dates={dates} onChange={setDates} errors={errors} />
          </>
        ) : (
          <p className="rounded-lg bg-cream px-4 py-3 text-sm text-ink-soft">
            Đơn bán online không cần nhập thêm gì. Manager sẽ đề xuất tỷ lệ hoa hồng và bạn xác nhận trong mục "Đơn đăng ký đối tác".
          </p>
        )}

        <div className="sm:max-w-48">
          <SubmitButton loading={submitting}>Gửi đơn bổ sung</SubmitButton>
        </div>
      </form>
    </Shell>
  );
}

export function PartnerRegisterPage() {
  const { role } = useAuth();
  if (role === "user") return <CustomerForm />;
  if (role === "organizer") return <OrganizerForm />;

  return (
    <Container className="py-16">
      <div className="mx-auto max-w-lg rounded-2xl border border-line bg-white p-8 text-center shadow-sm">
        <h1 className="font-serif text-2xl font-black text-primary-dark">Chức năng dành cho khách và đối tác</h1>
        <p className="mt-2 text-sm text-ink-soft">Tài khoản quản trị không gửi đơn đăng ký. Hãy dùng tài khoản khách hàng hoặc Organizer.</p>
        <Link to="/admin" className="mt-5 inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark">
          Vào trang quản trị
        </Link>
      </div>
    </Container>
  );
}
