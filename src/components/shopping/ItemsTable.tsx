
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit2, Trash2 } from "lucide-react";
import type {
  FilterStatus,
  ShoppingCategory,
  ShoppingItem,
  SortBy,
} from "@/services/shopping/types";
import { useShopping } from "@/hooks/useShopping";
import { getIcon } from "./icons";

type Props = {
  items: ShoppingItem[];
  categories: ShoppingCategory[];
  statusFilter: FilterStatus;
  categoryFilter?: string;
  sortBy: SortBy;
  sortDirection: "asc" | "desc";
  onSortChange: (by: SortBy, dir: "asc" | "desc") => void;
  onEditItem: (item: ShoppingItem) => void;
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const statusMeta = {
  pendente: { label: "Pendente", variant: "outline" as const },
  carrinho: { label: "Carrinho", variant: "secondary" as const },
  comprado: { label: "Comprado", variant: "default" as const },
};

const ItemsTable = ({
  items,
  categories,
  statusFilter,
  categoryFilter,
  sortBy,
  sortDirection,
  onSortChange,
  onEditItem,
}: Props) => {
  const { toggleItemStatus, removeItem } = useShopping();

  const categoryMap = useMemo(() => {
    const map = new Map<string, ShoppingCategory>();
    categories.forEach((category) => map.set(category.id, category));
    return map;
  }, [categories]);

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        if (statusFilter !== "todos" && item.status !== statusFilter) {
          return false;
        }
        if (categoryFilter && item.categoriaId !== categoryFilter) {
          return false;
        }
        return true;
      }),
    [items, statusFilter, categoryFilter],
  );

  const sortedItems = useMemo(() => {
    const list = [...filteredItems];
    list.sort((a, b) => {
      const direction = sortDirection === "asc" ? 1 : -1;
      switch (sortBy) {
        case "nome":
          return a.nome.localeCompare(b.nome) * direction;
        case "categoria": {
          const aCat = categoryMap.get(a.categoriaId)?.nome || "";
          const bCat = categoryMap.get(b.categoriaId)?.nome || "";
          return aCat.localeCompare(bCat) * direction;
        }
        case "status": {
          const order = { pendente: 0, carrinho: 1, comprado: 2 } as const;
          return (order[a.status] - order[b.status]) * direction;
        }
        case "preco": {
          const aTotal = (a.preco || 0) * (a.quantidade || 0);
          const bTotal = (b.preco || 0) * (b.quantidade || 0);
          if (aTotal === bTotal) return 0;
          return aTotal > bTotal ? direction : -direction;
        }
        default:
          return 0;
      }
    });
    return list;
  }, [filteredItems, sortBy, sortDirection, categoryMap]);

  const handleSort = (column: SortBy) => {
    if (sortBy === column) {
      onSortChange(column, sortDirection === "asc" ? "desc" : "asc");
    } else {
      onSortChange(column, "asc");
    }
  };

  if (!sortedItems.length) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        Nenhum item encontrado. Adicione itens ou ajuste os filtros.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table className="min-w-[720px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]" />
            <TableHead>Item</TableHead>
            <TableHead className="hidden min-w-[160px] xl:table-cell">Categoria</TableHead>
            <TableHead>Qtd</TableHead>
            <TableHead className="text-right">Preco Unit.</TableHead>
            <TableHead
              role="button"
              tabIndex={0}
              onClick={() => handleSort("preco")}
              className="text-right"
            >
              Subtotal {sortBy === "preco" ? (sortDirection === "asc" ? "\u25B2" : "\u25BC") : ""}
            </TableHead>
            <TableHead className="text-right">Status</TableHead>
            <TableHead className="w-[100px] text-right">Acoes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedItems.map((item) => {
            const category = categoryMap.get(item.categoriaId);
            const subtotal = (item.preco || 0) * (item.quantidade || 0);
            const status = statusMeta[item.status];

            return (
              <TableRow key={item.id} className={item.status === "comprado" ? "opacity-60" : ""}>
                <TableCell>
                  <Checkbox
                    checked={item.status !== "pendente"}
                    onCheckedChange={() => toggleItemStatus(item.id)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{getIcon(category?.icon)}</span>
                    <div>
                      <p className="font-medium leading-tight">{item.nome}</p>
                      {category?.nome && (
                        <p className="text-xs text-muted-foreground xl:hidden">{category.nome}</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  <Badge variant="outline">{category?.nome || "Sem categoria"}</Badge>
                </TableCell>
                <TableCell>
                  {item.quantidade} {item.unidade}
                </TableCell>
                <TableCell className="text-right">
                  {item.preco ? currencyFormatter.format(item.preco) : <span className="text-muted-foreground">-</span>}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {subtotal > 0 ? currencyFormatter.format(subtotal) : <span className="text-muted-foreground">-</span>}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant={status.variant}>{status.label}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => onEditItem(item)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default ItemsTable;

