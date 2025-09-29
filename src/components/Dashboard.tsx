import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Wallet, Calculator, PieChart, BarChart3, ShoppingBasket } from "lucide-react";
import WalletManager from "./WalletManager";
import BudgetManager from "./BudgetManager";
import { Link } from "react-router-dom";

type DashboardProps = { initialTab?: "overview" | "wallet" | "budget" };

const Dashboard = ({ initialTab = "overview" }: DashboardProps) => {
  const [activeTab, setActiveTab] = useState<"overview" | "wallet" | "budget">(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const renderContent = () => {
    switch (activeTab) {
      case "wallet":
        return <WalletManager />;
      case "budget":
        return <BudgetManager />;
      default:
        return (
          <div className="space-y-6">
            {/* Hero Section */}
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

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card 
                className="financial-card--wallet cursor-pointer hover:scale-[1.02] transition-transform"
                onClick={() => setActiveTab("wallet")}
              >
                <CardHeader className="flex flex-row items-center space-y-0 pb-3">
                  <div className="p-2 bg-emerald-500/20 rounded-lg mr-3">
                    <Wallet className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Carteira de Investimentos</CardTitle>
                    <CardDescription>
                      Gerencie FIIs, ações e acompanhe seus rendimentos
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <div className="kpi-grid">
                        <div>
                          <div className="kpi-label">Valor Total</div>
                          <div className="kpi-value text-lg">R$ 0,00</div>
                        </div>
                        <div>
                          <div className="kpi-label">Rendimento/Mês</div>
                          <div className="kpi-value text-lg text-success">R$ 0,00</div>
                        </div>
                      </div>
                    </div>
                    <PieChart className="h-12 w-12 text-emerald-400/60" />
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="financial-card--budget cursor-pointer hover:scale-[1.02] transition-transform"
                onClick={() => setActiveTab("budget")}
              >
                <CardHeader className="flex flex-row items-center space-y-0 pb-3">
                  <div className="p-2 bg-cyan-500/20 rounded-lg mr-3">
                    <Calculator className="h-6 w-6 text-cyan-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Orçamento Familiar</CardTitle>
                    <CardDescription>
                      Planeje e controle suas despesas mensais
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <div className="kpi-grid">
                        <div>
                          <div className="kpi-label">Receitas</div>
                          <div className="kpi-value text-lg text-success">R$ 0,00</div>
                        </div>
                        <div>
                          <div className="kpi-label">Despesas</div>
                          <div className="kpi-value text-lg text-destructive">R$ 0,00</div>
                        </div>
                      </div>
                    </div>
                    <BarChart3 className="h-12 w-12 text-cyan-400/60" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
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
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary/20 rounded-lg">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">SuperPlanejador</h1>
                <p className="text-xs text-muted-foreground">Planejamento Financeiro</p>
              </div>
            </div>
            
            <nav className="flex flex-wrap gap-2 sm:justify-end">
              <Link to="/shopping">
                <Button variant="ghost" size="sm" className="btn-financial">
                  <ShoppingBasket className="mr-2 h-4 w-4" />
                  Lista de Compras
                </Button>
              </Link>
              <Button
                variant={activeTab === "overview" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("overview")}
                className="btn-financial"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Resumo
              </Button>
              <Button
                variant={activeTab === "wallet" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("wallet")}
                className="btn-financial"
              >
                <Wallet className="h-4 w-4 mr-2" />
                Carteira
              </Button>
              <Button
                variant={activeTab === "budget" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("budget")}
                className="btn-financial"
              >
                <Calculator className="h-4 w-4 mr-2" />
                Orçamento
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default Dashboard;