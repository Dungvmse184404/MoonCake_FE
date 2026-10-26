import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { FormAlert, FormField, SubmitButton, TextAreaField } from "@/components/auth/FormField";
import { ChipSelect } from "@/components/store/ChipSelect";
import { ImageField } from "@/components/store/ImageField";
import { StallCheckboxes } from "@/components/store/StallCheckboxes";
import { catalogApi } from "@/lib/catalog";
import { friendlyError } from "@/lib/errors";
import { productApi } from "@/lib/productApi";
import { useAsync } from "@/lib/useAsync";

interface Form {
  name: string;
  description: string;
  imageUrl: string;
  price: string;
  stockQuantity: string;
  categoryIds: string[];
  fillingIds: string[];
  stallIds: string[];
  publish: boolean;
}

type Errors = Partial<Record<keyof Form, string>>;

const EMPTY: Form = {
  name: "",
  description: "",
  imageUrl: "",
  price: "",
  stockQuantity: "0",
  categoryIds: [],
  fillingIds: [],
  stallIds: [],
  publish: true,
};

// Create (/store/products/new) and edit (/store/products/:id/edit) share this form.
export function ProductFormPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();

  const { data: categories, reload: reloadCategories } = useAsync(() => productApi.myCategories(), []);
  const { data: fillings, reload: reloadFillings } = useAsync(() => productApi.myFillings(), []);
  const { data: existing, loading, error: loadError } = useAsync(
    () => (id ? catalogApi.getProduct(id) : Promise.resolve(null)),
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
      price: String(existing.price),
      stockQuantity: String(existing.stockQuantity),
      categoryIds: existing.categories.map((c) => c.id),
      fillingIds: existing.fillings.map((f) => f.id),
      stallIds: existing.stallIds ?? [],
      publish: false,
    });
  }, [existing]);

  const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = (clean: Form): Errors => {
    const next: Errors = {};
    if (!clean.name) next.name = "Vui lòng nhập tên sản phẩm.";
    else if (clean.name.length > 200) next.name = "Tên sản phẩm tối đa 200 ký tự.";
    if (clean.description.length > 2000) next.description = "Mô tả tối đa 2000 ký tự.";
    if (clean.imageUrl.length > 500) next.imageUrl = "Đường dẫn ảnh tối đa 500 ký tự.";
    const price = Number(clean.price);
    if (!clean.price || Number.isNaN(price) || price <= 0) next.price = "Giá phải lớn hơn 0.";
    else if (price > 9_999_999_999.99) next.price = "Giá quá lớn.";
    if (!editing) {
      const stock = Number(clean.stockQuantity);
      if (!Number.isInteger(stock) || stock < 0) next.stockQuantity = "Tồn kho phải là số nguyên không âm.";
    }
    if (clean.categoryIds.length === 0) next.categoryIds = "Chọn ít nhất một danh mục.";
    if (clean.fillingIds.length === 0) next.fillingIds = "Chọn ít nhất một loại nhân.";
    return next;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const clean: Form = {
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      imageUrl: form.imageUrl.trim(),
      price: form.price.trim(),
      stockQuantity: form.stockQuantity.trim(),
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
      price: Number(clean.price),
      categoryIds: clean.categoryIds,
      fillingIds: clean.fillingIds,
    };

    setSaving(true);
    try {
      if (editing && id) {
        await productApi.update(id, payload);
        await productApi.assignStalls(id, clean.stallIds);
        navigate("/store/products", { state: { notice: "Đã cập nhật sản phẩm." } });
      } else {
        const created = await productApi.create({ ...payload, stockQuantity: Number(clean.stockQuantity) });
        if (clean.stallIds.length) await productApi.assignStalls(created.id, clean.stallIds);
        if (clean.publish) await productApi.setStatus(created.id, "Active");
        navigate("/store/products", {
          state: { notice: clean.publish ? "Đã tạo và đăng bán sản phẩm." : "Đã tạo sản phẩm ở trạng thái bản nháp." },
        });
      }
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
      <Link to="/store/products" className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-primary">
        <ChevronLeft size={16} /> Sản phẩm
      </Link>
      <h1 className="mt-2 font-serif text-xl font-black tracking-tight text-primary-dark">
        {editing ? "Sửa sản phẩm" : "Thêm sản phẩm"}
      </h1>

      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-5">
        {serverError && <FormAlert type="error">{serverError}</FormAlert>}

        <FormField label="Tên sản phẩm" name="name" value={form.name} onChange={set("name")} error={errors.name} />
        <TextAreaField label="Mô tả" name="description" value={form.description} onChange={set("description")} error={errors.description} />
        <ImageField value={form.imageUrl} onChange={(imageUrl) => setForm((f) => ({ ...f, imageUrl }))} error={errors.imageUrl} />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Giá (VND)"
            name="price"
            inputMode="decimal"
            value={form.price}
            onChange={set("price")}
            error={errors.price}
            placeholder="85000"
          />
          {editing ? (
            <p className="self-end pb-2.5 text-sm text-ink-muted">Tồn kho đổi ở trang danh sách (nhập thêm hoặc giảm bớt).</p>
          ) : (
            <FormField
              label="Tồn kho ban đầu"
              name="stockQuantity"
              inputMode="numeric"
              value={form.stockQuantity}
              onChange={set("stockQuantity")}
              error={errors.stockQuantity}
            />
          )}
        </div>

        <ChipSelect
          label="Danh mục"
          options={categories ?? []}
          selected={form.categoryIds}
          onChange={(categoryIds) => setForm((f) => ({ ...f, categoryIds }))}
          onCreate={async (name) => {
            const created = await productApi.createCategory(name);
            reloadCategories();
            return created;
          }}
          error={errors.categoryIds}
        />
        <ChipSelect
          label="Nhân bánh"
          options={fillings ?? []}
          selected={form.fillingIds}
          onChange={(fillingIds) => setForm((f) => ({ ...f, fillingIds }))}
          onCreate={async (name) => {
            const created = await productApi.createFilling(name);
            reloadFillings();
            return created;
          }}
          error={errors.fillingIds}
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
            <SubmitButton loading={saving}>{editing ? "Lưu thay đổi" : "Tạo sản phẩm"}</SubmitButton>
          </div>
          <Link to="/store/products" className="text-sm font-semibold text-ink-soft hover:text-primary">
            Hủy
          </Link>
        </div>
      </form>
    </div>
  );
}
