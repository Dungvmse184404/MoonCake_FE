import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { FormAlert, FormField, SubmitButton, TextAreaField } from "@/components/auth/FormField";
import { ChipSelect } from "@/components/store/ChipSelect";
import { ImageField } from "@/components/store/ImageField";
import { StallCheckboxes } from "@/components/store/StallCheckboxes";
import { boxApi } from "@/lib/boxApi";
import { friendlyError } from "@/lib/errors";
import { productApi } from "@/lib/productApi";
import { useAsync } from "@/lib/useAsync";

interface Form {
  name: string;
  description: string;
  imageUrl: string;
  capacity: string;
  price: string;
  productIds: string[];
  stallIds: string[];
  publish: boolean;
}

type Errors = Partial<Record<keyof Form, string>>;

const EMPTY: Form = {
  name: "",
  description: "",
  imageUrl: "",
  capacity: "4",
  price: "",
  productIds: [],
  stallIds: [],
  publish: true,
};

// Create (/store/boxes/new) and edit (/store/boxes/:id/edit) share this form.
export function BoxFormPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();

  const { data: products } = useAsync(() => productApi.myProducts({ pageSize: 100 }), []);
  const { data: existing, loading, error: loadError } = useAsync(
    () => (id ? boxApi.get(id) : Promise.resolve(null)),
    [id],
  );

  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!existing) return;
    setForm({
      name: existing.name,
      description: existing.description ?? "",
      imageUrl: existing.imageUrl ?? "",
      capacity: String(existing.capacity),
      price: String(existing.price),
      productIds: existing.products.map((p) => p.id),
      stallIds: existing.stallIds,
      publish: false,
    });
  }, [existing]);

  const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = (clean: Form): Errors => {
    const next: Errors = {};
    if (!clean.name) next.name = "Vui lòng nhập tên hộp.";
    else if (clean.name.length > 200) next.name = "Tên hộp tối đa 200 ký tự.";
    const capacity = Number(clean.capacity);
    if (!Number.isInteger(capacity) || capacity < 1) next.capacity = "Sức chứa phải là số nguyên từ 1 trở lên.";
    const price = Number(clean.price);
    if (!clean.price || Number.isNaN(price) || price <= 0) next.price = "Giá phải lớn hơn 0.";
    if (clean.productIds.length === 0) next.productIds = "Chọn ít nhất một loại bánh cho hộp.";
    return next;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const clean: Form = {
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      imageUrl: form.imageUrl.trim(),
      capacity: form.capacity.trim(),
      price: form.price.trim(),
    };
    setForm(clean);
    const next = validate(clean);
    setErrors(next);
    setServerError("");
    if (Object.keys(next).length) return;

    const payload = {
      name: clean.name,
      description: clean.description,
      imageUrl: clean.imageUrl,
      capacity: Number(clean.capacity),
      price: Number(clean.price),
      productIds: clean.productIds,
    };

    setSaving(true);
    try {
      const saved = editing && id ? await boxApi.update(id, payload) : await boxApi.create(payload);
      await boxApi.assignStalls(saved.id, clean.stallIds);
      if (!editing && clean.publish) await boxApi.setStatus(saved.id, "Active");
      navigate("/store/boxes", {
        state: { notice: editing ? "Đã cập nhật hộp combo." : clean.publish ? "Đã tạo và đăng bán hộp combo." : "Đã tạo hộp combo ở trạng thái bản nháp." },
      });
    } catch (error) {
      setServerError(friendlyError(error));
    } finally {
      setSaving(false);
    }
  };

  if (editing && loading && !existing) return <p className="text-sm text-ink-muted">Đang tải...</p>;
  if (editing && loadError) return <FormAlert type="error">{loadError}</FormAlert>;

  return (
    <div className="w-full">
      <Link to="/store/boxes" className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-primary">
        <ChevronLeft size={16} /> Hộp combo
      </Link>
      <h1 className="mt-2 font-serif text-xl font-black tracking-tight text-primary-dark">
        {editing ? "Sửa hộp combo" : "Thêm hộp combo"}
      </h1>

      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-5">
        {serverError && <FormAlert type="error">{serverError}</FormAlert>}

        <FormField label="Tên hộp" name="name" value={form.name} onChange={set("name")} error={errors.name} />
        <TextAreaField label="Mô tả" name="description" value={form.description} onChange={set("description")} error={errors.description} />
        <ImageField value={form.imageUrl} onChange={(imageUrl) => setForm((f) => ({ ...f, imageUrl }))} error={errors.imageUrl} />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Sức chứa (số bánh mỗi hộp)"
            name="capacity"
            inputMode="numeric"
            value={form.capacity}
            onChange={set("capacity")}
            error={errors.capacity}
          />
          <FormField
            label="Giá hộp (VND)"
            name="price"
            inputMode="decimal"
            value={form.price}
            onChange={set("price")}
            error={errors.price}
            placeholder="250000"
          />
        </div>

        <ChipSelect
          label="Bánh khách được chọn trong hộp"
          options={(products?.items ?? []).map((p) => ({ id: p.id, name: p.name }))}
          selected={form.productIds}
          onChange={(productIds) => setForm((f) => ({ ...f, productIds }))}
          error={errors.productIds}
        />

        <StallCheckboxes selected={form.stallIds} onChange={(stallIds) => setForm((f) => ({ ...f, stallIds }))} />

        {!editing && (
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={form.publish}
              onChange={(e) => setForm((f) => ({ ...f, publish: e.target.checked }))}
              className="size-4 accent-[var(--color-primary)]"
            />
            Đăng bán ngay (bỏ chọn để lưu bản nháp)
          </label>
        )}

        <div className="flex items-center gap-3 pt-1">
          <div className="min-w-40">
            <SubmitButton loading={saving}>{editing ? "Lưu thay đổi" : "Tạo hộp combo"}</SubmitButton>
          </div>
          <Link to="/store/boxes" className="text-sm font-semibold text-ink-soft hover:text-primary">
            Hủy
          </Link>
        </div>
      </form>
    </div>
  );
}
