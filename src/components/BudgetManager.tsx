import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Calculator, TrendingUp, TrendingDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useBudget } from "@/hooks/useBudget";
import FeatureLock from "@/components/FeatureLock";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";

type NewBudgetRow = {
  category: string;
  planned: number;
  actual: number;
  type: "income" | "expense";
};

const defaultNewRow: NewBudgetRow = {
  category: "",
  planned: 0,
  actual: 0,
  type: "expense",
};

const categorySuggestions = {
  income: ["Salário", "Freelances", "Investimentos", "Outros Rendimentos"],
  expense: [
    "Moradia",
    "Alimentação",
    "Transporte",
    "Saúde",
    "Educação",
    "Lazer",
    "Roupas",
    "Emergência",
    "Outros",
  ],
};

const monthKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const BudgetManager = () => {
  const { state, addRow, updateRow, removeRow } = useBudget();
  const { toast } = useToast();
  const { flags, loading: flagsLoading } = useFeatureFlags();
  const [currentMonth, setCurrentMonth] = useState(() => monthKey());
  const [newRow, setNewRow] = useState<NewBudgetRow>(defaultNewRow);
  const categoryLimitsLocked = !flags.CATEGORY_LIMITS && !flagsLoading;
  const cashForecastLocked = !flags.CASH_FORECAST && !flagsLoading;

  const items = useMemo(
    () => state.budget.filter((row) => row.month === currentMonth),
    [state.budget, currentMonth],
  );

  const totals = useMemo(() => {
    return items.reduce(
      (acc, row) => {
        if (row.type === "income") {
          acc.incomePlanned += row.planned;
          acc.incomeActual += row.actual;
        } else {
          acc.expensePlanned += row.planned;
          acc.expenseActual += row.actual;
        }
        return acc;
      },
      {
        incomePlanned: 0,
        incomeActual: 0,
        expensePlanned: 0,
        expenseActual: 0,
      },
    );
  }, [items]);

  const balancePlanned = totals.incomePlanned - totals.expensePlanned;
  const balanceActual = totals.incomeActual - totals.expenseActual;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

  const handleAddRow = () => {
    if (!flagsLoading && !flags.CATEGORY_LIMITS) {
      toast({
        title: "Limites por categoria disponíveis no Pro",
        description: "Atualize o plano para criar novos limites e metas personalizadas.",
        variant: "destructive",
      });
      return;
    }
    if (!newRow.category.trim()) {
      toast({
        title: "Categoria obrigatória",
        description: "Informe uma categoria antes de adicionar",
        variant: "destructive",
      });
      return;
    }

    addRow({ ...newRow, month: currentMonth });
    setNewRow(defaultNewRow);

    toast({
      title: "Categoria adicionada",
      description: `${newRow.category} incluída no orçamento`,
    });
  };

  const handleSuggestion = (suggestion: string) => {
    setNewRow((prev) => ({ ...prev, category: suggestion }));
  };

  const getStatus = (row: typeof items[number]) => {
    if (row.type === "income") {
      return {
        label: row.actual >= row.planned ? "Meta atingida" : "Abaixo da meta",
        variant: row.actual >= row.planned ? "default" : "secondary",
      } as const;
    }
    const dentroOrcamento = row.actual <= row.planned;
    return {
      label: dentroOrcamento ? "Dentro do orçamento" : "Acima do orçamento",
      variant: dentroOrcamento ? "default" : "destructive",
    } as const;
  };

  return (
    <>
    <div className="budget-root w-full space-y-6">
      <Card className="financial-card--budget">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Calculator className="mr-2 h-5 w-5" />
              Orçamento Familiar
            </CardTitle>
            <CardDescription>
              Acompanhe receitas e despesas do mês atual.
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div>
              <Label>Mês</Label>
              <Input
                type="month"
                value={currentMonth}
                onChange={(event) => setCurrentMonth(event.target.value)}
                className="input-financial w-40"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <p className="text-xs uppercase text-primary/70">Receitas Planejadas</p>
              <p className="text-xl font-semibold text-primary">{formatCurrency(totals.incomePlanned)}</p>
            </div>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <p className="text-xs uppercase text-primary/70">Receitas Realizadas</p>
              <p className="text-xl font-semibold text-primary">{formatCurrency(totals.incomeActual)}</p>
            </div>
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <p className="text-xs uppercase text-destructive">Despesas Planejadas</p>
              <p className="text-xl font-semibold text-destructive">{formatCurrency(totals.expensePlanned)}</p>
            </div>
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <p className="text-xs uppercase text-destructive">Despesas Realizadas</p>
              <p className="text-xl font-semibold text-destructive">{formatCurrency(totals.expenseActual)}</p>
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-success/30 bg-success/10 p-4">
              <p className="text-xs uppercase text-success">Saldo Planejado</p>
              <p className="text-xl font-semibold text-success">{formatCurrency(balancePlanned)}</p>
            </div>
            <div className="rounded-lg border border-success/30 bg-success/10 p-4">
              <p className="text-xs uppercase text-success">Saldo Realizado</p>
              <p className="text-xl font-semibold text-success">{formatCurrency(balanceActual)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="financial-card lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="mr-2 h-5 w-5" />
              Nova Categoria
            </CardTitle>
            <CardDescription>Adicione receitas ou despesas para este mês.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Tipo</Label>
              <Select
                value={newRow.type}
                onValueChange={(value: "income" | "expense") => setNewRow((prev) => ({ ...prev, type: value }))}
              >
                <SelectTrigger className="input-financial">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Receita</SelectItem>
                  <SelectItem value="expense">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Categoria</Label>
              <Input
                value={newRow.category}
                onChange={(event) => setNewRow((prev) => ({ ...prev, category: event.target.value }))}
                className="input-financial"
              />
              <div className="flex flex-wrap gap-1">
                {categorySuggestions[newRow.type].map((suggestion) => (
                  <Badge
                    key={suggestion}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/20"
                    onClick={() => handleSuggestion(suggestion)}
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Planejado (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={newRow.planned}
                onChange={(event) => setNewRow((prev) => ({ ...prev, planned: Number(event.target.value) || 0 }))}
                className="input-financial"
                disabled={categoryLimitsLocked}
              />
            </div>

            <div className="grid gap-2">
              <Label>Realizado (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={newRow.actual}
                onChange={(event) => setNewRow((prev) => ({ ...prev, actual: Number(event.target.value) || 0 }))}
                className="input-financial"
              />
            </div>

            <Button
              onClick={handleAddRow}
              className="w-full btn-financial--primary"
              disabled={categoryLimitsLocked}
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Categoria
            </Button>
            {categoryLimitsLocked ? (
              <div className="pt-2">
                <FeatureLock
                  title="Limites por categoria bloqueados"
                  description="Atualize o plano para cadastrar e editar metas planejadas."
                  variant="inline"
                />
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="financial-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-success" />
              Orçamento Detalhado
            </CardTitle>
            <CardDescription>{items.length} categorias em {currentMonth}</CardDescription>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="rounded-md border border-dashed border-border/60 p-8 text-center text-muted-foreground">
                <Calculator className="mx-auto mb-4 h-10 w-10 opacity-50" />
                <p className="font-medium">Nenhuma categoria ainda</p>
                <p className="text-sm">Adicione receitas ou despesas para comecar a planejar.</p>
              </div>
            ) : (
              <div className="budget-detailed space-y-4 sm:space-y-6">
                <Accordion type="single" collapsible className="budget-accordion sm:hidden">
                  {items.map((item) => {
                    const saldo =
                      item.type === "income"
                        ? item.actual - item.planned
                        : item.planned - item.actual;
                    const status = getStatus(item);
                    const saldoClass = saldo >= 0 ? "text-success" : "text-destructive";

                    return (
                      <AccordionItem
                        key={item.id}
                        value={String(item.id)}
                        className="budget-card rounded-lg border border-border/60 bg-card/40"
                      >
                        <AccordionTrigger className="budget-card__trigger px-3 py-2 text-sm">
                          <div className="flex min-w-0 flex-col text-left">
                            <span className="truncate">{item.category || "-"}</span>
                            <span className="text-xs capitalize text-muted-foreground">
                              {item.type === "income" ? "Receita" : "Despesa"}
                            </span>
                          </div>
                          <span className={`text-sm font-semibold ${saldoClass}`}>
                            {formatCurrency(item.actual)}
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="budget-card__content px-3 pb-3 pt-0">
                          <div className="flex flex-col gap-4">
                            <div className="budget-row flex items-center gap-3">
                              <span className="text-sm text-muted-foreground">Tipo</span>
                              <div className="min-w-0 flex flex-1">
                                <Select
                                  value={item.type}
                                  onValueChange={(value: "income" | "expense") =>
                                    updateRow(item.id, { type: value })
                                  }
                                >
                                  <SelectTrigger className="h-9 w-full justify-between text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="income">Receita</SelectItem>
                                    <SelectItem value="expense">Despesa</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="budget-row flex items-center gap-3">
                              <span className="text-sm text-muted-foreground">Planejado</span>
                              <Input
                                type="number"
                                step="0.01"
                                value={item.planned}
                                onChange={(event) =>
                                  updateRow(item.id, { planned: Number(event.target.value) || 0 })
                                }
                                className="h-9 flex-1 min-w-0 text-right text-sm"
                                disabled={categoryLimitsLocked}
                              />
                            </div>
                            <div className="budget-row flex items-center gap-3">
                              <span className="text-sm text-muted-foreground">Realizado</span>
                              <Input
                                type="number"
                                step="0.01"
                                value={item.actual}
                                onChange={(event) =>
                                  updateRow(item.id, { actual: Number(event.target.value) || 0 })
                                }
                                className="h-9 flex-1 min-w-0 text-right text-sm"
                              />
                            </div>
                            <div className="budget-row flex items-center justify-between gap-3">
                              <span className="text-sm text-muted-foreground">Saldo</span>
                              <span className={`text-sm font-semibold ${saldoClass}`}>
                                {formatCurrency(saldo)}
                              </span>
                            </div>
                            <div className="budget-row flex items-center justify-between gap-3">
                              <span className="text-sm text-muted-foreground">Status</span>
                              <Badge variant={status.variant} className="text-xs">
                                {status.label}
                              </Badge>
                            </div>
                            <div className="budget-row flex justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeRow(item.id)}
                                className="h-auto px-3 py-2 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remover
                              </Button>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
                <div className="hidden overflow-x-auto sm:block">
                  <table className="data-table min-w-full">
                    <thead>
                      <tr>
                        <th>Categoria</th>
                        <th>Tipo</th>
                        <th>Planejado</th>
                        <th>Realizado</th>
                        <th>Saldo</th>
                        <th>Status</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => {
                        const saldo =
                          item.type === "income"
                            ? item.actual - item.planned
                            : item.planned - item.actual;
                        const status = getStatus(item);
                        const saldoClass = saldo >= 0 ? "text-success" : "text-destructive";
                        return (
                          <tr key={item.id}>
                            <td>
                              <div className="flex items-center gap-2">
                                {item.type === "income" ? (
                                  <TrendingUp className="h-4 w-4 text-success" />
                                ) : (
                                  <TrendingDown className="h-4 w-4 text-destructive" />
                                )}
                                {item.category || "-"}
                              </div>
                            </td>
                            <td>
                              <Select
                                value={item.type}
                                onValueChange={(value: "income" | "expense") => updateRow(item.id, { type: value })}
                              >
                                <SelectTrigger className="h-8 min-w-[6rem] justify-between text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="income">Receita</SelectItem>
                                  <SelectItem value="expense">Despesa</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td>
                              <Input
                                type="number"
                                step="0.01"
                                value={item.planned}
                                onChange={(event) =>
                                  updateRow(item.id, { planned: Number(event.target.value) || 0 })
                                }
                                className="h-8 min-w-[6rem] text-right text-xs"
                                disabled={categoryLimitsLocked}
                              />
                            </td>
                            <td>
                              <Input
                                type="number"
                                step="0.01"
                                value={item.actual}
                                onChange={(event) =>
                                  updateRow(item.id, { actual: Number(event.target.value) || 0 })
                                }
                                className="h-8 min-w-[6rem] text-right text-xs"
                              />
                            </td>
                            <td className={saldoClass}>{formatCurrency(saldo)}</td>
                            <td>
                              <Badge variant={status.variant} className="text-xs">
                                {status.label}
                              </Badge>
                            </td>
                            <td>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeRow(item.id)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    <div className="grid grid-cols-1 gap-6">
      {cashForecastLocked ? (
        <FeatureLock
          title="Previsão de caixa automatizada"
          description="Libere simulações de fluxo de caixa nos planos Pro e Premium."
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Previsão de Caixa</CardTitle>
            <CardDescription>Projeção simples baseada no saldo planejado vs. realizado.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <div className="text-xs uppercase text-muted-foreground">Saldo planejado</div>
                <div className="text-lg font-semibold text-primary">
                  {formatCurrency(balancePlanned)}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase text-muted-foreground">Saldo realizado</div>
                <div className="text-lg font-semibold text-primary">
                  {formatCurrency(balanceActual)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
    </>
  );
};

export default BudgetManager;

