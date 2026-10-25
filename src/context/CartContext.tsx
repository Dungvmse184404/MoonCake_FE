import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product } from "@/lib/catalog";

// The backend has no cart API yet, so the cart lives in this browser only.
const STORAGE_KEY = "mooncake.cart";
export const MAX_LINE_QUANTITY = 99;

export interface CartItem {
  productId: string;
  name: string;
  imageUrl?: string | null;
  price: number;
  brandName: string;
  organizerId: string;
  stockQuantity: number;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  total: number;
  add: (product: Product, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  // Replaces the stored price and stock with fresh values, dropping products that are gone.
  sync: (fresh: Array<Product | null>, ids: string[]) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const limitOf = (item: Pick<CartItem, "stockQuantity">) => Math.max(1, Math.min(item.stockQuantity, MAX_LINE_QUANTITY));

function load(): CartItem[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((i) => i?.productId && i.quantity > 0) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage blocked: the cart still works for this session.
    }
  }, [items]);

  // Keep several tabs in step
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setItems(load());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const add = useCallback((product: Product, quantity = 1) => {
    setItems((current) => {
      const existing = current.find((i) => i.productId === product.id);
      const snapshot = {
        name: product.name,
        imageUrl: product.imageUrl,
        price: product.price,
        brandName: product.organizerBrandName,
        organizerId: product.organizerId,
        stockQuantity: product.stockQuantity,
      };
      if (existing) {
        const next = { ...existing, ...snapshot };
        next.quantity = Math.min(existing.quantity + quantity, limitOf(next));
        return current.map((i) => (i.productId === product.id ? next : i));
      }
      return [...current, { productId: product.id, ...snapshot, quantity: Math.min(quantity, limitOf(snapshot)) }];
    });
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setItems((current) =>
      current.map((i) => (i.productId === productId ? { ...i, quantity: Math.max(1, Math.min(quantity, limitOf(i))) } : i)),
    );
  }, []);

  const remove = useCallback((productId: string) => setItems((c) => c.filter((i) => i.productId !== productId)), []);
  const clear = useCallback(() => setItems([]), []);

  const sync = useCallback((fresh: Array<Product | null>, ids: string[]) => {
    setItems((current) =>
      current.flatMap((item) => {
        const index = ids.indexOf(item.productId);
        if (index === -1) return [item];
        const product = fresh[index];
        if (!product || product.status === "Draft" || product.status === "Inactive") return [];
        const next = {
          ...item,
          name: product.name,
          imageUrl: product.imageUrl,
          price: product.price,
          brandName: product.organizerBrandName,
          stockQuantity: product.status === "OutOfStock" ? 0 : product.stockQuantity,
        };
        return [{ ...next, quantity: Math.min(next.quantity, limitOf(next)) }];
      }),
    );
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: items.reduce((n, i) => n + i.quantity, 0),
      total: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      add,
      setQuantity,
      remove,
      clear,
      sync,
    }),
    [items, add, setQuantity, remove, clear, sync],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
