import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Wallet, Calculator, ShoppingBasket, PieChart, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <main className="container mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Hero */}
      <div className="financial-card financial-card--wallet">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-primary/20 rounded-xl">
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">SuperPlanejador</h1>
            <p className="text-muted-foreground">
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
              <p className="text-sm text-muted-foreground">
                Clique para ir à sua lista de compras.
              </p>
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
    </main>
  );
}
