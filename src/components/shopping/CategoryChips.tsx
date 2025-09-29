import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ShoppingCategory, FilterStatus } from "@/services/shopping/types";
import { getIcon } from "./icons";

type Props = {
  categories: ShoppingCategory[];
  selectedCategory?: string;
  onCategoryChange: (id?: string) => void;
  statusFilter: FilterStatus;
  onStatusChange: (status: FilterStatus) => void;
  getTotalByCategory: (id: string) => number;
};

const statusOptions: { value: FilterStatus; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "pendente", label: "Pendentes" },
  { value: "carrinho", label: "Carrinho" },
  { value: "comprado", label: "Comprados" },
];

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const CategoryChips = ({
  categories,
  selectedCategory,
  onCategoryChange,
  statusFilter,
  onStatusChange,
  getTotalByCategory,
}: Props) => {
  const sortedCategories = [...categories].sort((a, b) => a.ordem - b.ordem);
  const hasCategories = sortedCategories.length > 0;

  return (
    <div className="space-y-3">
      <div className="-mx-4 overflow-x-auto px-4">
        <div className="flex w-max items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Status:</span>
          {statusOptions.map((option) => (
            <Button
              key={option.value}
              variant={statusFilter === option.value ? "default" : "outline"}
              size="sm"
              className="h-7"
              onClick={() => onStatusChange(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="-mx-4 overflow-x-auto px-4">
        <div className="flex w-max items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Categoria:</span>
          <Button
            variant={!selectedCategory ? "default" : "outline"}
            size="sm"
            className="h-7"
            onClick={() => onCategoryChange(undefined)}
          >
            Todas
          </Button>
          {!hasCategories ? (
            <span className="text-sm text-muted-foreground">
              Nenhuma categoria cadastrada ainda.
            </span>
          ) : (
            sortedCategories.map((category) => {
              const isSelected = selectedCategory === category.id;
              const total = getTotalByCategory(category.id);
              return (
                <Button
                  key={category.id}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  className="h-7"
                  onClick={() => onCategoryChange(category.id)}
                >
                  <div className="flex items-center gap-1">
                    {getIcon(category.icon)}
                    <span>{category.nome}</span>
                    {total > 0 && (
                      <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                        {currencyFormatter.format(total)}
                      </Badge>
                    )}
                  </div>
                </Button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryChips;
