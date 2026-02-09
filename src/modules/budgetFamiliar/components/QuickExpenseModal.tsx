import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type QuickExpenseData = {
  valor: number;
  observacao: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: QuickExpenseData) => void;
};

const defaultForm = {
  valor: "",
  observacao: "",
};

export function QuickExpenseModal({ open, onClose, onSubmit }: Props) {
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm(defaultForm);
      setError("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const value = form.valor.replace(",", ".");
    const valor = Number(value);
    if (!Number.isFinite(valor) || valor <= 0) {
      setError("Informe um valor maior que zero.");
      return;
    }

    onSubmit({
      valor,
      observacao: form.observacao.trim(),
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 px-4 py-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <Card
        className="w-full max-w-sm"
        onClick={(event) => event.stopPropagation()}
      >
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Despesa rápida</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Fechar
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>Valor</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                required
                autoFocus
                value={form.valor}
                onChange={(event) => {
                  setForm({ ...form, valor: event.target.value });
                  if (error) setError("");
                }}
              />
            </div>
            <div className="space-y-1">
              <Label>Observação (opcional)</Label>
              <Textarea
                rows={3}
                value={form.observacao}
                onChange={(event) => setForm({ ...form, observacao: event.target.value })}
              />
            </div>

            {error ? <p className="text-xs text-destructive">{error}</p> : null}

            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">Adicionar</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
