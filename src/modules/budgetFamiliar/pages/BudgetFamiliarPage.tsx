import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  CalendarRange,
  CalendarDays,
  BarChart3,
  TrendingUp,
  Wallet,
  Receipt,
} from "lucide-react";
import { MonthSelector } from "@/modules/budgetFamiliar/components/MonthSelector";
import { SummaryCards } from "@/modules/budgetFamiliar/components/SummaryCards";
import { SummaryYear } from "@/modules/budgetFamiliar/components/SummaryYear";
import { ReceitasForm } from "@/modules/budgetFamiliar/components/ReceitasForm";
import { ReceitasTable } from "@/modules/budgetFamiliar/components/ReceitasTable";
import { DespesasFixasForm } from "@/modules/budgetFamiliar/components/DespesasFixasForm";
import { DespesasFixasTable } from "@/modules/budgetFamiliar/components/DespesasFixasTable";
import { DespesasVariaveisForm } from "@/modules/budgetFamiliar/components/DespesasVariaveisForm";
import { DespesasVariaveisTable } from "@/modules/budgetFamiliar/components/DespesasVariaveisTable";
import { QuickExpenseModal } from "@/modules/budgetFamiliar/components/QuickExpenseModal";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  BudgetFamiliarProvider,
  useBudgetFamiliar,
  type DespesaFixa,
  type DespesaVariavel,
  type PerfilOrcamento,
  type Receita,
} from "@/modules/budgetFamiliar/hooks/useBudgetFamiliar";
import { formatCurrency, isSameMonthYear, toDate } from "@/modules/budgetFamiliar/utils/format";

