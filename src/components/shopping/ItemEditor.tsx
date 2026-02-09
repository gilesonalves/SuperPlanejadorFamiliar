import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import type { ShoppingCategory, ShoppingItem } from "@/services/shopping/types";
import { useShoppingStore } from "@/contexts/ShoppingContext";
import {
  loadShoppingPriceHistory,
  normalizeShoppingItemName,
} from "@/services/shopping/storage";

type Props = {
  categories: ShoppingCategory[];
  editingItem?: ShoppingItem;
  isEditing?: boolean;
  onEditComplete?: () => void;
  onAddComplete?: () => void;
};

const unidades = ["un", "kg", "g", "ml", "l", "pct", "cx"] as const;

type FormState = {
  nome: string;
  categoriaId: string;
  quantidade: number | "";
  unidade: ShoppingItem["unidade"];
  preco?: number;
  marca?: string;
};

const buildFormState = (item?: ShoppingItem): FormState => ({
  nome: item?.nome ?? "",
  categoriaId: item?.categoriaId ?? "",
  quantidade: item?.quantidade ?? 1,
  unidade: item?.unidade ?? "un",
  preco: item?.preco,
  marca: item?.marca,
});

const normalizeQuantidade = (value: FormState["quantidade"]) => {
  if (value === "") return 1;
  const parsed = Number(value);
  return parsed ? parsed : 1;
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const ItemEditor = ({ categories, editingItem, isEditing, onEditComplete, onAddComplete }: Props) => {
  const { addItem, updateItem } = useShoppingStore();
  const [formData, setFormData] = useState<FormState>(() => buildFormState());

  useEffect(() => {
    if (editingItem) {
      setFormData(buildFormState(editingItem));
    }
  }, [editingItem]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.nome?.trim() || !formData.categoriaId) {
      return;
    }

    const payload = {
      nome: formData.nome.trim(),
      categoriaId: formData.categoriaId,
      quantidade: normalizeQuantidade(formData.quantidade),
      unidade: formData.unidade ?? "un",
      preco: formData.preco ?? undefined,
      marca: formData.marca?.trim() || undefined,
    };

    if (isEditing && editingItem) {
      updateItem(editingItem.id, payload);
      onEditComplete?.();
      return;
    }

    addItem(payload);
    onAddComplete?.();

    setFormData((prev) => ({
      nome: "",
      categoriaId: prev.categoriaId,
      quantidade: 1,
      unidade: prev.unidade ?? "un",
      preco: undefined,
      marca: undefined,
    }));
  };

  const handleQuickAdd = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      handleSubmit(event as unknown as React.FormEvent);
    }
  };

  const priceHistory = useMemo(() => {
    const name = formData.nome.trim();
    if (!name) return null;
    const normalizedName = normalizeShoppingItemName(name, formData.marca);
    if (!normalizedName) return null;
    const entries = loadShoppingPriceHistory().filter(
      (entry) => entry.normalizedName === normalizedName,
    );
    if (!entries.length) return null;
    const sorted = [...entries].sort((a, b) => b.purchasedAt - a.purchasedAt);
    const prices = entries
      .map((entry) => entry.preco)
      .filter((price) => Number.isFinite(price) && price > 0);
    if (!prices.length) return null;
    const total = prices.reduce((sum, price) => sum + price, 0);
    const avg = total / prices.length;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return {
      avg,
      min,
      max,
      lastPrice: sorted[0].preco,
      lastMarket: sorted[0].mercado,
    };
  }, [formData.nome, formData.marca]);

  const priceTip = useMemo(() => {
    if (!priceHistory) return null;
    const avg = priceHistory.avg;
    const currentPrice = formData.preco ?? 0;
    const avgLabel = currencyFormatter.format(avg);
    if (currentPrice > 0) {
      if (currentPrice > avg * 1.15) {
        return `Estimativa pelo seu historico: acima da sua media (${avgLabel}).`;
      }
      if (currentPrice < avg * 0.85) {
        return `Estimativa pelo seu historico: abaixo da sua media (${avgLabel}).`;
      }
      return `Estimativa pelo seu historico: perto da sua media (${avgLabel}).`;
    }
    return `Estimativa pelo seu historico: media em torno de ${avgLabel}.`;
  }, [priceHistory, formData.preco]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-muted/30 p-4">
      <div className="flex items-center gap-2">
        <h3 className="font-medium">{isEditing ? "Editar Item" : "Adicionar Item"}</h3>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="md:col-span-2 lg:col-span-1">
          <Input
            placeholder="Nome do item *"
            value={formData.nome || ""}
            onChange={(event) => setFormData((prev) => ({ ...prev, nome: event.target.value }))}
            onKeyDown={handleQuickAdd}
            className="font-medium"
            autoFocus={!isEditing}
          />
          {priceHistory ? (
            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
              <p>
                Voce ja comprou este item por{" "}
                <span className="font-semibold text-foreground">
                  {currencyFormatter.format(priceHistory.lastPrice)}
                </span>
                {priceHistory.lastMarket ? ` no ${priceHistory.lastMarket}` : ""}.
              </p>
              {priceTip ? <p>{priceTip} Nao e preco em tempo real.</p> : null}
            </div>
          ) : null}
        </div>

        <div>
          <Select
            value={formData.categoriaId || ""}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, categoriaId: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Categoria *" />
            </SelectTrigger>
            <SelectContent>
              {categories
                .slice()
                .sort((a, b) => a.ordem - b.ordem)
                .map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.nome}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Qtd"
            min="0.1"
            step="0.1"
            value={formData.quantidade ?? ""}
            onChange={(event) =>
              setFormData((prev) => ({
                ...prev,
                quantidade: event.target.value === "" ? "" : Number(event.target.value),
              }))
            }
            className="w-20"
          />
          <Select
            value={formData.unidade || "un"}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, unidade: value as FormState["unidade"] }))}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {unidades.map((unidade) => (
                <SelectItem key={unidade} value={unidade}>
                  {unidade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Input
            type="number"
            placeholder="Preco (R$)"
            min="0"
            step="0.01"
            value={formData.preco ?? ""}
            onChange={(event) =>
              setFormData((prev) => ({
                ...prev,
                preco: Number(event.target.value) || undefined,
              }))
            }
          />
        </div>

        <div>
          <Input
            placeholder="Marca (opcional)"
            value={formData.marca ?? ""}
            onChange={(event) => setFormData((prev) => ({ ...prev, marca: event.target.value }))}
          />
        </div>
      </div>

      <div className="flex gap-2">
        {isEditing ? (
          <>
            <Button type="submit" className="flex-1">
              Salvar alteracoes
            </Button>
            <Button type="button" variant="outline" onClick={onEditComplete}>
              Cancelar
            </Button>
          </>
        ) : (
          <Button
            type="submit"
            className="w-full"
            disabled={!formData.nome?.trim() || !formData.categoriaId}
          >
            <Plus className="mr-2 h-4 w-4" /> Adicionar Item
            
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Dica: pressione Enter no campo de nome para adicionar rapidamente.
      </p>
    </form>
  );
};

export default ItemEditor;
