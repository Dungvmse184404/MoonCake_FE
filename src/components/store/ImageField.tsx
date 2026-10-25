import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { uploadProductImage, UploadError } from "@/lib/storage";

interface Props {
  value: string;
  onChange: (url: string) => void;
  error?: string;
}

// Upload a file to the products/ folder of the bucket, or paste an existing image link.
export function ImageField({ value, onChange, error }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const onFile = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      onChange(await uploadProductImage(file));
    } catch (e) {
      setUploadError(e instanceof UploadError ? e.message : "Tải ảnh thất bại.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <p className="mb-1 text-sm font-medium text-ink">Ảnh sản phẩm</p>
      <div className="flex flex-wrap items-start gap-4">
        <div className="relative grid size-32 shrink-0 place-items-center overflow-hidden rounded-xl border border-dashed border-line bg-cream">
          {value ? (
            <>
              <img src={value} alt="" className="size-full object-cover" />
              <button
                type="button"
                onClick={() => onChange("")}
                aria-label="Bỏ ảnh"
                className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-white/90 text-ink-soft shadow hover:text-primary"
              >
                <X size={14} />
              </button>
            </>
          ) : (
            <ImagePlus size={28} className="text-ink-muted" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold text-ink-soft transition hover:border-primary hover:text-primary disabled:opacity-60"
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
            {uploading ? "Đang tải lên..." : "Tải ảnh lên"}
          </button>
          <input
            value={value}
            onChange={(e) => onChange(e.target.value.trim())}
            placeholder="Hoặc dán đường dẫn ảnh"
            aria-label="Đường dẫn ảnh"
            className="w-full rounded-lg border border-line bg-white/70 px-3.5 py-2 text-sm outline-none placeholder:text-ink-muted focus:border-primary"
          />
          <p className="text-xs text-ink-muted">JPG, PNG hoặc WebP, tối đa 5MB.</p>
          {(uploadError || error) && <p className="text-xs text-primary">{uploadError || error}</p>}
        </div>
      </div>
    </div>
  );
}