const months = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const moveDateToMonthYear = (dateString: string, targetMonth: number, targetYear: number) => {
  const date = new Date(dateString);
  const day = Number.isNaN(date.getTime()) ? 1 : date.getDate();
  const lastDayOfTarget = new Date(targetYear, targetMonth + 1, 0).getDate();
  const clampedDay = Math.min(day, lastDayOfTarget);
  const result = new Date(targetYear, targetMonth, clampedDay);
  const yyyy = result.getFullYear();
  const mm = String(result.getMonth() + 1).padStart(2, "0");
  const dd = String(result.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const formatDateInput = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const sortByDate = (a: string, b: string) => {
  const aDate = toDate(a)?.getTime() ?? 0;
  const bDate = toDate(b)?.getTime() ?? 0;
  return aDate - bDate;
};

function BudgetFamiliarDashboard() {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [perfil, setPerfil] = useState<PerfilOrcamento>("familiar");
  const [quickExpenseOpen, setQuickExpenseOpen] = useState(false);
  const [expenseQuery, setExpenseQuery] = useState("");
  const isMobile = useIsMobile();
  const sectionIds = [
    "resumo-mensal",
    "resumo-anual",
    "grafico-mensal",
    "receitas",
    "despesas-fixas",
    "despesas-variaveis",
  ];
  const [openSections, setOpenSections] = useState<string[]>(() => (isMobile ? [] : sectionIds));
  const lastAutoFillRef = useRef<{ month: number; year: number; perfil: PerfilOrcamento } | null>(null);

  useEffect(() => {
    setOpenSections(isMobile ? [] : sectionIds);
  }, [isMobile]);

  const {
    receitas,
    despesasFixas,
    despesasVariaveis,
    addReceita,
    updateReceita,
    deleteReceita,
    addDespesaFixa,
    updateDespesaFixa,
    deleteDespesaFixa,
    addDespesaVariavel,
    updateDespesaVariavel,
    deleteDespesaVariavel,
  } = useBudgetFamiliar();

  const [editingReceita, setEditingReceita] = useState<Receita | null>(null);
  const [editingDespesaFixa, setEditingDespesaFixa] = useState<DespesaFixa | null>(null);
  const [editingDespesaVariavel, setEditingDespesaVariavel] = useState<DespesaVariavel | null>(null);

  const handleQuickExpenseSubmit = (data: { valor: number; observacao: string }) => {
    addDespesaVariavel({
      data: formatDateInput(new Date()),
      categoria: "Despesa rápida",
      descricao: data.observacao,
      formaPagamento: "Outros",
      valor: data.valor,
      essencial: false,
      perfil,
    });
  };

  const receitasFiltradas = useMemo(
    () =>
      receitas
        .filter((r) => r.perfil === perfil && isSameMonthYear(r.data, selectedMonth, selectedYear))
        .sort((a, b) => sortByDate(a.data, b.data)),
    [receitas, selectedMonth, selectedYear, perfil],
  );

  const despesasFixasFiltradas = useMemo(
    () =>
      despesasFixas
        .filter(
          (d) =>
            d.perfil === perfil && isSameMonthYear(d.dataVencimento, selectedMonth, selectedYear),
        )
        .sort((a, b) => sortByDate(a.dataVencimento, b.dataVencimento)),
    [despesasFixas, selectedMonth, selectedYear, perfil],
  );

  const despesasVariaveisFiltradas = useMemo(
    () =>
      despesasVariaveis
        .filter((d) => d.perfil === perfil && isSameMonthYear(d.data, selectedMonth, selectedYear))
        .sort((a, b) => sortByDate(a.data, b.data)),
    [despesasVariaveis, selectedMonth, selectedYear, perfil],
  );

  const despesasPorCategoria = useMemo(() => {
    const term = expenseQuery.trim().toLowerCase();
    if (!term) return [] as Array<{ categoria: string; total: number; items: Array<{ label: string; value: number }> }>;

    const totals = new Map<string, number>();
    const itemsByCategory = new Map<string, Array<{ label: string; value: number }>>();

    despesasFixasFiltradas.forEach((item) => {
      const haystack = `${item.categoria} ${item.conta}`.toLowerCase();
      if (!haystack.includes(term)) return;
      const key = item.categoria || "Sem categoria";
      const value = item.valorPago > 0 ? item.valorPago : item.valorPrevisto;
      totals.set(key, (totals.get(key) ?? 0) + (value || 0));
      const bucket = itemsByCategory.get(key) ?? [];
      bucket.push({ label: item.conta || "Despesa fixa", value: value || 0 });
      itemsByCategory.set(key, bucket);
    });

    despesasVariaveisFiltradas.forEach((item) => {
      const haystack = `${item.categoria} ${item.descricao}`.toLowerCase();
      if (!haystack.includes(term)) return;
      const key = item.categoria || "Sem categoria";
      totals.set(key, (totals.get(key) ?? 0) + (item.valor || 0));
      const bucket = itemsByCategory.get(key) ?? [];
      bucket.push({ label: item.descricao || "Despesa variavel", value: item.valor || 0 });
      itemsByCategory.set(key, bucket);
    });

    return Array.from(totals.entries())
      .map(([categoria, total]) => ({
        categoria,
        total,
        items: itemsByCategory.get(categoria) ?? [],
      }))
      .sort((a, b) => b.total - a.total);
  }, [despesasFixasFiltradas, despesasVariaveisFiltradas, expenseQuery]);

  const monthlyChart = useMemo(() => {
    const income = Array.from({ length: 12 }, () => 0);
    const expense = Array.from({ length: 12 }, () => 0);
    receitas.forEach((item) => {
      if (item.perfil !== perfil) return;
      const date = toDate(item.data);
      if (!date || date.getFullYear() !== selectedYear) return;
      income[date.getMonth()] += item.valor || 0;
    });
    despesasFixas.forEach((item) => {
      if (item.perfil !== perfil) return;
      const date = toDate(item.dataVencimento);
      if (!date || date.getFullYear() !== selectedYear) return;
      const base = item.valorPago > 0 ? item.valorPago : item.valorPrevisto;
      expense[date.getMonth()] += base || 0;
    });
    despesasVariaveis.forEach((item) => {
      if (item.perfil !== perfil) return;
      const date = toDate(item.data);
      if (!date || date.getFullYear() !== selectedYear) return;
      expense[date.getMonth()] += item.valor || 0;
    });

    const maxValue = Math.max(1, ...income, ...expense);
    return { income, expense, maxValue };
  }, [receitas, despesasFixas, despesasVariaveis, perfil, selectedYear]);

  useEffect(() => {
    const lastAutoFill = lastAutoFillRef.current;
    if (
      lastAutoFill &&
      lastAutoFill.month === selectedMonth &&
      lastAutoFill.year === selectedYear &&
      lastAutoFill.perfil === perfil
    ) {
      return;
    }

    if (despesasFixasFiltradas.length > 0) {
      lastAutoFillRef.current = { month: selectedMonth, year: selectedYear, perfil };
      return;
    }

    const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
    const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;

    const recorrentesDoMesAnterior = despesasFixas.filter(
      (d) => d.perfil === perfil && d.recorrente && isSameMonthYear(d.dataVencimento, prevMonth, prevYear),
    );

    if (recorrentesDoMesAnterior.length === 0) {
      lastAutoFillRef.current = { month: selectedMonth, year: selectedYear, perfil };
      return;
    }

    lastAutoFillRef.current = { month: selectedMonth, year: selectedYear, perfil };

    recorrentesDoMesAnterior.forEach((d) => {
      addDespesaFixa({
        dataVencimento: moveDateToMonthYear(d.dataVencimento, selectedMonth, selectedYear),
        conta: d.conta,
        categoria: d.categoria,
        valorPrevisto: d.valorPrevisto,
        valorPago: 0,
        recorrente: true,
        perfil: d.perfil,
      });
    });
  }, [
    despesasFixas,
    despesasFixasFiltradas.length,
    selectedMonth,
    selectedYear,
    perfil,
    addDespesaFixa,
  ]);

  useEffect(() => {
    if (isMobile) {
      setOpenSections([]);
      return;
    }
    setOpenSections(sectionIds);
  }, [isMobile]);

  const renderSection = (
    id: string,
    title: string,
    Icon: typeof CalendarRange,
    content: React.ReactNode,
  ) => {
    if (isMobile) {
      return (
        <AccordionItem value={id} className="border-none w-full">
          <Card className="financial-card w-full p-0">
            <AccordionTrigger className="px-4 py-4 no-underline hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-sm font-semibold text-foreground">{title}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">{content}</AccordionContent>
          </Card>
        </AccordionItem>
      );
    }

    return (
      <Card className="financial-card w-full p-0">
        <CardHeader className="flex flex-row items-center gap-3 space-y-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </div>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>{content}</CardContent>
      </Card>
    );
  };

  return (
    <main className="container mx-auto space-y-8 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Orçamento Familiar Completo</h1>
          <p className="text-sm text-muted-foreground">
            Organize receitas e despesas com uma visão completa do mês.
          </p>
        </div>
        <MonthSelector
          month={selectedMonth}
          year={selectedYear}
          onChange={(month, year) => {
            setSelectedMonth(month);
            setSelectedYear(year);
          }}
        />
      </header>

      <div className="flex justify-center">
        <div className="inline-flex rounded-full bg-muted/60 p-1 text-xs sm:text-sm">
          <Button
            type="button"
            variant={perfil === "familiar" ? "default" : "ghost"}
            onClick={() => setPerfil("familiar")}
            className="rounded-full px-4"
          >
            Orçamento familiar
          </Button>
          <Button
            type="button"
            variant={perfil === "pessoal" ? "default" : "ghost"}
            onClick={() => setPerfil("pessoal")}
            className="rounded-full px-4"
          >
            Somente meu
          </Button>
        </div>
      </div>

      <Card className="financial-card w-full p-0">
        <CardHeader className="space-y-2">
          <CardTitle className="text-base">Pesquisar despesas</CardTitle>
          <p className="text-sm text-muted-foreground">
            Filtre despesas variaveis do periodo atual e veja os totais por categoria.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={expenseQuery}
            onChange={(event) => setExpenseQuery(event.target.value)}
            placeholder="Pesquisar despesas"
          />
          {!expenseQuery.trim() ? (
            <p className="text-sm text-muted-foreground">Digite para pesquisar despesas.</p>
          ) : despesasPorCategoria.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma despesa encontrada.</p>
          ) : (
            <div className="grid gap-3">
              {despesasPorCategoria.map((item) => (
                <div key={item.categoria} className="rounded-md border border-border/60 bg-muted/20">
                  <div className="flex items-center justify-between px-3 py-2 text-sm">
                    <span className="font-medium">{item.categoria}</span>
                    <span className="font-semibold">{formatCurrency(item.total)}</span>
                  </div>
                  <div className="border-t border-border/60 px-3 py-2 text-xs text-muted-foreground space-y-1">
                    {item.items.map((entry, index) => (
                      <div key={`${item.categoria}-${index}`} className="flex items-center justify-between">
                        <span>{entry.label}</span>
                        <span className="font-medium text-foreground">{formatCurrency(entry.value)}</span>
                      </div>
                    ))}
                    {item.items.length > 1 ? (
                      <div className="flex items-center justify-between pt-1 text-foreground">
                        <span className="font-semibold">Total</span>
                        <span className="font-semibold">{formatCurrency(item.total)}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {isMobile ? (
        <Accordion type="multiple" value={openSections} onValueChange={setOpenSections} className="space-y-4">
          {renderSection(
            "resumo-mensal",
            `Resumo de ${months[selectedMonth]} / ${selectedYear}`,
            CalendarRange,
            <SummaryCards month={selectedMonth} year={selectedYear} perfil={perfil} />,
          )}

          {renderSection(
            "resumo-anual",
            `Resumo anual ${selectedYear}`,
            CalendarDays,
            <SummaryYear year={selectedYear} perfil={perfil} />,
          )}

          {renderSection(
            "grafico-mensal",
            "Grafico Receitas x Despesas",
            BarChart3,
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Receitas</span>
                <span>Despesas</span>
              </div>
              <div className="grid grid-cols-12 gap-2 items-end h-40">
                {monthlyChart.income.map((value, index) => {
                  const incomeHeight = Math.round((value / monthlyChart.maxValue) * 100);
                  const expenseHeight = Math.round((monthlyChart.expense[index] / monthlyChart.maxValue) * 100);
                  return (
                    <div key={`${selectedYear}-${index}`} className="flex flex-col items-center gap-2">
                      <div className="flex h-28 w-full items-end justify-center gap-1">
                        <div
                          className="w-2 rounded-full bg-primary/70"
                          style={{ height: `${incomeHeight}%` }}
                          aria-hidden="true"
                        />
                        <div
                          className="w-2 rounded-full bg-destructive/70"
                          style={{ height: `${expenseHeight}%` }}
                          aria-hidden="true"
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary/70" />
                  Receitas
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-destructive/70" />
                  Despesas
                </div>
              </div>
            </div>,
          )}

          {renderSection(
            "receitas",
            "Receitas",
            TrendingUp,
            <div className="grid w-full gap-4 md:grid-cols-2 md:items-start">
              <ReceitasForm
                editing={editingReceita}
                onCancel={() => setEditingReceita(null)}
                onSave={(data) => {
                  if (editingReceita) {
                    updateReceita(editingReceita.id, { ...data, perfil: editingReceita.perfil });
                    setEditingReceita(null);
                  } else {
                    addReceita({ ...data, perfil });
                  }
                }}
              />
              <ReceitasTable
                data={receitasFiltradas}
                onEdit={setEditingReceita}
                onDelete={(id) => deleteReceita(id)}
              />
            </div>,
          )}

          {renderSection(
            "despesas-fixas",
            "Despesas fixas",
            Wallet,
            <div className="grid w-full gap-4 md:grid-cols-2 md:items-start">
              <DespesasFixasForm
                editing={editingDespesaFixa}
                onCancel={() => setEditingDespesaFixa(null)}
                onSave={(data) => {
                  if (editingDespesaFixa) {
                    updateDespesaFixa(editingDespesaFixa.id, { ...data, perfil: editingDespesaFixa.perfil });
                    setEditingDespesaFixa(null);
                  } else {
                    addDespesaFixa({ ...data, perfil });
                  }
                }}
              />
              <DespesasFixasTable
                data={despesasFixasFiltradas}
                onEdit={setEditingDespesaFixa}
                onDelete={(id) => deleteDespesaFixa(id)}
              />
            </div>,
          )}

          {renderSection(
            "despesas-variaveis",
            "Despesas variaveis",
            Receipt,
            <div className="grid w-full gap-4 md:grid-cols-2 md:items-start">
              <DespesasVariaveisForm
                editing={editingDespesaVariavel}
                onCancel={() => setEditingDespesaVariavel(null)}
                onSave={(data) => {
                  if (editingDespesaVariavel) {
                    updateDespesaVariavel(editingDespesaVariavel.id, {
                      ...data,
                      perfil: editingDespesaVariavel.perfil,
                    });
                    setEditingDespesaVariavel(null);
                    return;
                  }
                  addDespesaVariavel({ ...data, perfil });
                }}
                onSaveMany={(items) => {
                  items.forEach((item) => {
                    addDespesaVariavel({ ...item, perfil });
                  });
                }}
              />
              <DespesasVariaveisTable
                data={despesasVariaveisFiltradas}
                onEdit={setEditingDespesaVariavel}
                onDelete={(id) => deleteDespesaVariavel(id)}
              />
            </div>,
          )}
        </Accordion>
      ) : (
        <>
          {renderSection(
            "resumo-mensal",
            `Resumo de ${months[selectedMonth]} / ${selectedYear}`,
            CalendarRange,
            <SummaryCards month={selectedMonth} year={selectedYear} perfil={perfil} />,
          )}

          {renderSection(
            "resumo-anual",
            `Resumo anual ${selectedYear}`,
            CalendarDays,
            <SummaryYear year={selectedYear} perfil={perfil} />,
          )}

          {renderSection(
            "grafico-mensal",
            "Grafico Receitas x Despesas",
            BarChart3,
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Receitas</span>
                <span>Despesas</span>
              </div>
              <div className="grid grid-cols-12 gap-2 items-end h-40">
                {monthlyChart.income.map((value, index) => {
                  const incomeHeight = Math.round((value / monthlyChart.maxValue) * 100);
                  const expenseHeight = Math.round((monthlyChart.expense[index] / monthlyChart.maxValue) * 100);
                  return (
                    <div key={`${selectedYear}-${index}`} className="flex flex-col items-center gap-2">
                      <div className="flex h-28 w-full items-end justify-center gap-1">
                        <div
                          className="w-2 rounded-full bg-primary/70"
                          style={{ height: `${incomeHeight}%` }}
                          aria-hidden="true"
                        />
                        <div
                          className="w-2 rounded-full bg-destructive/70"
                          style={{ height: `${expenseHeight}%` }}
                          aria-hidden="true"
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary/70" />
                  Receitas
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-destructive/70" />
                  Despesas
                </div>
              </div>
            </div>,
          )}

          {renderSection(
            "receitas",
            "Receitas",
            TrendingUp,
            <div className="grid w-full gap-4 md:grid-cols-2 md:items-start">
              <ReceitasForm
                editing={editingReceita}
                onCancel={() => setEditingReceita(null)}
                onSave={(data) => {
                  if (editingReceita) {
                    updateReceita(editingReceita.id, { ...data, perfil: editingReceita.perfil });
                    setEditingReceita(null);
                  } else {
                    addReceita({ ...data, perfil });
                  }
                }}
              />
              <ReceitasTable
                data={receitasFiltradas}
                onEdit={setEditingReceita}
                onDelete={(id) => deleteReceita(id)}
              />
            </div>,
          )}

          {renderSection(
            "despesas-fixas",
            "Despesas fixas",
            Wallet,
            <div className="grid w-full gap-4 md:grid-cols-2 md:items-start">
              <DespesasFixasForm
                editing={editingDespesaFixa}
                onCancel={() => setEditingDespesaFixa(null)}
                onSave={(data) => {
                  if (editingDespesaFixa) {
                    updateDespesaFixa(editingDespesaFixa.id, { ...data, perfil: editingDespesaFixa.perfil });
                    setEditingDespesaFixa(null);
                  } else {
                    addDespesaFixa({ ...data, perfil });
                  }
                }}
              />
              <DespesasFixasTable
                data={despesasFixasFiltradas}
                onEdit={setEditingDespesaFixa}
                onDelete={(id) => deleteDespesaFixa(id)}
              />
            </div>,
          )}

          {renderSection(
            "despesas-variaveis",
            "Despesas variaveis",
            Receipt,
            <div className="grid w-full gap-4 md:grid-cols-2 md:items-start">
              <DespesasVariaveisForm
                editing={editingDespesaVariavel}
                onCancel={() => setEditingDespesaVariavel(null)}
                onSave={(data) => {
                  if (editingDespesaVariavel) {
                    updateDespesaVariavel(editingDespesaVariavel.id, {
                      ...data,
                      perfil: editingDespesaVariavel.perfil,
                    });
                    setEditingDespesaVariavel(null);
                    return;
                  }
                  addDespesaVariavel({ ...data, perfil });
                }}
                onSaveMany={(items) => {
                  items.forEach((item) => {
                    addDespesaVariavel({ ...item, perfil });
                  });
                }}
              />
              <DespesasVariaveisTable
                data={despesasVariaveisFiltradas}
                onEdit={setEditingDespesaVariavel}
                onDelete={(id) => deleteDespesaVariavel(id)}
              />
            </div>,
          )}
        </>
      )}

      <Button
        type="button"
        onClick={() => setQuickExpenseOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full text-2xl font-semibold shadow-lg shadow-primary/30 sm:h-auto sm:w-auto sm:gap-2 sm:px-5 sm:py-3"
        aria-label="Adicionar despesa rápida"
      >
        <span aria-hidden="true">+</span>
        <span className="hidden text-sm font-semibold sm:inline">Despesa rápida</span>
      </Button>

      <QuickExpenseModal
        open={quickExpenseOpen}
        onClose={() => setQuickExpenseOpen(false)}
        onSubmit={handleQuickExpenseSubmit}
      />
    </main>
  );
}

export default function BudgetFamiliarPage() {
  return (
    <BudgetFamiliarProvider>
      <BudgetFamiliarDashboard />
    </BudgetFamiliarProvider>
  );
}
