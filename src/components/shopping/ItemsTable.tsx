
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import type {
  ShoppingCategory,
  ShoppingItem,
  SortBy,
} from "@/services/shopping/types";
import { useShoppingStore } from "@/contexts/ShoppingContext";
import { getIcon } from "./icons";

type Props = {
  items: ShoppingItem[];
  categories: ShoppingCategory[];
  sortBy: SortBy;
  sortDirection: "asc" | "desc";
  onSortChange: (by: SortBy, dir: "asc" | "desc") => void;
  onEditItem: (item: ShoppingItem) => void;
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const ItemsTable = ({
  items,
  categories,
  sortBy,
  sortDirection,
  onSortChange,
  onEditItem,
}: Props) => {
  const isMobile = useIsMobile();
  const { removeItem } = useShoppingStore();

  const getCategoryTone = () => "text-muted-foreground";

  const categoryMap = useMemo(() => {
    const map = new Map<string, ShoppingCategory>();
    categories.forEach((category) => map.set(category.id, category));
    return map;
  }, [categories]);

  const sortedItems = useMemo(() => {
    const list = [...items];
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
  }, [items, sortBy, sortDirection, categoryMap]);

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
        Nenhum item encontrado. Adicione itens para continuar.
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-3">
        {sortedItems.map((item) => {
          const category = categoryMap.get(item.categoriaId);
          const subtotal = (item.preco || 0) * (item.quantidade || 0);
          return (
            <div
              key={item.id}
              className="rounded-lg border border-border/60 bg-muted/20 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  <span className={`mt-0.5 ${getCategoryTone(category?.id)}`}>
                    {getIcon(category?.icon)}
                  </span>
                  <div>
                    <p className="font-medium leading-tight">{item.nome}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{category?.nome || "Sem categoria"}</span>
                      <span>
                        {item.quantidade} {item.unidade}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-md border border-border/60 bg-background/40 px-2 py-1">
                  <span className="text-xs text-muted-foreground">Valor</span>
                  <div className="font-semibold">
                    {item.preco ? currencyFormatter.format(item.preco) : "-"}
                  </div>
                </div>
                <div className="rounded-md border border-border/60 bg-background/40 px-2 py-1 text-right">
                  <span className="text-xs text-muted-foreground">Subtotal</span>
                  <div className={subtotal > 0 ? "font-semibold" : "font-semibold text-muted-foreground"}>
                    {subtotal > 0 ? currencyFormatter.format(subtotal) : "-"}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1">
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
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table className="min-w-[720px]">
        <TableHeader>
          <TableRow>
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
            <TableHead className="w-[100px] text-right">Acoes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedItems.map((item) => {
            const category = categoryMap.get(item.categoriaId);
            const subtotal = (item.preco || 0) * (item.quantidade || 0);

            return (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className={getCategoryTone(category?.id)}>{getIcon(category?.icon)}</span>
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

