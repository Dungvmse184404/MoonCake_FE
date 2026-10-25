import { useState, type FormEvent } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { FormAlert } from "@/components/auth/FormField";
import { friendlyError } from "@/lib/errors";
import { productApi } from "@/lib/productApi";
import { useAsync } from "@/lib/useAsync";

interface Item {
  id: string;
  name: string;
  description?: string | null;
}

interface Props {
  title: string;
  hint: string;
  singular: string;
  withDescription?: boolean;
  load: () => Promise<Item[]>;
  create: (name: string) => Promise<unknown>;
  update: (id: string, name: string, description: string | null) => Promise<unknown>;
  remove: (id: string) => Promise<unknown>;
}

function ItemManager({ title, hint, singular, withDescription, load, create, update, remove }: Props) {
  const { data, loading, error, reload } = useAsync(load, []);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const run = async (action: () => Promise<unknown>, done: string) => {
    setBusy(true);
    setNotice(null);
    try {
      await action();
      setNotice({ type: "success", message: done });
      reload();
      return true;
    } catch (e) {
      setNotice({ type: "error", message: friendlyError(e) });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    setNewName(name);
    if (!name) return setNotice({ type: "error", message: `Vui lòng nhập tên ${singular}.` });
    if (await run(() => create(name), `Đã thêm ${singular}.`)) setNewName("");
  };

  const onSave = async (id: string) => {
    const name = draftName.trim();
    if (!name) return setNotice({ type: "error", message: `Tên ${singular} không được để trống.` });
    const description = draftDescription.trim() || null;
    if (await run(() => update(id, name, description), `Đã cập nhật ${singular}.`)) setEditingId(null);
  };

  const onDelete = async (id: string) => {
    await run(() => remove(id), `Đã xóa ${singular}.`);
    setDeletingId(null);
  };

  return (
    <section className="rounded-xl border border-line p-4 sm:p-5">
      <h2 className="font-semibold text-ink">{title}</h2>
      <p className="mt-0.5 text-xs text-ink-muted">{hint}</p>

      <form onSubmit={onCreate} className="mt-4 flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={`Tên ${singular} mới`}
          className="min-w-0 flex-1 rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
        >
          <Plus size={14} /> Thêm
        </button>
      </form>

      {notice && <div className="mt-3"><FormAlert type={notice.type}>{notice.message}</FormAlert></div>}
      {error && <div className="mt-3"><FormAlert type="error">{error}</FormAlert></div>}
      {loading && !data && <p className="mt-3 text-sm text-ink-muted">Đang tải...</p>}
      {data && data.length === 0 && <p className="mt-3 text-sm text-ink-muted">Chưa có {singular} nào.</p>}

      <ul className="mt-3 divide-y divide-line">
        {data?.map((item) => (
          <li key={item.id} className="py-2.5 text-sm">
            {editingId === item.id ? (
              <div className="space-y-2">
                <input
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  aria-label={`Tên ${singular}`}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSave(item.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className="w-full rounded-lg border border-line bg-white px-3 py-1.5 outline-none focus:border-primary"
                />
                {withDescription && (
                  <input
                    value={draftDescription}
                    onChange={(e) => setDraftDescription(e.target.value)}
                    placeholder="Mô tả (không bắt buộc)"
                    className="w-full rounded-lg border border-line bg-white px-3 py-1.5 outline-none focus:border-primary"
                  />
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => onSave(item.id)}
                    disabled={busy}
                    className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
                  >
                    <Check size={14} /> Lưu
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="inline-flex items-center gap-1 px-2 py-1.5 font-semibold text-ink-soft hover:text-primary"
                  >
                    <X size={14} /> Hủy
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{item.name}</p>
                  {withDescription && item.description && (
                    <p className="truncate text-xs text-ink-muted">{item.description}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {deletingId === item.id ? (
                    <>
                      <button
                        onClick={() => onDelete(item.id)}
                        disabled={busy}
                        className="rounded-lg bg-primary px-3 py-1.5 font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
                      >
                        Xác nhận xóa
                      </button>
                      <button onClick={() => setDeletingId(null)} className="px-2 py-1.5 font-semibold text-ink-soft hover:text-primary">
                        Giữ lại
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setEditingId(item.id);
                          setDraftName(item.name);
                          setDraftDescription(item.description ?? "");
                        }}
                        aria-label={`Sửa ${item.name}`}
                        className="grid size-8 place-items-center rounded-lg border border-line text-ink-soft hover:border-primary hover:text-primary"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeletingId(item.id)}
                        aria-label={`Xóa ${item.name}`}
                        className="grid size-8 place-items-center rounded-lg border border-line text-ink-soft hover:border-primary hover:text-primary"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

// Organizer-owned categories and fillings, used when creating products.
export function StoreCatalogPage() {
  return (
    <div className="w-full">
      <h1 className="font-serif text-xl font-black tracking-tight text-primary-dark">Danh mục và nhân bánh</h1>
      <p className="mt-0.5 text-sm text-ink-muted">Mỗi sản phẩm cần ít nhất một danh mục và một nhân bánh của bạn.</p>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <ItemManager
          title="Danh mục bánh"
          hint="Ví dụ: Bánh nướng, Bánh dẻo."
          singular="danh mục"
          withDescription
          load={productApi.myCategories}
          create={productApi.createCategory}
          update={(id, name, description) => productApi.updateCategory(id, { name, description })}
          remove={productApi.deleteCategory}
        />
        <ItemManager
          title="Nhân bánh"
          hint="Ví dụ: Đậu xanh, Thập cẩm."
          singular="nhân bánh"
          load={productApi.myFillings}
          create={productApi.createFilling}
          update={(id, name) => productApi.updateFilling(id, name)}
          remove={productApi.deleteFilling}
        />
      </div>
    </div>
  );
}
