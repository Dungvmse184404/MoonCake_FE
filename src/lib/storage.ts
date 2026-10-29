import { USE_MOCK } from "./api";

const SUPABASE_URL =(import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, "");
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const BUCKET = (import.meta.env.VITE_SUPABASE_BUCKET as string | undefined) ?? "images";

export const PRODUCT_IMAGE_FOLDER = "products";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

// Public bucket: reading images only needs the URL, no key
export function storageUrl(path: string): string | undefined {
  if (!SUPABASE_URL) return undefined;
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path.replace(/^\//, "")}`;
}

export class UploadError extends Error {}

// Uploads into products/ with the anon key and returns the public URL to store in Product.ImageUrl.
// The bucket needs an INSERT policy for the anon role on that folder, otherwise Supabase answers 400/403.
export async function uploadProductImage(file: File): Promise<string> {
  // Mock mode keeps the picked file in the browser for the session
  if (USE_MOCK) return URL.createObjectURL(file);
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new UploadError("Chưa cấu hình Supabase (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).");
  const extension = EXTENSIONS[file.type];
  if (!extension) throw new UploadError("Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.");
  if (file.size > MAX_IMAGE_BYTES) throw new UploadError("Ảnh tối đa 5MB.");

  const path = `${PRODUCT_IMAGE_FOLDER}/${crypto.randomUUID()}.${extension}`;
  let response: Response;
  try {
    response = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": file.type,
        "x-upsert": "false",
      },
      body: file,
    });
  } catch {
    throw new UploadError("Không thể kết nối tới kho ảnh.");
  }

  if (!response.ok) {
    throw new UploadError(
      response.status === 400 || response.status === 401 || response.status === 403
        ? "Kho ảnh chưa cho phép tải ảnh lên (thiếu policy INSERT cho thư mục products)."
        : `Tải ảnh thất bại (${response.status}).`,
    );
  }
  return storageUrl(path)!;
}
