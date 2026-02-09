import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  Wallet,
  ShoppingBasket,
  ClipboardList,
  Goal,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useBudgetFamiliarSummary } from "@/modules/budgetFamiliar/hooks/useBudgetFamiliarSummary";
import { useCashForecast } from "@/modules/budgetFamiliar/hooks/useCashForecast";
import { useWalletSummary } from "@/modules/wallet/hooks/useWalletSummary";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

export default function Dashboard() {
  const { flags } = useFeatureFlags();
  const budget = useBudgetFamiliarSummary();
  const cashForecast = useCashForecast();
  const wallet = useWalletSummary();
  const { CASH_FORECAST } = flags;
  const cashForecastEnabled = CASH_FORECAST;
  const riskLabel = {
    low: "Baixo",
    medium: "Médio",
    high: "Alto",
  }[cashForecast.riskLevel];
  const riskClass = {
    low: "text-success",
    medium: "text-warning",
    high: "text-destructive",
  }[cashForecast.riskLevel];

  return (
    <main className="container mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Hero */}
      <div className="financial-card financial-card--wallet">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-primary/20 rounded-xl">
            <TrendingUp className="w-5 h-5 md:h-8 md:w-8 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-balance break-words text-2xl font-semibold leading-tight sm:text-3xl">
              SuperPlanejador
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Controle sua carteira de investimentos e orçamento familiar
            </p>
          </div>
        </div>
      </div>

      {/* Cards de acesso rápido */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Carteira */}
        <Link to="/wallet" className="block h-full">
          <Card className="h-full cursor-pointer transition-transform hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center space-y-0 pb-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg mr-3">
                <Wallet className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Carteira de Investimentos</CardTitle>
                <CardDescription>Gerencie FIIs, ações e acompanhe seus rendimentos</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex-1 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="min-w-0">
                  <div className="kpi-label">Valor Total</div>
                  <div className="kpi-value break-words leading-tight">
                    {formatCurrency(wallet.totalValue)}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="kpi-label">Rendimento/Mês</div>
                  <div className="kpi-value text-success break-words leading-tight">
                    {formatCurrency(wallet.monthlyYield)}
                  </div>
                </div>
              </div>
              
            </CardContent>
          </Card>
        </Link>

        {/* Orçamento Familiar Completo */}
        <Link to="/budget-familiar" className="block h-full">
          <Card className="h-full cursor-pointer transition-transform hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center space-y-0 pb-3">
              <div className="p-2 bg-primary/20 rounded-lg mr-3">
                <ClipboardList className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Orçamento Familiar Completo</CardTitle>
                <CardDescription>Fluxo completo com receitas, despesas fixas e variáveis</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm text-muted-foreground break-words">
                Controle mensal com parcelamentos, recorrência e visão anual. Receitas{" "}
                {formatCurrency(budget.incomeTotal)} · Despesas{" "}
                {formatCurrency(budget.expenseTotal)}.
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Lista de Compras */}
        <Link to="/shopping" className="block h-full">
          <Card className="h-full cursor-pointer transition-transform hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center space-y-0 pb-3">
              <div className="p-2 bg-amber-500/20 rounded-lg mr-3">
                <ShoppingBasket className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Lista de Compras</CardTitle>
                <CardDescription>Organize itens e controle o carrinho/compra</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm text-muted-foreground">Clique para ir à sua lista de compras.</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Resumo Financeiro */}
      <div className="financial-card">
        <h2 className="text-xl font-semibold mb-4">Resumo Financeiro</h2>
        <div className="kpi-grid">
          <div className="kpi-card min-w-0">
            <div className="kpi-label">Patrimônio Total</div>
            <div className="kpi-value text-primary break-words leading-tight">
              {formatCurrency(wallet.totalValue)}
            </div>
          </div>
          <div className="kpi-card min-w-0">
            <div className="kpi-label">Renda Passiva</div>
            <div className="kpi-value text-success break-words leading-tight">
              {formatCurrency(wallet.monthlyYield)}
            </div>
          </div>
          <div className="kpi-card min-w-0">
            <div className="kpi-label">Gastos Mensais</div>
            <div className="kpi-value text-warning break-words leading-tight">
              {formatCurrency(budget.expenseTotal)}
            </div>
          </div>
          <div className="kpi-card min-w-0">
            <div className="kpi-label">Saldo Livre</div>
            <div className="kpi-value break-words leading-tight">
              {formatCurrency(budget.balanceTotal)}
            </div>
          </div>
        </div>
      </div>

      {cashForecastEnabled ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Goal className="h-5 w-5 text-primary" />
                Forecast de caixa
              </CardTitle>
              <CardDescription>Projeções automáticas com base nos saldos planejados.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Próximos 30 dias</span>
                <span className="font-semibold text-primary">
                  {formatCurrency(cashForecast.projectedBalance30d)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Risco de caixa</span>
                <span className={`font-semibold ${riskClass}`}>{riskLabel}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </main>
  );
}
