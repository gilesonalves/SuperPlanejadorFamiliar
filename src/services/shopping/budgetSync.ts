type ShoppingBudgetExports = Record<string, number>;

const KEY = "sp_shopping_budget_exports_v1";

export const loadShoppingBudgetExports = (): ShoppingBudgetExports => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ShoppingBudgetExports;
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
    return {};
  } catch (error) {
    console.warn("Erro ao carregar exportacoes da lista de compras:", error);
    return {};
  }
};

export const saveShoppingBudgetExports = (state: ShoppingBudgetExports) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Erro ao salvar exportacoes da lista de compras:", error);
  }
};
