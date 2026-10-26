import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { cartApi, type Cart } from "@/lib/cartApi";

interface CartContextValue {
  cart: Cart | null;
  count: number;
  loading: boolean;
  refresh: () => Promise<void>;
  addProduct: (productId: string, stallId?: string | null) => Promise<void>;
  addBox: (boxItemId: string, stallId?: string | null) => Promise<void>;
  remove: (itemId: string) => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

// The cart lives on the server, one per account; guests have none.
export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) return setCart(null);
    setLoading(true);
    try {
      setCart(await cartApi.get());
    } catch {
      // A failed refresh keeps whatever the cart showed before
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addProduct = useCallback(async (productId: string, stallId?: string | null) => {
    setCart(await cartApi.addProduct(productId, stallId));
  }, []);

  const addBox = useCallback(async (boxItemId: string, stallId?: string | null) => {
    setCart(await cartApi.addBox(boxItemId, stallId));
  }, []);

  const remove = useCallback(async (itemId: string) => {
    setCart(await cartApi.remove(itemId));
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({ cart, count: cart?.totalItemCount ?? 0, loading, refresh, addProduct, addBox, remove }),
    [cart, loading, refresh, addProduct, addBox, remove],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
