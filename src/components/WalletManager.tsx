import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  TrendingUp,
  DollarSign,
  Download,
  RefreshCcw,
  LayoutGrid,
  Rows,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import EvolutionChart from "@/components/wallet/EvolutionChart";
import PricesPanel from "@/components/wallet/PricesPanel";
import SectorSummary from "@/components/wallet/SectorSummary";
import AIHints from "@/components/wallet/AIHints";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { cn } from "@/lib/utils";
import type { PortfolioItem } from "@/hooks/usePortfolio";
type Totals = {
  valor: number;
  dividendos: number;
  fii: number;
  acao: number;
  crypto: number;
};

type NewItemState = {
  assetClass: "FII" | "ACAO" | "CRYPTO";
  symbol: string;
  name: string;
  sector: string;
  qty: number;
  price: number;
  monthlyYield: number;
};

const defaultNewItem: NewItemState = {
  assetClass: "FII",
  symbol: "",
  name: "",
  sector: "",
  qty: 0,
  price: 0,
  monthlyYield: 0,
};

type ViewMode = "card" | "table";

const presets = {
  FII: [
    { ticker: "MXRF11", nome: "Maxi Renda", setor: "Títulos/CRI" },
    { ticker: "HGLG11", nome: "CSHG Logística", setor: "Logística" },
    { ticker: "KNRI11", nome: "Kinea Renda Imob.", setor: "Híbrido" },
    { ticker: "XPML11", nome: "XP Malls", setor: "Shoppings" },
    { ticker: "XPLG11", nome: "XP Log", setor: "Logística" },
    { ticker: "VISC11", nome: "Vinci Shopping Centers", setor: "Shoppings" },
    { ticker: "BTLG11", nome: "BTG Pactual Logística", setor: "Logística" },
    { ticker: "HGRE11", nome: "CSHG Real Estate", setor: "Escritórios" },
    { ticker: "HCTR11", nome: "Hectare CE", setor: "Papéis/CRI" },
    { ticker: "BCFF11", nome: "BTG FOF", setor: "Fundo de Fundos" },
    { ticker: "CPTS11", nome: "Capitânia Securities", setor: "Crédito" },
    { ticker: "KNCR11", nome: "Kinea Rendimentos Imob.", setor: "Papéis/CRI" },
    { ticker: "RECT11", nome: "REC Renda Imobiliária", setor: "Renda Urbana" },

  ],
  ACAO: [
    { ticker: "PETR4", nome: "Petrobras PN", setor: "Petróleo & Gás" },
    { ticker: "VALE3", nome: "Vale ON", setor: "Mineração" },
    { ticker: "ITUB4", nome: "Itaú Unibanco PN", setor: "Bancos" },
    { ticker: "BBAS3", nome: "Banco do Brasil ON", setor: "Bancos" },
    { ticker: "WEGE3", nome: "WEG ON", setor: "Bens de Capital" },
    { ticker: "B3SA3", nome: "B3 ON", setor: "Serviços Financeiros" },
    { ticker: "ABEV3", nome: "Ambev ON", setor: "Bebidas/Consumo" },
    { ticker: "MGLU3", nome: "Magazine Luiza ON", setor: "Varejo" },
    { ticker: "LREN3", nome: "Lojas Renner ON", setor: "Varejo" },
    { ticker: "EQTL3", nome: "Equatorial ON", setor: "Energia Elétrica" },
    { ticker: "SUZB3", nome: "Suzano ON", setor: "Papel e Celulose" },
    { ticker: "KLBN11", nome: "Klabin Unit", setor: "Papel e Celulose" },
    { ticker: "GGBR4", nome: "Gerdau PN", setor: "Siderurgia" },
    { ticker: "RADL3", nome: "Raia Drogasil ON", setor: "Saúde/Varejo" },
    { ticker: "PRIO3", nome: "PRIO ON", setor: "Petróleo & Gás" },
    { ticker: "TAEE11", nome: "Taesa Unit", setor: "Energia Elétrica" },
    { ticker: "BBSE3", nome: "BB Seguridade ON", setor: "Seguros" },
  ],

  CRYPTO: [
    { ticker: "BTC", nome: "Bitcoin", setor: "Layer-1" },
    { ticker: "ETH", nome: "Ethereum", setor: "Smart Contracts" },
    { ticker: "USDT", nome: "Tether", setor: "Stablecoin" },
    { ticker: "USDC", nome: "USD Coin", setor: "Stablecoin" },
    { ticker: "BNB", nome: "BNB", setor: "Exchange/Layer-1" },
    { ticker: "SOL", nome: "Solana", setor: "Layer-1" },
    { ticker: "XRP", nome: "Ripple", setor: "Pagamentos" },
    { ticker: "ADA", nome: "Cardano", setor: "Layer-1" },
    { ticker: "DOGE", nome: "Dogecoin", setor: "Meme/Payments" },
    { ticker: "TON", nome: "Toncoin", setor: "Layer-1" },
    { ticker: "TRX", nome: "Tron", setor: "Pagamentos/Layer-1" },
    { ticker: "DOT", nome: "Polkadot", setor: "Interoperabilidade" },
  ],
} as const;

