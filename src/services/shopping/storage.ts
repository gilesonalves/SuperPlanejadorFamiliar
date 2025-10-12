import type { ShoppingState, ShoppingList, ShoppingItem } from "./types";
import { defaultCategories, sampleItems } from "./seed";

const KEY = "sp_shopping_v1";
const fallbackCategoryId = defaultCategories[0]?.id ?? "geral";

const ensureSampleItem = (item: Partial<ShoppingItem>): ShoppingItem => ({
  id: crypto.randomUUID(),
  nome: item.nome ?? "Item",
  categoriaId: item.categoriaId ?? fallbackCategoryId,
  quantidade: item.quantidade ?? 1,
  unidade: item.unidade,
  preco: item.preco,
  marca: item.marca,
  observacao: item.observacao,
  status: "pendente",
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
    plan: "free",
  };
}

export function saveShopping(state: ShoppingState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Erro ao salvar lista de compras:", error);
  }
}

export const FREE_LIMITS = {
  maxLists: 1,
  maxItems: 100,
};

export function canCreateList(state: ShoppingState): boolean {
  void state;
  return true;
}

export function canAddItem(state: ShoppingState): boolean {
  void state;
  return true;
}

export function getTotalItems(state: ShoppingState): number {
  return state.listas.reduce(
    (acc, lista) => acc + (lista.arquivada ? 0 : lista.itens.length),
    0,
  );
}
