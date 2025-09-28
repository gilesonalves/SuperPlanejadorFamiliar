import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, TrendingUp, DollarSign, Percent, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WalletItem {
  id: string;
  classe: "FII" | "ACAO";
  ticker: string;
  nome: string;
  setor: string;
  quantidade: number;
  preco: number;
  dyMensal: number;
}

const WalletManager = () => {
  const [items, setItems] = useState<WalletItem[]>([]);
  const [newItem, setNewItem] = useState<Partial<WalletItem>>({
    classe: "FII",
    ticker: "",
    nome: "",
    setor: "",
    quantidade: 0,
    preco: 0,
    dyMensal: 0,
  });
  const [targetAllocation, setTargetAllocation] = useState({ fii: 70, acao: 30 });
  const [budget, setBudget] = useState(150);
  const { toast } = useToast();

  // Presets populares
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
    ]
  };

  // Carregar dados salvos
  useEffect(() => {
    const savedData = localStorage.getItem("sp_wallet_data");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setItems(parsed.items || []);
        setTargetAllocation(parsed.targetAllocation || { fii: 70, acao: 30 });
        setBudget(parsed.budget || 150);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    }
  }, []);

  // Salvar dados
  useEffect(() => {
    localStorage.setItem("sp_wallet_data", JSON.stringify({
      items,
      targetAllocation,
      budget
    }));
  }, [items, targetAllocation, budget]);

  // Cálculos
  const totals = items.reduce(
    (acc, item) => {
      const valor = item.quantidade * item.preco;
      const dividendos = valor * (item.dyMensal / 100);
      
      acc.valor += valor;
      acc.dividendos += dividendos;
      
      if (item.classe === "FII") {
        acc.fii += valor;
      } else {
        acc.acao += valor;
      }
      
      return acc;
    },
    { valor: 0, dividendos: 0, fii: 0, acao: 0 }
  );

  const allocations = {
    fiiPct: totals.valor > 0 ? (totals.fii / totals.valor) * 100 : 0,
    acaoPct: totals.valor > 0 ? (totals.acao / totals.valor) * 100 : 0,
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const addItem = () => {
    if (!newItem.ticker?.trim()) {
      toast({
        title: "Erro",
        description: "Ticker é obrigatório",
        variant: "destructive"
      });
      return;
    }

    const item: WalletItem = {
      id: Date.now().toString(),
      classe: newItem.classe as "FII" | "ACAO",
      ticker: newItem.ticker.toUpperCase().trim(),
      nome: newItem.nome || "",
      setor: newItem.setor || "",
      quantidade: Number(newItem.quantidade) || 0,
      preco: Number(newItem.preco) || 0,
      dyMensal: Number(newItem.dyMensal) || 0,
    };

    setItems(prev => [...prev, item]);
    setNewItem({
      classe: "FII",
      ticker: "",
      nome: "",
      setor: "",
      quantidade: 0,
      preco: 0,
      dyMensal: 0,
    });

    toast({
      title: "Sucesso",
      description: `${item.ticker} adicionado à carteira`,
    });
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    toast({
      title: "Item removido",
      description: "Item removido da carteira",
    });
  };

  const updateItem = (id: string, field: keyof WalletItem, value: any) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const fillFromPreset = (preset: any) => {
    setNewItem(prev => ({
      ...prev,
      ticker: preset.ticker,
      nome: preset.nome,
      setor: preset.setor,
    }));
  };

  const exportToCSV = () => {
    const headers = ["Classe", "Ticker", "Nome", "Setor", "Quantidade", "Preço", "DY Mensal", "Dividendos/Mês", "Valor Total"];
    const rows = items.map(item => [
      item.classe,
      item.ticker,
      item.nome,
      item.setor,
      item.quantidade.toString(),
      item.preco.toString(),
      item.dyMensal.toString(),
      (item.quantidade * item.preco * (item.dyMensal / 100)).toFixed(2),
      (item.quantidade * item.preco).toFixed(2)
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "carteira_investimentos.csv");
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
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
              <span className="text-sm text-muted-foreground ml-2">
                ({formatCurrency(totals.fii)})
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="kpi-card">
          <CardContent className="p-4">
            <div className="kpi-label">Ações</div>
            <div className="kpi-value">
              {allocations.acaoPct.toFixed(1)}%
              <span className="text-sm text-muted-foreground ml-2">
                ({formatCurrency(totals.acao)})
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configurações */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="financial-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Configurações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Orçamento de Aporte (R$)</Label>
              <Input
                type="number"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="input-financial"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Meta FIIs (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={targetAllocation.fii}
                  onChange={(e) => setTargetAllocation(prev => ({ 
                    ...prev, 
                    fii: Number(e.target.value),
                    acao: 100 - Number(e.target.value)
                  }))}
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
                  onChange={(e) => setTargetAllocation(prev => ({ 
                    ...prev, 
                    acao: Number(e.target.value),
                    fii: 100 - Number(e.target.value)
                  }))}
                  className="input-financial"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Adicionar Item */}
        <Card className="financial-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="h-5 w-5 mr-2" />
              Adicionar Investimento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Classe</Label>
                <Select value={newItem.classe} onValueChange={(value: "FII" | "ACAO") => setNewItem(prev => ({ ...prev, classe: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FII">FII</SelectItem>
                    <SelectItem value="ACAO">AÇÃO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Ticker</Label>
                <Input
                  value={newItem.ticker || ""}
                  onChange={(e) => setNewItem(prev => ({ ...prev, ticker: e.target.value }))}
                  placeholder="Ex: XPML11"
                  className="input-financial"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome</Label>
                <Input
                  value={newItem.nome || ""}
                  onChange={(e) => setNewItem(prev => ({ ...prev, nome: e.target.value }))}
                  className="input-financial"
                />
              </div>
              
              <div>
                <Label>Setor</Label>
                <Input
                  value={newItem.setor || ""}
                  onChange={(e) => setNewItem(prev => ({ ...prev, setor: e.target.value }))}
                  className="input-financial"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  value={newItem.quantidade || ""}
                  onChange={(e) => setNewItem(prev => ({ ...prev, quantidade: Number(e.target.value) }))}
                  className="input-financial"
                />
              </div>
              
              <div>
                <Label>Preço (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newItem.preco || ""}
                  onChange={(e) => setNewItem(prev => ({ ...prev, preco: Number(e.target.value) }))}
                  className="input-financial"
                />
              </div>
              
              <div>
                <Label>DY Mensal (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newItem.dyMensal || ""}
                  onChange={(e) => setNewItem(prev => ({ ...prev, dyMensal: Number(e.target.value) }))}
                  className="input-financial"
                />
              </div>
            </div>

            {/* Presets */}
            <div>
              <Label>Presets Populares</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {presets[newItem.classe as keyof typeof presets]?.map((preset, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/20"
                    onClick={() => fillFromPreset(preset)}
                  >
                    {preset.ticker}
                  </Badge>
                ))}
              </div>
            </div>

            <Button onClick={addItem} className="w-full btn-financial--primary">
              <Plus className="h-4 w-4 mr-2" />
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
              <TrendingUp className="h-5 w-5 mr-2" />
              Carteira de Investimentos
            </CardTitle>
            <CardDescription>{items.length} investimentos</CardDescription>
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
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Sua carteira está vazia</p>
              <p className="text-sm">Adicione alguns investimentos para começar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Classe</th>
                    <th>Ticker</th>
                    <th>Nome</th>
                    <th>Setor</th>
                    <th>Qtd</th>
                    <th>Preço</th>
                    <th>DY Mensal</th>
                    <th>Div/Mês</th>
                    <th>Valor Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const valor = item.quantidade * item.preco;
                    const dividendos = valor * (item.dyMensal / 100);
                    
                    return (
                      <tr key={item.id}>
                        <td>
                          <Badge variant={item.classe === "FII" ? "default" : "secondary"}>
                            {item.classe}
                          </Badge>
                        </td>
                        <td className="font-mono font-medium">{item.ticker}</td>
                        <td>{item.nome}</td>
                        <td>{item.setor}</td>
                        <td>
                          <Input
                            type="number"
                            value={item.quantidade}
                            onChange={(e) => updateItem(item.id, "quantidade", Number(e.target.value))}
                            className="w-20 h-8 text-xs"
                          />
                        </td>
                        <td>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.preco}
                            onChange={(e) => updateItem(item.id, "preco", Number(e.target.value))}
                            className="w-24 h-8 text-xs"
                          />
                        </td>
                        <td>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.dyMensal}
                            onChange={(e) => updateItem(item.id, "dyMensal", Number(e.target.value))}
                            className="w-20 h-8 text-xs"
                          />
                        </td>
                        <td className="text-success font-medium">{formatCurrency(dividendos)}</td>
                        <td className="font-medium">{formatCurrency(valor)}</td>
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
  );
};

export default WalletManager;