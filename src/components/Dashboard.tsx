import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Wallet,
  Calculator,
  ShoppingBasket,
  PieChart,
  BarChart3,
  Cloud,
  Goal,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import FeatureLock from "@/components/FeatureLock";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { usePremiumAccess } from "@/hooks/usePremiumAccess";
import { useAuth } from "@/hooks/useAuth";
import { useEntitlements } from "@/hooks/useEntitlements";

export default function Dashboard() {
  const { flags } = useFeatureFlags();
  const { allowed: premiumAllowed, loading: premiumLoading } = usePremiumAccess();
  const { user } = useAuth();
  const { effectiveTier, trialExpiresAt } = useEntitlements();
  const trialActive = effectiveTier === "trial";
  const trialExpiryLabel =
    trialActive && trialExpiresAt
      ? new Date(trialExpiresAt).toLocaleDateString()
      : null;
  const trialMessage = `Teste gratuito ativo até ${trialExpiryLabel ?? "o fim do período"}.`;
  const { OPEN_FINANCE, CASH_FORECAST, MULTI_PROFILE } = flags;
  const openFinanceEnabled = premiumAllowed || OPEN_FINANCE;
  const cashForecastEnabled = premiumAllowed || CASH_FORECAST;
  const multiProfileEnabled = premiumAllowed || MULTI_PROFILE;
  const openFinanceLockDescription = trialActive
    ? trialMessage
    : "Conecte contas bancárias e sincronize ativos liberando o plano Pro.";
  const cashForecastLockDescription = trialActive
    ? trialMessage
    : "Ative projeções semanais e alertas liberando o plano Premium.";
  const multiProfileLockDescription = trialActive
    ? trialMessage
    : "Disponível no plano Premium para contas familiares e squads.";

  useEffect(() => {
    if (premiumLoading) return;
    if (openFinanceEnabled && cashForecastEnabled && multiProfileEnabled) return;

    console.warn("[Dashboard] feature gate ativo", {
      userId: user?.id ?? null,
      plan: effectiveTier,
      trialEndsAt: trialExpiresAt,
      now: new Date().toISOString(),
      gates: {
        openFinanceLocked: !openFinanceEnabled,
        cashForecastLocked: !cashForecastEnabled,
        multiProfileLocked: !multiProfileEnabled,
      },
    });
  }, [
    premiumLoading,
    openFinanceEnabled,
    cashForecastEnabled,
    multiProfileEnabled,
    user?.id,
    effectiveTier,
    trialExpiresAt,
  ]);

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
            <CardContent className="flex items-center gap-4">
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div>
                  <div className="kpi-label">Valor Total</div>
                  <div className="kpi-value">R$ 0,00</div>
                </div>
                <div>
                  <div className="kpi-label">Rendimento/Mês</div>
                  <div className="kpi-value text-success">R$ 0,00</div>
                </div>
              </div>
              <PieChart className="h-12 w-12 text-emerald-400/60" />
            </CardContent>
          </Card>
        </Link>

        {/* Orçamento */}
        <Link to="/budget" className="block h-full">
          <Card className="h-full cursor-pointer transition-transform hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center space-y-0 pb-3">
              <div className="p-2 bg-cyan-500/20 rounded-lg mr-3">
                <Calculator className="h-6 w-6 text-cyan-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Orçamento Familiar</CardTitle>
                <CardDescription>Planeje e controle suas despesas mensais</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div>
                  <div className="kpi-label">Receitas</div>
                  <div className="kpi-value text-success">R$ 0,00</div>
                </div>
                <div>
                  <div className="kpi-label">Despesas</div>
                  <div className="kpi-value text-destructive">R$ 0,00</div>
                </div>
              </div>
              <BarChart3 className="h-12 w-12 text-cyan-400/60" />
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
          <div className="kpi-card">
            <div className="kpi-label">Patrimônio Total</div>
            <div className="kpi-value text-primary">R$ 0,00</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Renda Passiva</div>
            <div className="kpi-value text-success">R$ 0,00</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Gastos Mensais</div>
            <div className="kpi-value text-warning">R$ 0,00</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Saldo Livre</div>
            <div className="kpi-value">R$ 0,00</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {openFinanceEnabled ? (
          <Card className="h-full">
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="h-5 w-5 text-primary" />
                  Open Finance conectado
                </CardTitle>
                <CardDescription>Sincronize bancos e atualize a carteira automaticamente.</CardDescription>
              </div>
              <Badge variant="secondary" className="text-xs uppercase">Beta</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Importações e consolidação de contas ativas com reconciliação diária.
              </p>
              <Button asChild size="sm">
                <Link to="/wallet">Ver integrações</Link>
              </Button>
            </CardContent>
          </Card>
        ) : premiumLoading ? null : (
          <FeatureLock
            title="Integrações Open Finance"
            description={openFinanceLockDescription}
          />
        )}

        {cashForecastEnabled ? (
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
                <span className="font-semibold text-primary">R$ 0,00</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Risco de caixa</span>
                <span className="font-semibold text-success">Baixo</span>
              </div>
            </CardContent>
          </Card>
        ) : premiumLoading ? null : (
          <FeatureLock
            title="Forecast de caixa"
            description={cashForecastLockDescription}
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {multiProfileEnabled ? (
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UsersRound className="h-5 w-5 text-primary" />
                Perfis familiares
              </CardTitle>
              <CardDescription>Gerencie finanças pessoais em perfis separados.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Compartilhe carteiras e metas com convidados ou clientes.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link to="/profile">Ir para perfis</Link>
              </Button>
            </CardContent>
          </Card>
        ) : premiumLoading ? null : (
          <FeatureLock
            title="Multi perfis"
            description={multiProfileLockDescription}
          />
        )}
      </div>
    </main>
  );
}
