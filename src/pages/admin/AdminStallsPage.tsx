import { useState, type FormEvent } from "react";
import { SearchInput } from "@/components/ui/SearchInput";
import { AddressField } from "@/components/address/AddressField";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { FormAlert, FormField, SubmitButton, TextAreaField } from "@/components/auth/FormField";
import { Pager } from "@/components/ui/Pager";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { adminApi, type StallPayload } from "@/lib/adminApi";
import { friendlyError } from "@/lib/errors";
import { formatVnd, STALL_STATUS_LABEL } from "@/lib/labels";
import type { Stall, StallStatus } from "@/lib/organizerApi";
import { useAsync } from "@/lib/useAsync";

const PAGE_SIZE = 8;

interface Form {
  code: string;
  name: string;
  location: string;
  rentalPrice: string;
  description: string;
}

const EMPTY: Form = { code: "", name: "", location: "", rentalPrice: "", description: "" };

// Flow 4: the manager maintains the stall catalogue.
export function AdminStallsPage() {
  const [status, setStatus] = useState<StallStatus | "">("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Stall | "new" | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Partial<Form>>({});
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const { data, loading, error, reload } = useAsync(
    () => adminApi.listStalls({ status: status || undefined, search: query, page, pageSize: PAGE_SIZE }),
    [status, query, page],
  );

  const openForm = (stall: Stall | "new") => {
    setEditing(stall);
    setErrors({});
    setNotice(null);
    setForm(
      stall === "new"
        ? EMPTY
        : {
            code: stall.code,
            name: stall.name,
            location: stall.location ?? "",
            rentalPrice: String(stall.rentalPrice),
            description: stall.description ?? "",
          },
    );
  };

  const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const clean: Form = {
      code: form.code.trim(),
      name: form.name.trim(),
      location: form.location.trim(),
      rentalPrice: form.rentalPrice.trim(),
      description: form.description.trim(),
    };
    setForm(clean);

    const next: Partial<Form> = {};
    if (!clean.code) next.code = "Vui lòng nhập mã gian hàng.";
    if (!clean.name) next.name = "Vui lòng nhập tên gian hàng.";
    const price = Number(clean.rentalPrice);
    if (!clean.rentalPrice || Number.isNaN(price) || price < 0) next.rentalPrice = "Giá thuê phải là số không âm.";
    setErrors(next);
    if (Object.keys(next).length) return;

    const payload: StallPayload = { ...clean, rentalPrice: price };
    setSaving(true);
    try {
      if (editing === "new") await adminApi.createStall(payload);
      else if (editing) await adminApi.updateStall(editing.id, payload);
      setNotice({ type: "success", message: editing === "new" ? "Đã tạo gian hàng." : "Đã cập nhật gian hàng." });
      setEditing(null);
      reload();
    } catch (err) {
      setNotice({ type: "error", message: friendlyError(err) });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (stall: Stall) => {
    try {
      await adminApi.deleteStall(stall.id);
      setNotice({ type: "success", message: "Đã xóa gian hàng." });
      reload();
    } catch (err) {
      setNotice({ type: "error", message: friendlyError(err) });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-xl font-black tracking-tight text-primary-dark">Gian hàng</h1>
          <p className="mt-0.5 text-sm text-ink-muted">Tạo, sửa và xóa gian hàng. Gian đang được thuê không xóa được.</p>
        </div>
        <button
          onClick={() => openForm("new")}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          <Plus size={16} /> Thêm gian hàng
        </button>
      </div>

      {editing && (
        <form onSubmit={onSubmit} noValidate className="mt-5 space-y-4 rounded-xl border border-line bg-cream p-5">
          <h2 className="font-semibold text-ink">{editing === "new" ? "Gian hàng mới" : `Sửa gian hàng ${editing.code}`}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Mã gian hàng" name="code" value={form.code} onChange={set("code")} error={errors.code} placeholder="A-01" />
            <FormField label="Tên gian hàng" name="name" value={form.name} onChange={set("name")} error={errors.name} />
            <FormField
              label="Giá thuê (VND)"
              name="rentalPrice"
              inputMode="decimal"
              value={form.rentalPrice}
              onChange={set("rentalPrice")}
              error={errors.rentalPrice}
            />
          </div>
          <AddressField
            label="Vị trí gian hàng"
            streetLabel="Số nhà, tên đường hoặc khu vực"
            streetPlaceholder="Khu A, tầng 1, 12 Nguyễn Huệ..."
            value={form.location}
            onChange={(location) => setForm((f) => ({ ...f, location }))}
          />
          <TextAreaField label="Mô tả" name="description" rows={3} value={form.description} onChange={set("description")} />
          <div className="flex items-center gap-3">
            <div className="min-w-36">
              <SubmitButton loading={saving}>{editing === "new" ? "Tạo gian hàng" : "Lưu thay đổi"}</SubmitButton>
            </div>
            <button type="button" onClick={() => setEditing(null)} className="text-sm font-semibold text-ink-soft hover:text-primary">
              Hủy
            </button>
          </div>
        </form>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as StallStatus | "");
            setPage(1);
          }}
          aria-label="Lọc theo trạng thái"
          className="rounded-lg border border-line bg-white px-3 py-1.5 outline-none focus:border-primary"
        >
          <option value="">Mọi trạng thái</option>
          {(Object.keys(STALL_STATUS_LABEL) as StallStatus[]).map((s) => (
            <option key={s} value={s}>
              {STALL_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <SearchInput
          value={query}
          onSearch={(q) => {
            setPage(1);
            setQuery(q);
          }}
          placeholder="Tìm mã, tên, vị trí"
          className="w-64"
        />
      </div>

      {notice && <div className="mt-4"><FormAlert type={notice.type}>{notice.message}</FormAlert></div>}
      {error && <div className="mt-4"><FormAlert type="error">{error}</FormAlert></div>}
      {loading && !data && <p className="mt-4 text-sm text-ink-muted">Đang tải...</p>}
      {data && data.items.length === 0 && (
        <p className="mt-4 rounded-xl border border-dashed border-line px-6 py-10 text-center text-sm text-ink-muted">Chưa có gian hàng nào.</p>
      )}

      <ul className="mt-4 space-y-3">
        {data?.items.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-primary">{s.code}</span>
                <StatusBadge tone={s.status === "Available" ? "success" : "info"}>{STALL_STATUS_LABEL[s.status]}</StatusBadge>
              </div>
              <p className="truncate font-semibold text-ink">{s.name}</p>
              <p className="mt-0.5 flex items-center gap-3 text-xs text-ink-muted">
                {s.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} /> {s.location}
                  </span>
                )}
                <span>{formatVnd(s.rentalPrice)}</span>
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <button
                onClick={() => openForm(s)}
                className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 font-semibold text-ink-soft hover:border-primary hover:text-primary"
              >
                <Pencil size={14} /> Sửa
              </button>
              {deletingId === s.id ? (
                <>
                  <button onClick={() => remove(s)} className="rounded-lg bg-primary px-3 py-1.5 font-semibold text-white hover:bg-primary-dark">
                    Xác nhận xóa
                  </button>
                  <button onClick={() => setDeletingId(null)} className="px-2 py-1.5 font-semibold text-ink-soft hover:text-primary">
                    Giữ lại
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setDeletingId(s.id)}
                  aria-label={`Xóa ${s.code}`}
                  className="grid size-8 place-items-center rounded-lg border border-line text-ink-soft hover:border-primary hover:text-primary"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {data && <Pager page={data.currentPage} totalPages={data.totalPages} onChange={setPage} />}
    </div>
  );
}
