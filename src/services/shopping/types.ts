export type ShoppingItem = {
  id: string;
  nome: string;
  categoriaId: string;
  quantidade: number;
  unidade?: "un" | "kg" | "g" | "ml" | "l" | "pct" | "cx";
  preco?: number;          // unitario
  marca?: string;
  observacao?: string;
  status?: "pendente" | "carrinho" | "comprado";
  icon?: string;           // nome do icone (lucide) ou emoji
  dicaReceita?: string;
  nutricao?: string;
};

export type ShoppingCategory = {
  id: string;
  nome: string;            // "Carnes", "Hortifruti", ...
  icon?: string;           // icone padrao da categoria
  ordem: number;
};

export type ShoppingList = {
  id: string;
  nome: string;
  categorias: ShoppingCategory[];
  itens: ShoppingItem[];
  arquivada?: boolean;
  createdAt: number;
  updatedAt: number;
};

export type ShoppingState = {
  listas: ShoppingList[];
  listaAtivaId?: string;
};

export type ShoppingHistoryEntry = {
  id: string;
  listId: string;
  nome: string;
  itens: ShoppingItem[];
  finalizedAt: number;
};

export type ShoppingPriceEntry = {
  id: string;
  normalizedName: string;
  categoriaId: string;
  preco: number;
  mercado?: string;
  purchasedAt: number;
};

export type ShoppingExpensePayload = {
  source: "shopping-list";
  total: number;
  date: string;
  category: string;
  description: string;
  metadata: {
    listId: string;
    itemCount: number;
  };
};

export type FilterStatus = "todos" | "pendente" | "carrinho" | "comprado";
export type SortBy = "nome" | "categoria" | "preco";
