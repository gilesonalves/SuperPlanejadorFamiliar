import type {
  ShoppingState,
  ShoppingList,
  ShoppingItem,
  ShoppingHistoryEntry,
  ShoppingPriceEntry,
} from "./types";
import { defaultCategories, sampleItems } from "./seed";

const KEY = "sp_shopping_v1";
const HISTORY_KEY = "sp_shopping_history_v1";
const PRICE_HISTORY_KEY = "sp_shopping_price_history_v1";
const fallbackCategoryId = defaultCategories[0]?.id ?? "geral";

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeBase = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const normalizeShoppingItemName = (name: string, brand?: string) => {
  const base = normalizeBase(name);
  if (!brand) return base;
  const brandBase = normalizeBase(brand);
  if (!brandBase) return base;
  const brandRegex = new RegExp(`\\b${escapeRegex(brandBase)}\\b`, "g");
  return base.replace(brandRegex, " ").replace(/\s+/g, " ").trim();
};

const ensureSampleItem = (item: Partial<ShoppingItem>): ShoppingItem => ({
  id: crypto.randomUUID(),
  nome: item.nome ?? "Item",
  categoriaId: item.categoriaId ?? fallbackCategoryId,
  quantidade: item.quantidade ?? 1,
  unidade: item.unidade,
  preco: item.preco,
  marca: item.marca,
  observacao: item.observacao,
  icon: item.icon,
  dicaReceita: item.dicaReceita,
  nutricao: item.nutricao,
});

export function loadShopping(): ShoppingState {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored) {
      return JSON.parse(stored) as ShoppingState;
    }
  } catch (error) {
    console.warn("Erro ao carregar lista de compras:", error);
  }

  const firstList: ShoppingList = {
    id: crypto.randomUUID(),
    nome: "Minha Lista",
    categorias: defaultCategories,
    itens: sampleItems.map(ensureSampleItem),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  return {
    listas: [firstList],
    listaAtivaId: firstList.id,
  };
}

export function saveShopping(state: ShoppingState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Erro ao salvar lista de compras:", error);
  }
}

export function loadShoppingHistory(): ShoppingHistoryEntry[] {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (stored) {
      return JSON.parse(stored) as ShoppingHistoryEntry[];
    }
  } catch (error) {
    console.warn("Erro ao carregar historico de compras:", error);
  }
  return [];
}

export function saveShoppingHistory(entries: ShoppingHistoryEntry[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
  } catch (error) {
    console.error("Erro ao salvar historico de compras:", error);
  }
}

export function loadShoppingPriceHistory(): ShoppingPriceEntry[] {
  try {
    const stored = localStorage.getItem(PRICE_HISTORY_KEY);
    if (stored) {
      return JSON.parse(stored) as ShoppingPriceEntry[];
    }
  } catch (error) {
    console.warn("Erro ao carregar historico de precos:", error);
  }
  return [];
}

export function saveShoppingPriceHistory(entries: ShoppingPriceEntry[]) {
  try {
    localStorage.setItem(PRICE_HISTORY_KEY, JSON.stringify(entries));
  } catch (error) {
    console.error("Erro ao salvar historico de precos:", error);
  }
}

export function appendShoppingPriceHistory(entries: ShoppingPriceEntry[]) {
  if (!entries.length) return;
  const history = loadShoppingPriceHistory();
  saveShoppingPriceHistory([...entries, ...history]);
}

