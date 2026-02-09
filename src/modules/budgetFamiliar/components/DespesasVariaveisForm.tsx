import { useEffect, useId, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  DespesaVariavel,
  DespesaVariavelInput,
} from "@/modules/budgetFamiliar/hooks/useBudgetFamiliar";
import { normalizeDateInput } from "@/modules/budgetFamiliar/utils/format";

type Props = {
  onSave: (data: DespesaVariavelInput) => void;
  onSaveMany?: (items: DespesaVariavelInput[]) => void;
  editing?: DespesaVariavel | null;
  onCancel?: () => void;
  disabled?: boolean;
};

type DespesaVariavelFormState = Omit<DespesaVariavelInput, "valor"> & {
  valor: string;
  parcelas: string;
};

const defaultForm: DespesaVariavelFormState = {
  data: "",
  categoria: "",
  descricao: "",
  formaPagamento: "",
  valor: "",
  essencial: true,
  parcelas: "1",
};

const despesasVariaveisSugestoes = [
  "Supermercado / feira",
  "Padaria",
  "Refeições fora de casa",
  "Combustível",
  "Estacionamentos avulsos",
  "Pedágios",
  "Uber / 99 / táxi",
  "Cinema / shows / eventos",
  "Bares e restaurantes",
  "Viagens e passeios",
  "Aluguel de filme / pay-per-view",
  "Roupas e calçados",
  "Acessórios",
  "Cosméticos / maquiagem / perfumes",
  "Livros / games / eletrônicos pequenos",
  "Medicamentos",
  "Consultas particulares pontuais",
  "Exames esporádicos",
  "Terapia / psicólogo avulso",
  "Manutenção da casa",
  "Utensílios domésticos",
  "Móveis / decoração",
  "Produtos de limpeza",
  "Material escolar extra",
  "Passeios escolares",
  "Brinquedos",
  "Mesada / presentes",
  "Ração (pets)",
  "Pet shop / banho e tosa",
  "Veterinário",
  "Presentes (aniversário, datas especiais)",
  "Doações / ofertas",
  "Multas / taxas inesperadas",
  "Despesas emergenciais",
];

const paymentOptions = [
  "Cartão de crédito",
  "Cartão de débito",
  "Pix",
  "Dinheiro",
  "Boleto",
  "Transferência (TED/DOC)",
  "Outros",
];

const normalizePayment = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const isCreditCardPayment = (value: string) => {
  if (value === "Cartão de crédito") return true;
  const normalized = normalizePayment(value);
  return normalized.includes("cartao") && normalized.includes("credito");
};

const parseInputDate = (value: string) => {
  if (!value) return null;
  const parts = value.split("-").map(Number);
  if (parts.length === 3 && parts.every((n) => Number.isFinite(n))) {
    const [year, month, day] = parts;
    return new Date(year, month - 1, day);
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateInput = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const addMonthsToDate = (dateString: string, offset: number) => {
  const date = parseInputDate(dateString);
  if (!date) return dateString;
  const result = new Date(date.getFullYear(), date.getMonth() + offset, date.getDate());
  return formatDateInput(result);
};

export function DespesasVariaveisForm({
  onSave,
  onSaveMany,
  editing,
  onCancel,
  disabled,
}: Props) {
  const checkboxId = useId();
  const [form, setForm] = useState<DespesaVariavelFormState>(defaultForm);
  const [error, setError] = useState("");
  const isDisabled = Boolean(disabled);

  useEffect(() => {
    if (editing) {
      setForm({
        data: normalizeDateInput(editing.data),
        categoria: editing.categoria,
        descricao: editing.descricao,
        formaPagamento: editing.formaPagamento,
        valor: String(editing.valor ?? ""),
        essencial: editing.essencial,
        parcelas: "1",
      });
      return;
    }
    setForm(defaultForm);
  }, [editing]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (isDisabled) return;
    if (!form.formaPagamento.trim()) {
      setError("Selecione a forma de pagamento.");
      return;
    }
    const baseDate = normalizeDateInput(form.data);
    const total = Number(form.valor) || 0;
    const parcelas = Math.max(1, Math.floor(Number(form.parcelas) || 1));

    const payload: DespesaVariavelInput = {
      data: baseDate,
      categoria: form.categoria,
      descricao: form.descricao,
      formaPagamento: form.formaPagamento,
      valor: total,
      essencial: form.essencial,
    };

    const shouldParcel =
      !editing && parcelas > 1 && isCreditCardPayment(form.formaPagamento) && Boolean(onSaveMany);

    if (shouldParcel && onSaveMany) {
      const parcelaBase = Math.floor((total / parcelas) * 100) / 100;
      const items: DespesaVariavelInput[] = Array.from({ length: parcelas }, (_, index) => {
        const isLast = index === parcelas - 1;
        const valorParcela = isLast
          ? Number((total - parcelaBase * (parcelas - 1)).toFixed(2))
          : parcelaBase;

        return {
          ...payload,
          data: addMonthsToDate(baseDate, index),
          descricao: `${form.descricao} (Parcela ${index + 1}/${parcelas})`,
          valor: valorParcela,
        };
      });

      onSaveMany(items);
      setError("");
      setForm(defaultForm);
      return;
    }

    onSave(payload);
    setError("");

    if (editing) {
      onCancel?.();
      return;
    }

    setForm(defaultForm);
  };

  const showParcelasField = !editing && isCreditCardPayment(form.formaPagamento);

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
              <Label>Categoria</Label>
              <Input
                type="text"
                required
                placeholder="Ex: Supermercado, Transporte..."
                value={form.categoria}
                onChange={(event) => setForm({ ...form, categoria: event.target.value })}
                list="despesas-variaveis-sugestoes"
                disabled={isDisabled}
              />
            </div>
            <div className="space-y-1">
              <Label>Descrição</Label>
              <Input
                type="text"
                required
                value={form.descricao}
                onChange={(event) => setForm({ ...form, descricao: event.target.value })}
                list="despesas-variaveis-sugestoes"
                disabled={isDisabled}
              />
              <datalist id="despesas-variaveis-sugestoes">
                {despesasVariaveisSugestoes.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1">
              <Label>Forma de pagamento</Label>
              <Select
                value={form.formaPagamento}
                onValueChange={(value) => {
                  setForm({ ...form, formaPagamento: value });
                  if (error) setError("");
                }}
                disabled={isDisabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {paymentOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
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
            {showParcelasField ? (
              <div className="space-y-1">
                <Label>Parcelas</Label>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  required
                  value={form.parcelas}
                  onChange={(event) => setForm({ ...form, parcelas: event.target.value })}
                  disabled={isDisabled}
                />
              </div>
            ) : null}
            <div className="flex items-center gap-2 md:col-span-2">
              <Checkbox
                id={checkboxId}
                checked={form.essencial}
                onCheckedChange={(value) => setForm({ ...form, essencial: value === true })}
                disabled={isDisabled}
              />
              <Label htmlFor={checkboxId}>Essencial?</Label>
            </div>
          </div>

          {error ? <p className="text-xs text-destructive">{error}</p> : null}

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
