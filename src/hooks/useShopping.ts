import { useCallback, useEffect, useMemo, useState } from "react";
import {
  canAddItem,
  canCreateList,
  FREE_LIMITS,
  getTotalItems,
  loadShopping,
  saveShopping,
} from "@/services/shopping/storage";
import {
  defaultCategories,
} from "@/services/shopping/seed";
import type {
  FilterStatus,
  ShoppingItem,
  ShoppingList,
  ShoppingState,
  SortBy,
} from "@/services/shopping/types";

export function useShopping() {
  const [state, setState] = useState<ShoppingState>(() => loadShopping());
  const [showProGate, setShowProGate] = useState(false);

  const [statusFilter, setStatusFilter] = useState<FilterStatus>("todos");
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
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
            status: "pendente",
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

  const toggleItemStatus = useCallback(
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
          itens: lista.itens.map((item) => {
            if (item.id !== itemId) {
              return item;
            }
            let next: ShoppingItem["status"];
            switch (item.status) {
              case "pendente":
                next = "carrinho";
                break;
              case "carrinho":
                next = "comprado";
                break;
              default:
                next = "pendente";
            }
            return { ...item, status: next };
          }),
          updatedAt: Date.now(),
        };
        return { ...prev, listas };
      });
    },
    [mutateState],
  );

  const markAllAs = useCallback(
    (status: ShoppingItem["status"]) => {
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
          itens: lista.itens.map((item) => ({ ...item, status })),
          updatedAt: Date.now(),
        };
        return { ...prev, listas };
      });
    },
    [mutateState],
  );

  const clearCart = useCallback(() => {
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
          item.status === "carrinho" ? { ...item, status: "pendente" } : item,
        ),
        updatedAt: Date.now(),
      };
      return { ...prev, listas };
    });
  }, [mutateState]);

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
      return { total: 0, pendentes: 0, carrinho: 0, comprados: 0 };
    }
    return activeList.itens.reduce(
      (acc, item) => {
        acc.total += 1;
        if (item.status === "pendente") acc.pendentes += 1;
        if (item.status === "carrinho") acc.carrinho += 1;
        if (item.status === "comprado") acc.comprados += 1;
        return acc;
      },
      { total: 0, pendentes: 0, carrinho: 0, comprados: 0 },
    );
  }, [activeList]);

  const handleSortChange = useCallback((nextSort: SortBy, direction: "asc" | "desc") => {
    setSortBy(nextSort);
    setSortDirection(direction);
  }, []);

  const limits = useMemo(() => ({
    canCreateList: true,
    canAddItem: true,
    currentLists: state.listas.filter((lista) => !lista.arquivada).length,
    currentItems: getTotalItems(state),
    maxLists: FREE_LIMITS.maxLists,
    maxItems: FREE_LIMITS.maxItems,
  }), [state]);

  return {
    state,
    activeList,
    showProGate,
    setShowProGate,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
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
    toggleItemStatus,
    markAllAs,
    clearCart,
    getTotalByCategory,
    getTotalGeral,
    getStats,
    limits,
  };
}