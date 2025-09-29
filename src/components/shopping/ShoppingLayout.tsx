
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, RotateCcw } from "lucide-react";
import { useShopping } from "@/hooks/useShopping";
import type { ShoppingItem } from "@/services/shopping/types";
import CategoryChips from "./CategoryChips";
import ItemEditor from "./ItemEditor";
import ItemsTable from "./ItemsTable";
import ListPicker from "./ListPicker";
import TotalsBar from "./TotalsBar";

const ShoppingLayout = () => {
  const {
    activeList,
    markAllAs,
    clearCart,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    sortBy,
    sortDirection,
    handleSortChange,
    getTotalByCategory,
    getTotalGeral,
    getStats,
  } = useShopping();

  const [editingItem, setEditingItem] = useState<ShoppingItem | undefined>();

  if (!activeList) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="rounded-xl border border-dashed p-10 text-center">
          <h1 className="text-2xl font-semibold">Lista de Compras</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Crie sua primeira lista para organizar suas compras.
          </p>
          <div className="mt-6 flex justify-center">
            <ListPicker />
          </div>
        </div>
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className="shopping-root container mx-auto w-full space-y-6 px-4 py-6 pb-32">
      <header className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold sm:text-3xl">Lista de Compras</h1>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAs("carrinho")}
              disabled={activeList.itens.length === 0}
            >
              <CheckCircle className="mr-1 h-4 w-4" /> Marcar tudo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearCart}
              disabled={!activeList.itens.some((item) => item.status === "carrinho")}
            >
              <RotateCcw className="mr-1 h-4 w-4" /> Limpar carrinho
            </Button>
          </div>
        </div>
        <ListPicker />
      </header>

      <Separator />

      <CategoryChips
        categories={activeList.categorias}
        selectedCategory={categoryFilter}
        onCategoryChange={setCategoryFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        getTotalByCategory={getTotalByCategory}
      />

      <Separator />

      <ItemEditor
        categories={activeList.categorias}
        editingItem={editingItem}
        isEditing={!!editingItem}
        onEditComplete={() => setEditingItem(undefined)}
      />

      <Separator />

      <ItemsTable
        items={activeList.itens}
        categories={activeList.categorias}
        statusFilter={statusFilter}
        categoryFilter={categoryFilter}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
        onEditItem={setEditingItem}
      />

      <TotalsBar
        categories={activeList.categorias}
        getTotalByCategory={getTotalByCategory}
        totalGeral={getTotalGeral()}
        stats={stats}
      />

    </div>
  );
};

export default ShoppingLayout;
