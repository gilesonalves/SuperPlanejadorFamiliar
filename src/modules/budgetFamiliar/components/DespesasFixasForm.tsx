import { useEffect, useId, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  DespesaFixa,
  DespesaFixaInput,
} from "@/modules/budgetFamiliar/hooks/useBudgetFamiliar";
import { normalizeDateInput } from "@/modules/budgetFamiliar/utils/format";

type Props = {
  onSave: (data: DespesaFixaInput) => void;
  editing?: DespesaFixa | null;
  onCancel?: () => void;
  disabled?: boolean;
};

type DespesaFixaFormState = Omit<DespesaFixaInput, "valorPrevisto" | "valorPago"> & {
  valorPrevisto: string;
  valorPago: string;
};

const defaultForm: DespesaFixaFormState = {
  dataVencimento: "",
  conta: "",
  categoria: "",
  valorPrevisto: "",
  valorPago: "",
  recorrente: false,
};

const despesasFixasSugestoes = [
  "Aluguel",
  "Prestação do imóvel / financiamento",
  "Condomínio",
  "IPTU (rateado)",
  "Seguro residencial",
  "Energia elétrica",
  "Água / esgoto",
  "Gás encanado",
  "Internet banda larga",
  "Telefone fixo",
  "Coleta de lixo",
  "Parcela do carro / moto",
  "Seguro do veículo",
  "IPVA (rateado)",
  "Estacionamento mensal",
  "Passe de transporte mensal",
  "Mensalidade escolar",
  "Faculdade / pós / curso técnico",
  "Curso de idiomas",
  "Curso preparatório",
  "Plano de saúde",
  "Plano odontológico",
  "Seguro de vida",
  "Parcelas de empréstimo pessoal",
  "Parcelas de consórcio / financiamento",
  "Parcelas de cartão de crédito",
  "Streaming de vídeo",
  "Streaming de música",
  "Assinatura de software",
  "Academia / plano fitness",
  "Clube / associação / sindicato",
  "Serviços de nuvem (Google One, iCloud, etc.)",
];

export function DespesasFixasForm({ onSave, editing, onCancel, disabled }: Props) {
  const checkboxId = useId();
  const [form, setForm] = useState<DespesaFixaFormState>(defaultForm);
  const isDisabled = Boolean(disabled);

  useEffect(() => {
    if (editing) {
      setForm({
        dataVencimento: normalizeDateInput(editing.dataVencimento),
        conta: editing.conta,
        categoria: editing.categoria,
        valorPrevisto: String(editing.valorPrevisto ?? ""),
        valorPago: String(editing.valorPago ?? ""),
        recorrente: editing.recorrente,
      });
      return;
    }
    setForm(defaultForm);
  }, [editing]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (isDisabled) return;
    onSave({
      ...form,
      dataVencimento: normalizeDateInput(form.dataVencimento),
      valorPrevisto: Number(form.valorPrevisto) || 0,
      valorPago: Number(form.valorPago) || 0,
    });
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
              <Label>Vencimento</Label>
              <Input
                type="date"
                required
                value={form.dataVencimento}
                onChange={(event) =>
                  setForm({
                    ...form,
                    dataVencimento: normalizeDateInput(event.target.value),
                  })
                }
                disabled={isDisabled}
                className="bf-date-input"
              />
            </div>
            <div className="space-y-1">
              <Label>Conta</Label>
              <Input
                type="text"
                required
                placeholder="Aluguel, Luz, Internet..."
                value={form.conta}
                onChange={(event) => setForm({ ...form, conta: event.target.value })}
                list="despesas-fixas-sugestoes"
                disabled={isDisabled}
              />
            </div>
            <div className="space-y-1">
              <Label>Categoria</Label>
              <Input
                type="text"
                placeholder="Moradia, contas, etc."
                value={form.categoria}
                onChange={(event) => setForm({ ...form, categoria: event.target.value })}
                list="despesas-fixas-sugestoes"
                disabled={isDisabled}
              />
              <datalist id="despesas-fixas-sugestoes">
                {despesasFixasSugestoes.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1">
              <Label>Valor previsto</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                required
                placeholder="0"
                value={form.valorPrevisto}
                onChange={(event) => setForm({ ...form, valorPrevisto: event.target.value })}
                disabled={isDisabled}
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label>Valor pago</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                placeholder="0"
                value={form.valorPago}
                onChange={(event) => setForm({ ...form, valorPago: event.target.value })}
                disabled={isDisabled}
              />
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <Checkbox
                id={checkboxId}
                checked={form.recorrente}
                onCheckedChange={(value) =>
                  setForm({ ...form, recorrente: value === true })
                }
                disabled={isDisabled}
              />
              <Label htmlFor={checkboxId}>Repetir automaticamente nos próximos meses</Label>
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
