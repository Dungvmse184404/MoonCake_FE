import { Link } from "react-router-dom";
import { Construction } from "lucide-react";
import { Container } from "./Container";

interface Props {
  title: string;
  description: string;
}

// Trang giữ chỗ cho các màn hình sẽ làm sau.
export function PlaceholderPage({ title, description }: Props) {
  return (
    <Container className="py-20 text-center">
      <Construction className="mx-auto text-primary" size={48} strokeWidth={1.25} />
      <h1 className="mt-4 font-serif text-3xl font-black text-primary-dark">{title}</h1>
      <p className="mx-auto mt-2 max-w-md text-ink-soft">{description}</p>
      <Link
        to="/"
        className="mt-6 inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
      >
        Về trang chủ
      </Link>
    </Container>
  );
}
