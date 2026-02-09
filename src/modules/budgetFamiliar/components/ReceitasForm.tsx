import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Receita, ReceitaInput } from "@/modules/budgetFamiliar/hooks/useBudgetFamiliar";
import { normalizeDateInput } from "@/modules/budgetFamiliar/utils/format";

type Props = {
  onSave: (data: ReceitaInput) => void;
  editing?: Receita | null;
  onCancel?: () => void;
  disabled?: boolean;
};

type ReceitaFormState = Omit<ReceitaInput, "valor"> & { valor: string };

const defaultForm: ReceitaFormState = {
  data: "",
  fonte: "",
  tipo: "Fixa",
  valor: "",
};

const receitaSugestoes = [
  "Salário CLT",
  "13º salário",
  "Férias + 1/3",
  "Horas extras",
  "Adicionais (noturno, periculosidade, insalubridade)",
  "Comissões / bônus por meta",
  "Bicos / freelas",
  "Serviços autônomos",
  "Venda de produtos",
  "Diárias de trabalho informal",
  "Dividendos de ações",
  "Proventos de FIIs",
  "Juros de renda fixa (CDB, Tesouro, etc.)",
  "Rendimentos de poupança",
  "Juros sobre capital próprio",
  "Aluguel de imóvel",
  "Aluguel de sala comercial / ponto",
  "Aluguel de veículo / equipamento",
  "Aposentadoria / INSS",
  "Pensão alimentícia recebida",
  "Benefícios do governo",
  "Bolsa de estudos / pesquisa",
  "Restituição de imposto de renda",
  "Cashback recebido",
  "Prêmios / sorteios",
  "Venda de bens (carro, celular, móveis, etc.)",
  "Reembolso de empresa (viagens, combustível, etc.)",
];

export function ReceitasForm({ onSave, editing, onCancel, disabled }: Props) {
  const [form, setForm] = useState<ReceitaFormState>(defaultForm);
  const isDisabled = Boolean(disabled);

  useEffect(() => {
    if (editing) {
      setForm({
        data: normalizeDateInput(editing.data),
        fonte: editing.fonte,
        tipo: editing.tipo,
        valor: String(editing.valor ?? ""),
      });
      return;
    }
    setForm(defaultForm);
  }, [editing]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (isDisabled) return;
    onSave({ ...form, data: normalizeDateInput(form.data), valor: Number(form.valor) || 0 });
    if (editing) {
      onCancel?.();
      return;
    }
    setForm(defaultForm);
  };

  return (
    <Card className="financial-card p-4">
      <CardContent className="p-0">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label>Data</Label>
              <Input
                type="date"
                required
                value={form.data}
                onChange={(event) =>
                  setForm({ ...form, data: normalizeDateInput(event.target.value) })
                }
                disabled={isDisabled}
                className="bf-date-input"
              />
            </div>
            <div className="space-y-1">
              <Label>Fonte</Label>
              <Input
                type="text"
                required
                placeholder="Salário, freelance..."
                value={form.fonte}
                onChange={(event) => setForm({ ...form, fonte: event.target.value })}
                list="receita-sugestoes"
                disabled={isDisabled}
              />
              <datalist id="receita-sugestoes">
                {receitaSugestoes.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1">
              <Label>Tipo</Label>
              <Select
                value={form.tipo}
                onValueChange={(value) =>
                  setForm({ ...form, tipo: value as ReceitaInput["tipo"] })
                }
                disabled={isDisabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fixa">Fixa</SelectItem>
                  <SelectItem value="Variável">Variável</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Valor</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                required
                placeholder="0"
                value={form.valor}
                onChange={(event) => setForm({ ...form, valor: event.target.value })}
                disabled={isDisabled}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={isDisabled}>
              {editing ? "Salvar" : "Adicionar"}
            </Button>
            {editing ? (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
