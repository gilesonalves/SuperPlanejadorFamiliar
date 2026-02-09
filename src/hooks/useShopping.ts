import { useCallback, useEffect, useMemo, useState } from "react";
import {
  loadShopping,
  saveShopping,
  loadShoppingHistory,
  saveShoppingHistory,
  appendShoppingPriceHistory,
  normalizeShoppingItemName,
} from "@/services/shopping/storage";
import { defaultCategories } from "@/services/shopping/seed";
import type {
  ShoppingItem,
  ShoppingList,
  ShoppingState,
  SortBy,
  ShoppingHistoryEntry,
} from "@/services/shopping/types";

export function useShopping() {
  const [state, setState] = useState<ShoppingState>(() => loadShopping());

  const [sortBy, setSortBy] = useState<SortBy>("nome");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    saveShopping(state);
  }, [state]);

  const activeList = useMemo(
    () => state.listas.find((lista) => lista.id === state.listaAtivaId),
    [state.listas, state.listaAtivaId],
  );

  const mutateState = useCallback((updater: (prev: ShoppingState) => ShoppingState) => {
    setState((prev) => updater(prev));
  }, []);

  const updateListById = useCallback(
    (listId: string, transform: (list: ShoppingList) => ShoppingList) => {
      mutateState((prev) => {
        const index = prev.listas.findIndex((lista) => lista.id === listId);
        if (index === -1) {
          return prev;
        }
        const listas = [...prev.listas];
        listas[index] = transform(listas[index]);
        return { ...prev, listas };
      });
    },
    [mutateState],
  );

  const createList = useCallback(
    (nome: string) => {
      mutateState((prev) => {
        const newList: ShoppingList = {
          id: crypto.randomUUID(),
          nome,
          categorias: defaultCategories,
          itens: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        return {
          ...prev,
          listas: [...prev.listas, newList],
          listaAtivaId: newList.id,
        };
      });
    },
    [mutateState],
  );

  const updateList = useCallback(
    (listId: string, updates: Partial<ShoppingList>) => {
      updateListById(listId, (lista) => ({
        ...lista,
        ...updates,
        updatedAt: Date.now(),
      }));
    },
    [updateListById],
  );

  const duplicateList = useCallback(
    (listId: string) => {
      mutateState((prev) => {
        const source = prev.listas.find((lista) => lista.id === listId);
        if (!source) {
          return prev;
        }
        const newList: ShoppingList = {
          ...source,
          id: crypto.randomUUID(),
          nome: `${source.nome} (Copia)` ,
          itens: source.itens.map((item) => ({
            ...item,
            id: crypto.randomUUID(),
          })),
          arquivada: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        return {
          ...prev,
          listas: [...prev.listas, newList],
          listaAtivaId: newList.id,
        };
      });
    },
    [mutateState],
  );

  const setActiveList = useCallback(
    (listId: string) => {
      mutateState((prev) => ({
        ...prev,
        listaAtivaId: listId,
      }));
    },
    [mutateState],
  );

  const archiveList = useCallback(
    (listId: string) => {
      updateList(listId, { arquivada: true });
    },
    [updateList],
  );

  const addItem = useCallback(
    (item: Omit<ShoppingItem, "id">) => {
      mutateState((prev) => {
        const listId = prev.listaAtivaId;
        if (!listId) {
          return prev;
        }
        const index = prev.listas.findIndex((lista) => lista.id === listId);
        if (index === -1) {
          return prev;
        }
        const listas = [...prev.listas];
        const lista = listas[index];
        const newItem: ShoppingItem = { ...item, id: crypto.randomUUID() };
        listas[index] = {
          ...lista,
          itens: [...lista.itens, newItem],
          updatedAt: Date.now(),
        };
        return { ...prev, listas };
      });
    },
    [mutateState],
  );

  const updateItem = useCallback(
    (itemId: string, updates: Partial<ShoppingItem>) => {
      mutateState((prev) => {
        const listId = prev.listaAtivaId;
        if (!listId) {
          return prev;
        }
        const index = prev.listas.findIndex((lista) => lista.id === listId);
        if (index === -1) {
          return prev;
        }
        const listas = [...prev.listas];
        const lista = listas[index];
        listas[index] = {
          ...lista,
          itens: lista.itens.map((item) =>
            item.id === itemId ? { ...item, ...updates } : item,
          ),
          updatedAt: Date.now(),
        };
        return { ...prev, listas };
      });
    },
    [mutateState],
  );

  const removeItem = useCallback(
    (itemId: string) => {
      mutateState((prev) => {
        const listId = prev.listaAtivaId;
        if (!listId) {
          return prev;
        }
        const index = prev.listas.findIndex((lista) => lista.id === listId);
        if (index === -1) {
          return prev;
        }
        const listas = [...prev.listas];
        const lista = listas[index];
        listas[index] = {
          ...lista,
          itens: lista.itens.filter((item) => item.id !== itemId),
          updatedAt: Date.now(),
        };
        return { ...prev, listas };
      });
    },
    [mutateState],
  );

  const getTotalByCategory = useCallback(
    (categoriaId: string) => {
      if (!activeList) {
        return 0;
      }
      return activeList.itens
        .filter((item) => item.categoriaId === categoriaId)
        .reduce((total, item) => total + (item.preco || 0) * (item.quantidade || 0), 0);
    },
    [activeList],
  );

  const getTotalGeral = useCallback(() => {
    if (!activeList) {
      return 0;
    }
    return activeList.itens.reduce(
      (total, item) => total + (item.preco || 0) * (item.quantidade || 0),
      0,
    );
  }, [activeList]);

  const getStats = useCallback(() => {
    if (!activeList) {
      return { total: 0 };
    }
    return { total: activeList.itens.length };
  }, [activeList]);

  const finalizeList = useCallback((mercado?: string) => {
    const list = activeList;
    if (!list) return;

    const normalizedMarket = mercado?.trim() || undefined;
    const priceEntries = list.itens
      .filter((item) => typeof item.preco === "number" && item.preco > 0)
      .map((item) => {
        const normalizedName = normalizeShoppingItemName(item.nome, item.marca);
        if (!normalizedName) return null;
        return {
          id: crypto.randomUUID(),
          normalizedName,
          categoriaId: item.categoriaId,
          preco: item.preco as number,
          mercado: normalizedMarket,
          purchasedAt: Date.now(),
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
    appendShoppingPriceHistory(priceEntries);

    const history = loadShoppingHistory();
    const entry: ShoppingHistoryEntry = {
      id: crypto.randomUUID(),
      listId: list.id,
      nome: list.nome,
      itens: list.itens.map((item) => ({ ...item })),
      finalizedAt: Date.now(),
    };
    saveShoppingHistory([entry, ...history]);

    updateList(list.id, { arquivada: true });
    const remaining = state.listas.filter((lista) => !lista.arquivada && lista.id !== list.id);
    if (remaining.length > 0) {
      setActiveList(remaining[0].id);
      return;
    }

    mutateState((prev) => {
      const newList: ShoppingList = {
        id: crypto.randomUUID(),
        nome: list.nome,
        categorias: list.categorias,
        itens: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      return {
        ...prev,
        listas: [...prev.listas, newList],
        listaAtivaId: newList.id,
      };
    });
  }, [activeList, state.listas, updateList, setActiveList, mutateState]);

  const handleSortChange = useCallback((nextSort: SortBy, direction: "asc" | "desc") => {
    setSortBy(nextSort);
    setSortDirection(direction);
  }, []);

  return {
    state,
    activeList,
    sortBy,
    sortDirection,
    handleSortChange,
    createList,
    updateList,
    duplicateList,
    setActiveList,
    archiveList,
    addItem,
    updateItem,
    removeItem,
    getTotalByCategory,
    getTotalGeral,
    getStats,
    finalizeList,
  };
}
