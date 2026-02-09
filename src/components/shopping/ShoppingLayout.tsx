
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useShoppingStore } from "@/contexts/ShoppingContext";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import type { ShoppingExpensePayload, ShoppingItem } from "@/services/shopping/types";
import { loadShoppingPriceHistory } from "@/services/shopping/storage";
import ItemEditor from "./ItemEditor";
import ItemsTable from "./ItemsTable";
import ListPicker from "./ListPicker";
import ShoppingAiHints from "./ShoppingAiHints";
import TotalsBar from "./TotalsBar";

type Props = {
  onRequestAddExpense?: (payload: ShoppingExpensePayload) => void;
};

const ShoppingLayout = ({ onRequestAddExpense }: Props) => {
  const {
    activeList,
    sortBy,
    sortDirection,
    handleSortChange,
    getTotalByCategory,
    getTotalGeral,
    getStats,
    finalizeList,
  } = useShoppingStore();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [editingItem, setEditingItem] = useState<ShoppingItem | undefined>();
  const [editorOpen, setEditorOpen] = useState(false);
  const [finalizeOpen, setFinalizeOpen] = useState(false);
  const [marketChoice, setMarketChoice] = useState("nao-informar");
  const [customMarket, setCustomMarket] = useState("");

  const marketOptions = useMemo(() => {
    const history = loadShoppingPriceHistory();
    const markets = history
      .map((entry) => entry.mercado)
      .filter((market): market is string => Boolean(market && market.trim()));
    return Array.from(new Set(markets)).sort((a, b) => a.localeCompare(b));
  }, []);

  const resolvedMarket = useMemo(() => {
    if (marketChoice === "custom") return customMarket.trim();
    if (marketChoice === "nao-informar") return "";
    return marketChoice;
  }, [marketChoice, customMarket]);

  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }),
    [],
  );

  const categoryTotals = useMemo(() => {
    if (!activeList) return [] as Array<{ id: string; nome: string; total: number }>;
    return activeList.categorias
      .slice()
      .sort((a, b) => a.ordem - b.ordem)
      .map((category) => ({
        id: category.id,
        nome: category.nome,
        total: getTotalByCategory(category.id),
      }))
      .filter((row) => row.total > 0);
  }, [activeList, getTotalByCategory]);

  const handleRequestAddExpense = () => {
    if (!activeList || !onRequestAddExpense) return;
    const total = getTotalGeral();
    if (total <= 0) return;
    onRequestAddExpense({
      source: "shopping-list",
      total,
      date: new Date().toISOString(),
      category: "Mercado",
      description: "Compras de mercado",
      metadata: {
        listId: activeList.id,
        itemCount: stats.total,
      },
    });
    setFinalizeOpen(false);
  };

  const openNewItem = () => {
    setEditingItem(undefined);
    setEditorOpen(true);
  };

  const openEditItem = (item: ShoppingItem) => {
    setEditingItem(item);
    setEditorOpen(true);
  };

  const handleFinalizeList = () => {
    if (!activeList) return;
    finalizeList(resolvedMarket || undefined);
    setFinalizeOpen(false);
    toast({
      title: "Compra finalizada",
      description: "A lista foi arquivada e salva no historico local.",
    });
  };

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
  const hasItems = activeList.itens.length > 0;
  const totalGeral = getTotalGeral();
  const marketLabel = resolvedMarket
    ? resolvedMarket
    : marketChoice === "custom"
      ? "Outro (digitar)"
      : "Não informar";

  return (
    <div className="shopping-root container mx-auto w-full space-y-4 px-4 py-6 pb-32">
      <header className="space-y-4 rounded-xl border bg-card px-4 py-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold sm:text-3xl">Lista de Compras</h1>
            <p className="text-sm text-muted-foreground">Lista ativa: {activeList.nome}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setFinalizeOpen(true)} disabled={!hasItems}>
              Finalizar compra
            </Button>
          </div>
        </div>
      </header>

      <Accordion type="multiple" className="space-y-3">
        <AccordionItem value="market" className="rounded-md border border-border/60 px-4">
          <AccordionTrigger className="py-4 hover:no-underline">
            <div className="flex w-full items-center justify-between gap-3 text-left">
              <div>
                <div className="text-sm font-semibold">Mercado da compra</div>
                <div className="text-xs text-muted-foreground">{marketLabel}</div>
              </div>
              <span className="text-xs text-muted-foreground">Ver detalhes</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4 pt-2">
            <div className="space-y-2">
              <Label>Onde você está comprando hoje?</Label>
              <Select value={marketChoice} onValueChange={setMarketChoice}>
                <SelectTrigger>
                  <SelectValue placeholder="Não informar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nao-informar">Não informar</SelectItem>
                  {marketOptions.map((market) => (
                    <SelectItem key={market} value={market}>
                      {market}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Outro (digitar)</SelectItem>
                </SelectContent>
              </Select>
              {marketChoice === "custom" ? (
                <Input
                  value={customMarket}
                  onChange={(event) => setCustomMarket(event.target.value)}
                  placeholder="Informe o mercado"
                />
              ) : null}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="totais" className="rounded-md border border-border/60 px-4">
          <AccordionTrigger className="py-4 hover:no-underline">
            <div className="flex w-full items-center justify-between gap-3 text-left">
              <div>
                <div className="text-sm font-semibold">Totais</div>
                <div className="text-xs text-muted-foreground">
                  {currencyFormatter.format(totalGeral)} · {stats.total} itens
                </div>
              </div>
              <span className="text-xs text-muted-foreground">Ver detalhes</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4 pt-2">
            <TotalsBar
              categories={activeList.categorias}
              getTotalByCategory={getTotalByCategory}
              totalGeral={totalGeral}
              stats={stats}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="itens" className="rounded-md border border-border/60 px-4">
          <AccordionTrigger className="py-4 hover:no-underline">
            <div className="flex w-full items-center justify-between gap-3 text-left">
              <div>
                <div className="text-sm font-semibold">Itens da lista</div>
                <div className="text-xs text-muted-foreground">
                  {hasItems ? `${stats.total} itens` : "Sem itens"}
                </div>
              </div>
              <span className="text-xs text-muted-foreground">Ver detalhes</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4 pt-2">
            <ItemsTable
              items={activeList.itens}
              categories={activeList.categorias}
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSortChange={handleSortChange}
              onEditItem={openEditItem}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="dicas" className="rounded-md border border-border/60 px-4">
          <AccordionTrigger className="py-4 hover:no-underline">
            <div className="flex w-full items-center justify-between gap-3 text-left">
              <div>
                <div className="text-sm font-semibold">Dicas inteligentes</div>
                <div className="text-xs text-muted-foreground">
                  Receitas e modos de preparo com base no que você digitar.
                </div>
              </div>
              <span className="text-xs text-muted-foreground">Ver detalhes</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4 pt-2">
            <ShoppingAiHints />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="listas" className="rounded-md border border-border/60 px-4">
          <AccordionTrigger className="py-4 hover:no-underline">
            <div className="flex w-full items-center justify-between gap-3 text-left">
              <div>
                <div className="text-sm font-semibold">Gerenciar listas</div>
                <div className="text-xs text-muted-foreground">
                  {activeList.nome} · {activeList.itens.length} itens
                </div>
              </div>
              <span className="text-xs text-muted-foreground">Ver detalhes</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4 pt-2">
            {isMobile ? (
              <Card className="w-full p-4">
                <CardHeader className="p-0">
                  <CardTitle className="text-sm">Listas</CardTitle>
                </CardHeader>
                <CardContent className="p-0 pt-3">
                  <ListPicker />
                </CardContent>
              </Card>
            ) : (
              <ListPicker />
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Editar item" : "Adicionar item"}</DialogTitle>
            <DialogDescription>
              Preencha os dados do item e salve na lista.
            </DialogDescription>
          </DialogHeader>
          <ItemEditor
            categories={activeList.categorias}
            editingItem={editingItem}
            isEditing={!!editingItem}
            onEditComplete={() => {
              setEditingItem(undefined);
              setEditorOpen(false);
            }}
            onAddComplete={() => setEditorOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={finalizeOpen} onOpenChange={setFinalizeOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Resumo da compra</DialogTitle>
            <DialogDescription>
              Revise os totais antes de zerar a lista.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              {categoryTotals.length ? (
                categoryTotals.map((row) => (
                  <div
                    key={row.id}
                    className="flex items-center justify-between rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-sm"
                  >
                    <span>{row.nome}</span>
                    <span className="font-semibold">{currencyFormatter.format(row.total)}</span>
                  </div>
                ))
              ) : (
                <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                  Nenhum total por categoria.
                </div>
              )}
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-3">
              <div className="text-xs text-muted-foreground">Total geral</div>
              <div className="text-lg font-bold text-primary">
                {currencyFormatter.format(getTotalGeral())}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {stats.total} itens
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Deseja adicionar o valor gasto como despesa variavel?
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              {onRequestAddExpense ? (
                <Button variant="outline" onClick={handleRequestAddExpense}>
                  Adicionar como despesa de Mercado
                </Button>
              ) : null}
              <Button variant="outline" onClick={() => setFinalizeOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleFinalizeList}>
                Zerar lista e finalizar compra
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Button
        type="button"
        onClick={openNewItem}
        className="fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full p-0 shadow-lg sm:bottom-8 sm:right-8 sm:h-12 sm:w-auto sm:rounded-full sm:px-4"
      >
        <Plus className="h-5 w-5 sm:mr-2" />
        <span className="hidden sm:inline">Adicionar item</span>
        <span className="sr-only">Adicionar item</span>
      </Button>

    </div>
  );
};

export default ShoppingLayout;
