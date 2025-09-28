import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Calculator, TrendingUp, TrendingDown, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BudgetItem {
  id: string;
  categoria: string;
  planejado: number;
  realizado: number;
}

const BudgetManager = () => {
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [newItem, setNewItem] = useState<Partial<BudgetItem>>({
    categoria: "",
    planejado: 0,
    realizado: 0,
  });
  const { toast } = useToast();

  // Categorias pré-definidas
  const categoriasSugestoes = [
    "Salário", "Freelances", "Investimentos", "Outros Rendimentos", // Receitas
    "Moradia", "Alimentação", "Transporte", "Saúde", "Educação",   // Despesas essenciais
    "Lazer", "Roupas", "Investimentos", "Emergência", "Outros"     // Outras despesas
  ];

  // Carregar dados do mês atual
  useEffect(() => {
    const savedData = localStorage.getItem(`sp_budget_${currentMonth}`);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setItems(parsed || []);
      } catch (error) {
        console.error("Erro ao carregar orçamento:", error);
        setItems([]);
      }
    } else {
      setItems([]);
    }
  }, [currentMonth]);

  // Salvar dados automaticamente
  useEffect(() => {
    localStorage.setItem(`sp_budget_${currentMonth}`, JSON.stringify(items));
  }, [items, currentMonth]);

  // Cálculos
  const totals = items.reduce(
    (acc, item) => {
      // Considera positivo = receita, negativo = despesa
      if (item.planejado >= 0) {
        acc.receitasPlanejadas += item.planejado;
        acc.receitasRealizadas += Math.max(0, item.realizado);
      } else {
        acc.despesasPlanejadas += Math.abs(item.planejado);
        acc.despesasRealizadas += Math.abs(Math.min(0, item.realizado));
      }
      
      acc.saldoPlanejado = acc.receitasPlanejadas - acc.despesasPlanejadas;
      acc.saldoRealizado = acc.receitasRealizadas - acc.despesasRealizadas;
      
      return acc;
    },
    {
      receitasPlanejadas: 0,
      receitasRealizadas: 0,
      despesasPlanejadas: 0,
      despesasRealizadas: 0,
      saldoPlanejado: 0,
      saldoRealizado: 0,
    }
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const addItem = () => {
    if (!newItem.categoria?.trim()) {
      toast({
        title: "Erro",
        description: "Categoria é obrigatória",
        variant: "destructive"
      });
      return;
    }

    const item: BudgetItem = {
      id: Date.now().toString(),
      categoria: newItem.categoria.trim(),
      planejado: Number(newItem.planejado) || 0,
      realizado: Number(newItem.realizado) || 0,
    };

    setItems(prev => [...prev, item]);
    setNewItem({
      categoria: "",
      planejado: 0,
      realizado: 0,
    });

    toast({
      title: "Sucesso",
      description: `${item.categoria} adicionado ao orçamento`,
    });
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    toast({
      title: "Item removido",
      description: "Item removido do orçamento",
    });
  };

  const updateItem = (id: string, field: keyof BudgetItem, value: any) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const exportToCSV = () => {
    const headers = ["Categoria", "Planejado", "Realizado", "Saldo", "Status"];
    const rows = items.map(item => {
      const saldo = item.planejado - Math.abs(item.realizado);
      const status = saldo >= 0 ? "Dentro do orçamento" : "Acima do orçamento";
      return [
        item.categoria,
        item.planejado.toFixed(2),
        item.realizado.toFixed(2),
        saldo.toFixed(2),
        status
      ];
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `orcamento_${currentMonth}.csv`);
    link.click();
    URL.revokeObjectURL(url);
  };

  const getMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("pt-BR", { year: "numeric", month: "long" });
  };

  return (
    <div className="space-y-6">
      {/* Header com seletor de mês */}
      <Card className="financial-card--budget">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Calculator className="h-5 w-5 mr-2" />
              Orçamento Familiar
            </CardTitle>
            <CardDescription>
              Controle suas finanças mensais - {getMonthName(currentMonth)}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-4">
            <div>
              <Label>Mês</Label>
              <Input
                type="month"
                value={currentMonth}
                onChange={(e) => setCurrentMonth(e.target.value)}
                className="input-financial w-40"
              />
            </div>
            <Button
              onClick={exportToCSV}
              variant="outline"
              size="sm"
              className="btn-financial--ghost"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* KPIs */}
      <div className="kpi-grid">
        <Card className="kpi-card">
          <CardContent className="p-4">
            <div className="kpi-label">Receitas (Planejado)</div>
            <div className="kpi-value text-success">{formatCurrency(totals.receitasPlanejadas)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Realizado: {formatCurrency(totals.receitasRealizadas)}
            </div>
          </CardContent>
        </Card>
        
        <Card className="kpi-card">
          <CardContent className="p-4">
            <div className="kpi-label">Despesas (Planejado)</div>
            <div className="kpi-value text-destructive">{formatCurrency(totals.despesasPlanejadas)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Realizado: {formatCurrency(totals.despesasRealizadas)}
            </div>
          </CardContent>
        </Card>
        
        <Card className="kpi-card">
          <CardContent className="p-4">
            <div className="kpi-label">Saldo (Planejado)</div>
            <div className={`kpi-value ${totals.saldoPlanejado >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(totals.saldoPlanejado)}
            </div>
          </CardContent>
        </Card>
        
        <Card className="kpi-card">
          <CardContent className="p-4">
            <div className="kpi-label">Saldo (Realizado)</div>
            <div className={`kpi-value ${totals.saldoRealizado >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(totals.saldoRealizado)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Adicionar Item */}
        <Card className="financial-card lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="h-5 w-5 mr-2" />
              Nova Categoria
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Categoria</Label>
              <Input
                value={newItem.categoria || ""}
                onChange={(e) => setNewItem(prev => ({ ...prev, categoria: e.target.value }))}
                placeholder="Ex: Alimentação"
                className="input-financial"
              />
              
              {/* Sugestões de categorias */}
              <div className="flex flex-wrap gap-1 mt-2">
                {categoriasSugestoes.map((cat, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/20 text-xs"
                    onClick={() => setNewItem(prev => ({ ...prev, categoria: cat }))}
                  >
                    {cat}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>Valor Planejado (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={newItem.planejado || ""}
                onChange={(e) => setNewItem(prev => ({ ...prev, planejado: Number(e.target.value) }))}
                placeholder="Positivo = receita, Negativo = despesa"
                className="input-financial"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use valores positivos para receitas e negativos para despesas
              </p>
            </div>

            <div>
              <Label>Valor Realizado (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={newItem.realizado || ""}
                onChange={(e) => setNewItem(prev => ({ ...prev, realizado: Number(e.target.value) }))}
                className="input-financial"
              />
            </div>

            <Button onClick={addItem} className="w-full btn-financial--primary">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Categoria
            </Button>
          </CardContent>
        </Card>

        {/* Lista do orçamento */}
        <Card className="financial-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Orçamento Detalhado
            </CardTitle>
            <CardDescription>{items.length} categorias</CardDescription>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma categoria ainda</p>
                <p className="text-sm">Adicione categorias para controlar seu orçamento</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Categoria</th>
                      <th>Planejado</th>
                      <th>Realizado</th>
                      <th>Saldo</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => {
                      const saldo = item.planejado - Math.abs(item.realizado);
                      const isReceita = item.planejado >= 0;
                      const status = isReceita 
                        ? item.realizado >= item.planejado ? "Meta atingida" : "Abaixo da meta"
                        : saldo >= 0 ? "Dentro do orçamento" : "Acima do orçamento";
                      
                      return (
                        <tr key={item.id}>
                          <td>
                            <div className="flex items-center">
                              {isReceita ? (
                                <TrendingUp className="h-4 w-4 text-success mr-2" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-destructive mr-2" />
                              )}
                              {item.categoria}
                            </div>
                          </td>
                          <td>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.planejado}
                              onChange={(e) => updateItem(item.id, "planejado", Number(e.target.value))}
                              className="w-28 h-8 text-xs"
                            />
                          </td>
                          <td>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.realizado}
                              onChange={(e) => updateItem(item.id, "realizado", Number(e.target.value))}
                              className="w-28 h-8 text-xs"
                            />
                          </td>
                          <td className={saldo >= 0 ? "text-success" : "text-destructive"}>
                            {formatCurrency(saldo)}
                          </td>
                          <td>
                            <Badge
                              variant={
                                isReceita
                                  ? item.realizado >= item.planejado ? "default" : "secondary"
                                  : saldo >= 0 ? "default" : "destructive"
                              }
                              className="text-xs"
                            >
                              {status}
                            </Badge>
                          </td>
                          <td>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(item.id)}
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BudgetManager;