import { useState, type ImgHTMLAttributes } from "react";
import { storageUrl } from "@/lib/storage";

interface Props extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  path: string;
  fallback: string;
}

// Prefers the Supabase image and falls back to the bundled copy
export function StorageImage({ path, fallback, alt = "", ...rest }: Props) {
  const remote = storageUrl(path);
  const [failed, setFailed] = useState(false);
  const src = remote && !failed ? remote : fallback;

  return <img src={src} alt={alt} onError={() => src !== fallback && setFailed(true)} {...rest} />;
}
