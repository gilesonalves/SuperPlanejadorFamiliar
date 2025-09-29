import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import type { ShoppingCategory, ShoppingItem } from "@/services/shopping/types";
import { useShopping } from "@/hooks/useShopping";

type Props = {
  categories: ShoppingCategory[];
  editingItem?: ShoppingItem;
  isEditing?: boolean;
  onEditComplete?: () => void;
};

const unidades = ["un", "kg", "g", "ml", "l", "pct", "cx"] as const;

type FormState = Partial<ShoppingItem>;

const ItemEditor = ({ categories, editingItem, isEditing, onEditComplete }: Props) => {
  const { addItem, updateItem } = useShopping();
  const [formData, setFormData] = useState<FormState>(() => ({
    nome: "",
    categoriaId: "",
    quantidade: 1,
    unidade: "un",
    status: "pendente",
  }));

  useEffect(() => {
    if (editingItem) {
      setFormData(editingItem);
    }
  }, [editingItem]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.nome?.trim() || !formData.categoriaId) {
      return;
    }

    if (isEditing && editingItem) {
      updateItem(editingItem.id, {
        ...formData,
        nome: formData.nome.trim(),
      });
      onEditComplete?.();
      return;
    }

    addItem({
      nome: formData.nome.trim(),
      categoriaId: formData.categoriaId,
      quantidade: formData.quantidade || 1,
      unidade: formData.unidade || "un",
      preco: formData.preco || undefined,
      marca: formData.marca?.trim() || undefined,
      observacao: formData.observacao?.trim() || undefined,
      status: "pendente",
    });

    setFormData((prev) => ({
      nome: "",
      categoriaId: prev.categoriaId,
      quantidade: 1,
      unidade: prev.unidade || "un",
      status: "pendente",
    }));
  };

  const handleQuickAdd = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      handleSubmit(event as unknown as React.FormEvent);
    }
  };

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
                quantidade: Number(event.target.value) || 1,
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

      <Textarea
        placeholder="Observacoes, dicas de receita ou informacoes nutricionais"
        rows={2}
        className="text-sm"
        value={formData.observacao ?? ""}
        onChange={(event) => setFormData((prev) => ({ ...prev, observacao: event.target.value }))}
      />

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