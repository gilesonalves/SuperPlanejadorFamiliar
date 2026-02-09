import { useState } from "react";
import ShoppingLayout from "@/components/shopping/ShoppingLayout";
import { ShoppingProvider } from "@/contexts/ShoppingContext";
import {
  BudgetFamiliarProvider,
  useBudgetFamiliar,
  type DespesaVariavel,
  type DespesaVariavelInput,
} from "@/modules/budgetFamiliar/hooks/useBudgetFamiliar";
import { DespesasVariaveisForm } from "@/modules/budgetFamiliar/components/DespesasVariaveisForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ShoppingExpensePayload } from "@/services/shopping/types";

const formatDateInput = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const ShoppingPageContent = () => {
  const { addDespesaVariavel } = useBudgetFamiliar();
  const [expenseDraft, setExpenseDraft] = useState<DespesaVariavel | null>(null);
  const [expenseOpen, setExpenseOpen] = useState(false);

  const handleRequestExpense = (payload: ShoppingExpensePayload) => {
    const parsedDate = new Date(payload.date);
    const safeDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
    setExpenseDraft({
      id: `draft-${Date.now()}`,
      data: formatDateInput(safeDate),
      categoria: payload.category,
      descricao: payload.description,
      formaPagamento: "Outros",
      valor: payload.total,
      essencial: false,
      perfil: "familiar",
    });
    setExpenseOpen(true);
  };

  const handleExpenseSave = (data: DespesaVariavelInput) => {
    addDespesaVariavel({ ...data, perfil: "familiar" });
    setExpenseOpen(false);
    setExpenseDraft(null);
  };

  return (
    <>
      <ShoppingLayout onRequestAddExpense={handleRequestExpense} />
      <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar despesa variavel</DialogTitle>
            <DialogDescription>
              Revise os dados antes de salvar a despesa no orcamento familiar.
            </DialogDescription>
          </DialogHeader>
          {expenseDraft ? (
            <DespesasVariaveisForm
              editing={expenseDraft}
              onCancel={() => setExpenseOpen(false)}
              onSave={handleExpenseSave}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
};

const ShoppingPage = () => (
  <BudgetFamiliarProvider>
    <ShoppingProvider>
      <ShoppingPageContent />
    </ShoppingProvider>
  </BudgetFamiliarProvider>
);

export default ShoppingPage;
