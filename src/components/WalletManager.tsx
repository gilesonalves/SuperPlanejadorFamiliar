import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  TrendingUp,
  DollarSign,

  Download,
  RefreshCcw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ImportExport from "@/components/ImportExport";
import { usePortfolio } from "@/hooks/usePortfolio";
import { cloneDefaultState, saveLocal, type AppState } from "@/services/storage";

type NewItemState = {
  assetClass: "FII" | "ACAO";
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

const presets = {
  FII: [
    { ticker: "MXRF11", nome: "Maxi Renda", setor: "Títulos/CRI" },
    { ticker: "HGLG11", nome: "CSHG Logística", setor: "Logística" },
    { ticker: "KNRI11", nome: "Kinea Renda Imob.", setor: "Híbrido" },
    { ticker: "XPML11", nome: "XP Malls", setor: "Shoppings" },
    { ticker: "XPLG11", nome: "XP Log", setor: "Logística" },
  ],
  ACAO: [
    { ticker: "PETR4", nome: "Petrobras PN", setor: "Petróleo & Gás" },
    { ticker: "VALE3", nome: "Vale ON", setor: "Mineração" },
    { ticker: "ITUB4", nome: "Itaú Unibanco PN", setor: "Bancos" },
    { ticker: "BBAS3", nome: "Banco do Brasil ON", setor: "Bancos" },
    { ticker: "WEGE3", nome: "WEG ON", setor: "Bens de Capital" },
  ],
};

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
  const [newItem, setNewItem] = useState<NewItemState>(defaultNewItem);

  const targetAllocation = state.settings.targetAllocation ?? { fii: 70, acao: 30 };
  const contributionBudget = state.settings.contributionBudget ?? 0;
  const token = state.settings.brapiToken ?? "";

  const totals = useMemo(() => {
    return state.portfolio.reduce(
      (acc, item) => {
        const value = item.qty * (item.price ?? 0);
        const dividends = value * ((item.monthlyYield ?? 0) / 100);

        acc.valor += value;
        acc.dividendos += dividends;

        if (item.assetClass === "FII") {
          acc.fii += value;
        } else {
          acc.acao += value;
        }

        return acc;
      },
      { valor: 0, dividendos: 0, fii: 0, acao: 0 },
    );
  }, [state.portfolio]);

  const allocations = useMemo(() => {
    const value = totals.valor || 0;
    return {
      fiiPct: value > 0 ? (totals.fii / value) * 100 : 0,
      acaoPct: value > 0 ? (totals.acao / value) * 100 : 0,
    };
  }, [totals]);

  const allocationGap = {
    fii: targetAllocation.fii - allocations.fiiPct,
    acao: targetAllocation.acao - allocations.acaoPct,
  };

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

  const handleTargetChange = (key: "fii" | "acao", value: number) => {
    const sanitized = Math.min(100, Math.max(0, value));
    const next =
      key === "fii"
        ? { fii: sanitized, acao: 100 - sanitized }
        : { fii: 100 - sanitized, acao: sanitized };
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
    const rows = state.portfolio.map((item) => {
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

  const handleImportJSON = (payload: unknown) => {
    try {
      if (!payload || typeof payload !== "object") throw new Error("Formato inválido");
      const base = cloneDefaultState();
      const data = payload as Partial<AppState>;
      const nextState: AppState = {
        portfolio: Array.isArray(data.portfolio) ? data.portfolio : base.portfolio,
        budget: Array.isArray(data.budget) ? data.budget : base.budget,
        settings: {
          ...base.settings,
          ...(typeof data.settings === "object" && data.settings ? data.settings : {}),
        },
      };
      saveLocal(nextState);
      toast({
        title: "Dados importados",
        description: "A carteira foi atualizada com sucesso",
      });
    } catch (err) {
      console.error("Erro ao importar JSON", err);
      toast({
        title: "Falha na importação",
        description: "Não foi possível ler o arquivo selecionado",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="wallet-root w-full space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Carteira de Investimentos</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie FIIs, ações e acompanhe suas metas de alocação.
          </p>
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
          <ImportExport
            dataForExport={state}
            onImportJSON={handleImportJSON}
            fileName="superplanejador_carteira"
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {/* KPIs */}
      <div className="kpi-grid">
        <Card className="kpi-card">
          <CardContent className="p-4">
            <div className="kpi-label">Valor Total</div>
            <div className="kpi-value text-primary">{formatCurrency(totals.valor)}</div>
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
      </div>

      {/* Configurações */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="financial-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="mr-2 h-5 w-5" />
              Configurações da Carteira
            </CardTitle>
            <CardDescription>Controle metas e integração com a BRAPI.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Orçamento de Aporte (R$)</Label>
              <Input
                type="number"
                value={contributionBudget}
                onChange={(event) => handleBudgetChange(Number(event.target.value) || 0)}
                className="input-financial"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Meta FIIs (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={targetAllocation.fii}
                  onChange={(event) => handleTargetChange("fii", Number(event.target.value) || 0)}
                  className="input-financial"
                />
              </div>
              <div>
                <Label>Meta Ações (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={targetAllocation.acao}
                  onChange={(event) => handleTargetChange("acao", Number(event.target.value) || 0)}
                  className="input-financial"
                />
              </div>
            </div>

            <div>
              <Label>Token BRAPI (opcional)</Label>
              <Input
                value={token}
                onChange={(event) => handleTokenChange(event.target.value)}
                placeholder="Informe seu token para limites maiores"
                className="input-financial"
              />
            </div>

            <Button variant="outline" onClick={handleExportCSV} className="btn-financial--ghost">
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
          </CardContent>
        </Card>

        {/* Adicionar Item */}
        <Card className="financial-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="mr-2 h-5 w-5" />
              Adicionar Investimento
            </CardTitle>
            <CardDescription>Preencha os dados do ativo para incluí-lo na carteira.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Classe</Label>
                <Select
                  value={newItem.assetClass}
                  onValueChange={(value: "FII" | "ACAO") => setNewItem((prev) => ({ ...prev, assetClass: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a classe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FII">FII</SelectItem>
                    <SelectItem value="ACAO">Ação</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Ticker</Label>
                <Input
                  value={newItem.symbol}
                  onChange={(event) => setNewItem((prev) => ({ ...prev, symbol: event.target.value }))}
                  placeholder="Ex: MXRF11"
                  className="input-financial"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Nome</Label>
                <Input
                  value={newItem.name}
                  onChange={(event) => setNewItem((prev) => ({ ...prev, name: event.target.value }))}
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
          </CardContent>
        </Card>
      </div>

      {/* Carteira */}
      <Card className="financial-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Ativos ({state.portfolio.length})
            </CardTitle>
            <CardDescription>
              Total investido {formatCurrency(total)} | Dividendos mês {formatCurrency(totals.dividendos)}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {state.portfolio.length === 0 ? (
            <div className="rounded-md border border-dashed border-border/60 p-8 text-center text-muted-foreground">
              <TrendingUp className="mx-auto mb-4 h-10 w-10 opacity-50" />
              <p className="font-medium">Sua carteira esta vazia</p>
              <p className="text-sm">Adicione investimentos para comecar a acompanhar seu patrimonio.</p>
            </div>
          ) : (
            <>
              <div className="wallet-asset-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {state.portfolio.map((item) => {
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
              <div className="wallet-table-wrapper overflow-x-auto mt-6">
                <table className="data-table min-w-[640px]">
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
                    {state.portfolio.map((item) => {
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WalletManager;





