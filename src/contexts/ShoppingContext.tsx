import { createContext, useContext, useMemo } from "react";
import { useShopping } from "@/hooks/useShopping"; // seu hook atual

type ShoppingStore = ReturnType<typeof useShopping>;

const Ctx = createContext<ShoppingStore | null>(null);

export function ShoppingProvider({ children }: { children: React.ReactNode }) {
  const store = useShopping();
  const value = useMemo(() => store, [store]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useShoppingStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useShoppingStore must be used within <ShoppingProvider>.");
  return ctx;
}