const riskProfileOptions = [
  { value: "conservador", label: "Conservador" },
  { value: "moderado", label: "Moderado" },
  { value: "arrojado", label: "Arrojado" },
] as const;

const goalOptions = [
  { value: "crescimento", label: "Crescimento" },
  { value: "renda-passiva", label: "Renda passiva" },
  { value: "preservacao", label: "Preservação de capital" },
] as const;

const WalletManager = () => {
  const {
    state,
    addItem,
    updateItem,
    removeItem,
    refreshQuotes,
    refreshTicker,
    refreshQuotesSequentialAll,
    updateSettings,
    total,
    loading,
    error,
  } = usePortfolio();
  const { toast } = useToast();
  const { flags } = useFeatureFlags();
  const cardsModuleEnabled = flags.CARDS_MODULE;
  const goalsEnabled = flags.GOALS;
  const reportsEnabled = flags.REPORTS;
  const exportsEnabled = flags.EXPORTS;
  const [newItem, setNewItem] = useState<NewItemState>(defaultNewItem);
  const [showAddForm, setShowAddForm] = useState(false);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [view, setView] = useState<ViewMode>(() => {
    if (typeof window === "undefined") {
      return "card";
    }
    const saved = localStorage.getItem("wallet:viewMode");
    return saved === "table" ? "table" : "card";
  });
  useEffect(() => {
    localStorage.setItem("wallet:viewMode", view);
  }, [view]);

  useEffect(() => {
    if (!cardsModuleEnabled && view === "card") {
      setView("table");
    }
  }, [cardsModuleEnabled, view]);
  const tickerPlaceholder =
    newItem.assetClass === "FII"
      ? "Ex: MXRF11"
      : newItem.assetClass === "ACAO"
        ? "Ex: PETR4"
        : "Ex: BTC";

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const targetAllocation = state.settings?.targetAllocation ?? { fii: 70, acao: 30, crypto: 0 };
  const contributionBudget = state.settings.contributionBudget ?? 0;
  const token = state.settings.brapiToken ?? "";
  const riskProfile = state.settings.riskProfile;
  const goal = state.settings.goal;
  const baseCurrency = state.settings.baseCurrency;
  const showAdvancedSettings = false;

  const totals = useMemo<Totals>(() => {
    return state.portfolio.reduce<Totals>(
      (acc, item) => {
        const value = item.qty * (item.price ?? 0);
        const dividends = value * ((item.monthlyYield ?? 0) / 100);

        acc.valor += value;
        acc.dividendos += dividends;

        if (item.assetClass === "FII") acc.fii += value;
        else if (item.assetClass === "ACAO") acc.acao += value;
        else if (item.assetClass === "CRYPTO") acc.crypto += value;

        return acc;
      },
      { valor: 0, dividendos: 0, fii: 0, acao: 0, crypto: 0 },
    );
  }, [state.portfolio]);

  const allocations = useMemo(() => {
    const value = totals.valor || 0;
    return {
      fiiPct: value > 0 ? (totals.fii / value) * 100 : 0,
      acaoPct: value > 0 ? (totals.acao / value) * 100 : 0,
      cryptoPct: value > 0 ? (totals.crypto / value) * 100 : 0,
    };
  }, [totals]);

  const allocationGap = {
    fii: targetAllocation.fii - allocations.fiiPct,
    acao: targetAllocation.acao - allocations.acaoPct,
    crypto: targetAllocation.crypto - allocations.cryptoPct,
  };

  const assetsByClass = useMemo(() => {
    return {
      FII: state.portfolio.filter((item) => item.assetClass === "FII"),
      ACAO: state.portfolio.filter((item) => item.assetClass === "ACAO"),
      CRYPTO: state.portfolio.filter((item) => item.assetClass === "CRYPTO"),
    };
  }, [state.portfolio]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

  const handleAddItem = () => {
    if (!newItem.symbol.trim()) {
      toast({
        title: "Ticker obrigatório",
        description: "Informe um ticker válido antes de adicionar",
        variant: "destructive",
      });
      return;
    }

    addItem({
      symbol: newItem.symbol.toUpperCase().trim(),
      name: newItem.name,
      sector: newItem.sector,
      qty: Number(newItem.qty) || 0,
      price: Number(newItem.price) || 0,
      monthlyYield: Number(newItem.monthlyYield) || 0,
      assetClass: newItem.assetClass,
    });

    setNewItem(defaultNewItem);
    toast({
      title: "Investimento adicionado",
      description: "O ativo foi incluído na carteira",
    });
  };

  const clamp = (v: unknown, min = 0, max = 100) => {
    const n = Number(v ?? 0);
    if (!Number.isFinite(n)) return min;
    return Math.min(max, Math.max(min, n));
  };

  const handleTargetChange = (key: "fii" | "acao" | "crypto", value: number) => {
    const sanitized = clamp(value, 0, 100);
    const next = {
      ...targetAllocation,
      [key]: sanitized,
    };
    updateSettings({ targetAllocation: next });
  };

  const handleBudgetChange = (value: number) => {
    updateSettings({ contributionBudget: value });
  };

  const handleTokenChange = (value: string) => {
    updateSettings({ brapiToken: value.trim() || undefined });
  };

  const handlePreset = (preset: { ticker: string; nome: string; setor: string }) => {
    setNewItem((prev) => ({
      ...prev,
      symbol: preset.ticker,
      name: preset.nome,
      sector: preset.setor,
    }));
  };

  const handleExportCSV = () => {
    const headers = [
      "Classe",
      "Ticker",
      "Nome",
      "Setor",
      "Quantidade",
      "Preço",
      "DY Mensal",
      "Dividendo/Mês",
      "Valor Total",
    ];
    const rows = state.portfolio.map((item: PortfolioItem) => {
      const value = item.qty * (item.price ?? 0);
      const dividends = value * ((item.monthlyYield ?? 0) / 100);
      return [
        item.assetClass ?? "-",
        item.symbol,
        item.name ?? "",
        item.sector ?? "",
        item.qty.toString(),
        (item.price ?? 0).toFixed(2),
        (item.monthlyYield ?? 0).toFixed(2),
        dividends.toFixed(2),
        value.toFixed(2),
      ];
    });
    const csv = [headers, ...rows]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "carteira_investimentos.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const renderAssets = (items: PortfolioItem[]) => {
    if (items.length === 0) {
      return (
        <div className="rounded-md border border-dashed border-border/60 p-6 text-center text-muted-foreground">
          <TrendingUp className="mx-auto mb-3 h-8 w-8 opacity-50" />
          <p className="font-medium">Nenhum ativo nesta classe</p>
          <p className="text-xs">Adicione investimentos para acompanhar a alocacao.</p>
        </div>
      );
    }

    return (
      <>
        {view === "card" && (
          <div className="wallet-asset-grid grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const value = item.qty * (item.price ?? 0);
              const dividends = value * ((item.monthlyYield ?? 0) / 100);

              return (
                <Card key={item.id} className="wallet-asset-card h-auto">
                  <CardHeader className="wallet-asset-card__header flex flex-col items-start gap-2">
                    <div className="flex w-full items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <Badge variant={item.assetClass === "FII" ? "default" : "secondary"}>
                          {item.assetClass ?? "-"}
                        </Badge>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold leading-tight">{item.symbol}</p>
                          <p className="text-xs text-muted-foreground break-words">{item.name ?? "-"}</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-muted-foreground">
                        {formatCurrency(value)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground break-words">
                      {item.sector || "Nao informado"}
                    </p>
                  </CardHeader>
                  <CardContent className="wallet-asset-card__body space-y-3 pt-0">
                    <div className="wallet-asset-fields flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                      <div className="wallet-asset-field flex min-w-[160px] flex-1 items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">Qtd</span>
                        <Input
                          type="number"
                          value={item.qty}
                          onChange={(event) => updateItem(item.id, { qty: Number(event.target.value) || 0 })}
                          className="w-full min-w-0 text-right text-sm"
                        />
                      </div>
                      <div className="wallet-asset-field flex min-w-[160px] flex-1 items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">Preco (R$)</span>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.price ?? 0}
                          onChange={(event) => updateItem(item.id, { price: Number(event.target.value) || 0 })}
                          className="w-full min-w-0 text-right text-sm"
                        />
                      </div>
                      <div className="wallet-asset-field flex min-w-[160px] flex-1 items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">DY Mensal (%)</span>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.monthlyYield ?? 0}
                          onChange={(event) =>
                            updateItem(item.id, { monthlyYield: Number(event.target.value) || 0 })
                          }
                          className="w-full min-w-0 text-right text-sm"
                        />
                      </div>
                      <div className="wallet-asset-field flex min-w-[160px] flex-1 items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">Setor</span>
                        <span className="min-w-0 break-words text-sm font-medium">
                          {item.sector || "Nao informado"}
                        </span>
                      </div>
                    </div>
                    <div className="wallet-asset-summary flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-sm text-muted-foreground">
                        Dividendos/mes:
                        <span className="ml-1 font-semibold text-success">{formatCurrency(dividends)}</span>
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Valor total:
                        <span className="ml-1 font-semibold">{formatCurrency(value)}</span>
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter className="wallet-asset-card__footer flex flex-wrap gap-2 pt-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refreshTicker(item.symbol)}
                      disabled={loading}
                    >
                      Atualizar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      Remover
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

        {view === "table" && (
          <div className="wallet-table-wrapper overflow-x-auto mt-6">
            <table className="data-table min-w-[720px]">
              <thead>
                <tr>
                  <th>Classe</th>
                  <th>Ticker</th>
                  <th>Nome</th>
                  <th>Setor</th>
                  <th>Qtd</th>
                  <th>Preco</th>
                  <th>DY Mensal</th>
                  <th>Div/Mes</th>
                  <th>Valor Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: PortfolioItem) => {
                  const value = item.qty * (item.price ?? 0);
                  const dividends = value * ((item.monthlyYield ?? 0) / 100);
                  return (
                    <tr key={item.id}>
                      <td>
                        <Badge variant={item.assetClass === "FII" ? "default" : "secondary"}>
                          {item.assetClass ?? "-"}
                        </Badge>
                      </td>
                      <td className="font-mono font-semibold">{item.symbol}</td>
                      <td className="max-w-[160px] break-words">{item.name ?? "-"}</td>
                      <td className="max-w-[160px] break-words">{item.sector ?? "-"}</td>
                      <td>
                        <Input
                          type="number"
                          value={item.qty}
                          onChange={(event) => updateItem(item.id, { qty: Number(event.target.value) || 0 })}
                          className="text-xs text-right"
                        />
                      </td>
                      <td>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.price ?? 0}
                          onChange={(event) => updateItem(item.id, { price: Number(event.target.value) || 0 })}
                          className="text-xs text-right"
                        />
                      </td>
                      <td>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.monthlyYield ?? 0}
                          onChange={(event) =>
                            updateItem(item.id, { monthlyYield: Number(event.target.value) || 0 })
                          }
                          className="text-xs text-right"
                        />
                      </td>
                      <td className="font-medium text-success">{formatCurrency(dividends)}</td>
                      <td className="font-medium">{formatCurrency(value)}</td>
                      <td>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => refreshTicker(item.symbol)}
                            className="px-2"
                            disabled={loading}
                            title={`Atualizar ${item.symbol}`}
                          >
                            Atualizar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                            className="p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </>
    );
  };


  const [draftBudget, setDraftBudget] = useState(String(contributionBudget ?? 0));
  useEffect(() => { setDraftBudget(String(contributionBudget ?? 0)); }, [contributionBudget]);

  const sumTargets = targetAllocation.fii + targetAllocation.acao + targetAllocation.crypto;
  const remaining = 100 - sumTargets;
  const sumIsOk = sumTargets === 100;
  const [draftTargets, setDraftTargets] = useState({
    fii: String(targetAllocation.fii ?? 0),
    acao: String(targetAllocation.acao ?? 0),
    crypto: String(targetAllocation.crypto ?? 0),
  });

  useEffect(() => {
    setDraftTargets({
      fii: String(targetAllocation.fii ?? 0),
      acao: String(targetAllocation.acao ?? 0),
      crypto: String(targetAllocation.crypto ?? 0),
    });
  }, [targetAllocation]);

  return (
    <div className="wallet-root w-full space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Carteira de Investimentos</h2>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-auto px-0 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setHowItWorksOpen(true)}
          >
            ℹ️ Como funciona a carteira
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={refreshQuotes} disabled={loading}>
            <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar cotacoes
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshQuotesSequentialAll}
            disabled={loading}
            title="Atualizar todos os tickers de forma sequencial"
          >
            <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar todos (sequencial)
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <Dialog open={howItWorksOpen} onOpenChange={setHowItWorksOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Como funciona a Carteira de Investimentos</DialogTitle>
            <DialogDescription>
              Entenda o que o app faz e como acompanhar sua carteira.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              Acompanhe sua carteira de investimentos de forma simples e organizada. Registre seus ativos
              manualmente e acompanhe a evolução da sua alocação ao longo do tempo.
            </p>
            <p>
              Os investimentos são realizados fora do app, no banco ou corretora de sua preferência.
            </p>
            <p>Este app não realiza investimentos nem se conecta diretamente a bancos ou corretoras.</p>
            <p>Os ativos são adicionados manualmente por você, com base nos seus investimentos reais.</p>
            <p>Os preços podem ser atualizados para refletir o mercado.</p>
            <p>A carteira ajuda a acompanhar alocação, evolução e metas financeiras.</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setHowItWorksOpen(false)}>Entendi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* KPIs */}
      <Card className="financial-card px-2">
        <CardHeader>
          <CardTitle>Resumo da carteira</CardTitle>
          <CardDescription>
            Valor total {formatCurrency(totals.valor)} · Dividendos mês {formatCurrency(totals.dividendos)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="space-y-3">
            <AccordionItem value="kpis" className="rounded-md border border-border/60 px-4">
              <AccordionTrigger className="py-4 hover:no-underline">
                <div className="flex w-full items-center justify-between gap-3 text-left">
                  <div>
                    <div className="text-sm font-semibold">Indicadores da carteira</div>
                    <div className="text-xs text-muted-foreground">
                      {allocations.fiiPct.toFixed(0)}% FIIs · {allocations.acaoPct.toFixed(0)}% Ações · {allocations.cryptoPct.toFixed(0)}% Crypto
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">Ver detalhes</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4 pt-2">
                <div className="kpi-grid">
                  <Card className="kpi-card">
                    <CardContent className="p-4">
                      <div className="kpi-label">FIIs</div>
                      <div className="kpi-value">
                        {allocations.fiiPct.toFixed(1)}%
                        <span className="ml-2 text-sm text-muted-foreground">
                          ({formatCurrency(totals.fii)})
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Diferença vs meta: {allocationGap.fii.toFixed(1)}%
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="kpi-card">
                    <CardContent className="p-4">
                      <div className="kpi-label">Ações</div>
                      <div className="kpi-value">
                        {allocations.acaoPct.toFixed(1)}%
                        <span className="ml-2 text-sm text-muted-foreground">
                          ({formatCurrency(totals.acao)})
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Diferença vs meta: {allocationGap.acao.toFixed(1)}%
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="kpi-card">
                    <CardContent className="p-4">
                      <div className="kpi-label">Crypto</div>
                      <div className="kpi-value">
                        {allocations.cryptoPct.toFixed(1)}%
                        <span className="ml-2 text-sm text-muted-foreground">
                          ({formatCurrency(totals.crypto)})
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Diferença vs meta: {allocationGap.crypto.toFixed(1)}%
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="kpi-card">
                    <CardContent className="p-4">
                      <div className="kpi-label">Dividendos/Mês</div>
                      <div className="kpi-value text-success">{formatCurrency(totals.dividendos)}</div>
                    </CardContent>
                  </Card>

                  <Card className="kpi-card">
                    <CardContent className="p-4">
                      <div className="kpi-label">Valor Total</div>
                      <div className="kpi-value text-primary">{formatCurrency(totals.valor)}</div>
                    </CardContent>
                  </Card>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Blocos analiticos */}
      <Card className="financial-card px-2">
        <CardHeader>
          <CardTitle>Análises e preferências</CardTitle>
          <CardDescription>Gráficos, dicas e configurações da carteira.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="space-y-3">
            {reportsEnabled ? (
              <AccordionItem value="evolucao" className="rounded-md border border-border/60 px-4">
                <AccordionTrigger className="py-4 hover:no-underline">
                  <div className="flex w-full items-center justify-between gap-3 text-left">
                    <div>
                      <div className="text-sm font-semibold">Evolução da carteira</div>
                      <div className="text-xs text-muted-foreground">Linha do tempo do patrimônio.</div>
                    </div>
                    <span className="text-xs text-muted-foreground">Ver detalhes</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4 pt-2">
                  <EvolutionChart />
                </AccordionContent>
              </AccordionItem>
            ) : null}

            {reportsEnabled ? (
              <AccordionItem value="dicas" className="rounded-md border border-border/60 px-4">
                <AccordionTrigger className="py-4 hover:no-underline">
                  <div className="flex w-full items-center justify-between gap-3 text-left">
                    <div>
                      <div className="text-sm font-semibold">Dicas inteligentes</div>
                      <div className="text-xs text-muted-foreground">Insights com base na carteira.</div>
                    </div>
                    <span className="text-xs text-muted-foreground">Ver detalhes</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4 pt-2">
                  <AIHints />
                </AccordionContent>
              </AccordionItem>
            ) : null}

            <AccordionItem value="preferencias" className="rounded-md border border-border/60 px-4">
              <AccordionTrigger className="py-4 hover:no-underline">
                <div className="flex w-full items-center justify-between gap-3 text-left">
                  <div>
                    <div className="text-sm font-semibold">Preferências da carteira</div>
                    <div className="text-xs text-muted-foreground">Defina parâmetros para orientar dicas.</div>
                  </div>
                  <span className="text-xs text-muted-foreground">Ver detalhes</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4 pt-2">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label>Perfil de risco</Label>
                      <Select
                        value={riskProfile}
                        onValueChange={(value) =>
                          updateSettings({ riskProfile: value as typeof riskProfile })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o perfil" />
                        </SelectTrigger>
                        <SelectContent>
                          {riskProfileOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Objetivo principal</Label>
                      <Select
                        value={goal}
                        onValueChange={(value) => updateSettings({ goal: value as typeof goal })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o objetivo" />
                        </SelectTrigger>
                        <SelectContent>
                          {goalOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label>Moeda base</Label>
                    <div className="rounded-md border border-input bg-input px-3 py-2 text-sm">
                      {baseCurrency}
                    </div>
                  </div>

                  {showAdvancedSettings ? (
                    <>
                      <div>
                        <Label>Orçamento de Aporte (R$)</Label>
                        <Input
                          inputMode="decimal"
                          value={draftBudget}
                          onChange={(e) => setDraftBudget(e.target.value)}
                          onBlur={() => handleBudgetChange(Number(draftBudget) || 0)}
                          className="input-financial"
                        />
                      </div>

                      {goalsEnabled ? (
                        <>
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                              <Label>Meta FIIs (%)</Label>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={draftTargets.fii}
                                onChange={(e) =>
                                  setDraftTargets((d) => ({ ...d, fii: e.target.value }))
                                }
                                onBlur={() => handleTargetChange("fii", Number(draftTargets.fii) || 0)}
                                className="input-financial"
                              />
                            </div>
                            <div>
                              <Label>Meta Ações (%)</Label>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={draftTargets.acao}
                                onChange={(e) =>
                                  setDraftTargets((d) => ({ ...d, acao: e.target.value }))
                                }
                                onBlur={() => handleTargetChange("acao", Number(draftTargets.acao) || 0)}
                                className="input-financial"
                              />
                            </div>
                            <div>
                              <Label>Meta Crypto (%)</Label>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={draftTargets.crypto}
                                onChange={(e) =>
                                  setDraftTargets((d) => ({ ...d, crypto: e.target.value }))
                                }
                                onBlur={() => handleTargetChange("crypto", Number(draftTargets.crypto) || 0)}
                                className="input-financial"
                              />
                            </div>
                          </div>

                          <div
                            className={cn(
                              "text-xs mt-1",
                              sumIsOk ? "text-muted-foreground" : "text-amber-500",
                            )}
                          >
                            Soma das metas: {sumTargets}%{" "}
                            {remaining !== 0 && `(restante ${remaining > 0 ? "+" : ""}${remaining}%)`}
                          </div>
                        </>
                      ) : null}
                      <div>
                        <Label>Token BRAPI (opcional)</Label>
                        <Input
                          value={token}
                          onChange={(event) => handleTokenChange(event.target.value)}
                          placeholder="Informe seu token para limites maiores"
                          className="input-financial"
                        />
                      </div>

                      {exportsEnabled ? (
                        <Button
                          variant="outline"
                          onClick={handleExportCSV}
                          className="btn-financial--ghost"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Exportar CSV
                        </Button>
                      ) : null}
                    </>
                  ) : null}
                </div>
              </AccordionContent>
            </AccordionItem>

            {reportsEnabled ? (
              <AccordionItem value="setor" className="rounded-md border border-border/60 px-4">
                <AccordionTrigger className="py-4 hover:no-underline">
                  <div className="flex w-full items-center justify-between gap-3 text-left">
                    <div>
                      <div className="text-sm font-semibold">Resumo por setor</div>
                      <div className="text-xs text-muted-foreground">Distribuição da carteira.</div>
                    </div>
                    <span className="text-xs text-muted-foreground">Ver detalhes</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4 pt-2">
                  <SectorSummary />
                </AccordionContent>
              </AccordionItem>
            ) : null}

            {reportsEnabled ? (
              <AccordionItem value="precos" className="rounded-md border border-border/60 px-4">
                <AccordionTrigger className="py-4 hover:no-underline">
                  <div className="flex w-full items-center justify-between gap-3 text-left">
                    <div>
                      <div className="text-sm font-semibold">Painel de preços</div>
                      <div className="text-xs text-muted-foreground">Variação e comparativos.</div>
                    </div>
                    <span className="text-xs text-muted-foreground">Ver detalhes</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4 pt-2">
                  <PricesPanel />
                </AccordionContent>
              </AccordionItem>
            ) : null}
          </Accordion>
        </CardContent>
      </Card>

      {/* Carteira */}
      <Card className="financial-card px-2">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Ativos ({state.portfolio.length})
            </CardTitle>
            <CardDescription>
              Total investido {formatCurrency(total)} | Dividendos mês {formatCurrency(totals.dividendos)}
            </CardDescription>
          </div>
          {cardsModuleEnabled ? (
            <div className="inline-flex items-center gap-1 rounded-md border p-1">
              <Toggle
                pressed={view === "card"}
                onPressedChange={(pressed) => {
                  if (pressed) setView("card");
                }}
                size="sm"
                className="gap-2"
                aria-pressed={view === "card"}
                aria-label="Ver em cards"
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline">Cards</span>
              </Toggle>
              <Toggle
                pressed={view === "table"}
                onPressedChange={(pressed) => {
                  if (pressed) setView("table");
                }}
                size="sm"
                className="gap-2"
                aria-pressed={view === "table"}
                aria-label="Ver em lista"
              >
                <Rows className="h-4 w-4" />
                <span className="hidden sm:inline">Lista</span>
              </Toggle>
            </div>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          {state.portfolio.length === 0 ? (
            <div className="rounded-md border border-dashed border-border/60 p-8 text-center text-muted-foreground">
              <TrendingUp className="mx-auto mb-4 h-10 w-10 opacity-50" />
              <p className="font-medium">Sua carteira esta vazia</p>
              <p className="text-sm">Adicione investimentos para comecar a acompanhar seu patrimonio.</p>
            </div>
          ) : (
            <Accordion type="multiple" className="space-y-3">
              <AccordionItem value="fii" className="rounded-md border border-border/60 px-4">
                <AccordionTrigger className="py-4 hover:no-underline">
                  <div className="flex w-full items-center justify-between gap-3 text-left">
                    <div>
                      <div className="text-sm font-semibold">FIIs</div>
                      <div className="text-xs text-muted-foreground">
                        {allocations.fiiPct.toFixed(0)}% · {formatCurrency(totals.fii)}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">Ver detalhes</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4 pt-2">
                  {renderAssets(assetsByClass.FII)}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="acao" className="rounded-md border border-border/60 px-4">
                <AccordionTrigger className="py-4 hover:no-underline">
                  <div className="flex w-full items-center justify-between gap-3 text-left">
                    <div>
                      <div className="text-sm font-semibold">Ações</div>
                      <div className="text-xs text-muted-foreground">
                        {allocations.acaoPct.toFixed(0)}% · {formatCurrency(totals.acao)}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">Ver detalhes</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4 pt-2">
                  {renderAssets(assetsByClass.ACAO)}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="crypto" className="rounded-md border border-border/60 px-4">
                <AccordionTrigger className="py-4 hover:no-underline">
                  <div className="flex w-full items-center justify-between gap-3 text-left">
                    <div>
                      <div className="text-sm font-semibold">Crypto</div>
                      <div className="text-xs text-muted-foreground">
                        {allocations.cryptoPct.toFixed(0)}% · {formatCurrency(totals.crypto)}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">Ver detalhes</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4 pt-2">
                  {renderAssets(assetsByClass.CRYPTO)}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adicionar Investimento</DialogTitle>
            <DialogDescription>Preencha os dados do ativo para incluí-lo na carteira.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Classe</Label>
                <Select
                  value={newItem.assetClass}
                  onValueChange={(value: "FII" | "ACAO" | "CRYPTO") =>
                    setNewItem((prev) => ({ ...prev, assetClass: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a classe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FII">FII</SelectItem>
                    <SelectItem value="ACAO">Ação</SelectItem>
                    <SelectItem value="CRYPTO">Crypto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Ticker</Label>
                <Input
                  value={newItem.symbol}
                  onChange={(event) => setNewItem((prev) => ({ ...prev, symbol: event.target.value }))}
                  placeholder={tickerPlaceholder}
                  className="input-financial"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Nome</Label>

                <Input
                  value={newItem.name}
                  onChange={(e) => setNewItem((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Nome/descrição do ativo"
                  className="input-financial"
                />

              </div>

              <div>
                <Label>Setor</Label>
                <Input
                  value={newItem.sector}
                  onChange={(event) => setNewItem((prev) => ({ ...prev, sector: event.target.value }))}
                  className="input-financial"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  value={newItem.qty}
                  onChange={(event) => setNewItem((prev) => ({ ...prev, qty: Number(event.target.value) || 0 }))}
                  className="input-financial"
                />
              </div>

              <div>
                <Label>Preço (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newItem.price}
                  onChange={(event) => setNewItem((prev) => ({ ...prev, price: Number(event.target.value) || 0 }))}
                  className="input-financial"
                />
              </div>

              <div>
                <Label>DY Mensal (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newItem.monthlyYield}
                  onChange={(event) =>
                    setNewItem((prev) => ({ ...prev, monthlyYield: Number(event.target.value) || 0 }))
                  }
                  className="input-financial"
                />
              </div>
            </div>

            <div>
              <Label>Presets Populares</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {presets[newItem.assetClass]?.map((preset, index) => (
                  <Badge
                    key={`${preset.ticker}-${index}`}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/20"
                    onClick={() => handlePreset(preset)}
                  >
                    {preset.ticker}
                  </Badge>
                ))}
              </div>
            </div>

            <Button onClick={handleAddItem} className="w-full btn-financial--primary">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar à Carteira
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddForm(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!showAddForm ? (
        <Button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full p-0 shadow-lg sm:bottom-8 sm:right-8 sm:h-12 sm:w-auto sm:rounded-full sm:px-4"
        >
          <Plus className="h-5 w-5 sm:mr-2" />
          <span className="hidden sm:inline">Adicionar investimento</span>
          <span className="sr-only">Adicionar investimento</span>
        </Button>
      ) : null}
    </div>
  );
};

export default WalletManager;























