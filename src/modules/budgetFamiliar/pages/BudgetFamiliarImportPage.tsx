import { useRef, useState } from "react";
import { UploadCloud, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  applyImportedBudgetData,
  ImportCollisionError,
  normalizeImportedBudgetData,
  type BudgetImportStrategy,
} from "@/modules/budgetFamiliar/utils/budgetImport";
import { resetBudgetFamiliar } from "@/modules/budgetFamiliar/hooks/useBudgetFamiliar";
import type { BudgetFamiliarState } from "@/modules/budgetFamiliar/hooks/useBudgetFamiliar";

export default function BudgetFamiliarImportPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<BudgetFamiliarState | null>(null);
  const [strategy] = useState<BudgetImportStrategy>("replace");
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetText, setResetText] = useState("");

  const resetFileState = () => {
    setError(null);
    setData(null);
    setFileName(null);
  };

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".json")) {
      resetFileState();
      setError("Apenas arquivos .json sao aceitos.");
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const normalized = normalizeImportedBudgetData(parsed);
      setData(normalized);
      setFileName(file.name);
      setError(null);
    } catch (err) {
      console.error("Falha ao ler arquivo", err);
      resetFileState();
      const message = err instanceof Error
        ? err.message
        : "Nao foi possivel importar os dados. Verifique o arquivo.";
      setError(message);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      void handleFile(file);
    }
    event.target.value = "";
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      void handleFile(file);
    }
  };

  const runImport = async () => {
    if (!data) return;
    setIsImporting(true);
    try {
      applyImportedBudgetData(strategy, data);
      toast({
        title: "Dados importados com sucesso.",
        description: "O orcamento familiar foi atualizado.",
      });
    } catch (err) {
      console.error("Erro ao importar orcamento", err);
      if (err instanceof ImportCollisionError) {
        toast({
          title: "Nao foi possivel somar os dados.",
          description:
            "Os dados importados ja existem no orcamento atual. Para continuar, utilize a opcao Substituir dados.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Nao foi possivel importar os dados.",
        description: "Verifique o arquivo e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      setConfirmOpen(false);
    }
  };

  const handleConfirmImport = () => {
    if (strategy === "replace") {
      setConfirmOpen(true);
      return;
    }
    void runImport();
  };

  const handleResetBudget = () => {
    resetBudgetFamiliar();
    setResetOpen(false);
    setResetText("");
    toast({
      title: "Orcamento reiniciado",
      description: "Todos os dados do orcamento familiar foram apagados.",
    });
  };

  const canImport = Boolean(data) && !isImporting;

  return (
    <main className="container mx-auto space-y-6 px-4 py-8 sm:px-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <span>Configuracoes</span>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <span>Dados</span>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Importar Orcamento Familiar</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header>
        <h1 className="text-2xl font-semibold">Importar Orcamento Familiar</h1>
        <p className="text-sm text-muted-foreground">
          Traga os dados do app Orcamento Familiar com validacao e controle total.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Arquivo de exportacao</CardTitle>
          <CardDescription>
            Selecione o arquivo .json exportado do Orcamento Familiar. Outros modulos serao ignorados.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={cn(
              "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-6 text-center transition",
              isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/30",
            )}
          >
            <UploadCloud className="h-6 w-6 text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Arraste o arquivo aqui</p>
              <p className="text-xs text-muted-foreground">ou selecione manualmente</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              Selecionar arquivo
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {fileName ? (
            <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{fileName}</span>
            </div>
          ) : null}

          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Erro na importacao</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>Modo de importacao</CardTitle>
            <Badge variant="secondary">Avancado</Badge>
          </div>
          <CardDescription>O modo Substituir dados esta disponivel.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-4">
            <div className="space-y-1">
              <Label className="font-medium">Substituir os dados atuais</Label>
              <p className="text-sm text-muted-foreground">
                Remove completamente o orcamento atual e aplica apenas os dados importados.
              </p>
            </div>
          </div>

          {data ? (
            <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
              {data.receitas.length} receitas · {data.despesasFixas.length} despesas fixas ·{" "}
              {data.despesasVariaveis.length} despesas variaveis prontas para importar.
            </div>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button onClick={handleConfirmImport} disabled={!canImport}>
              {isImporting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importando...
                </span>
              ) : (
                "Confirmar importacao"
              )}
            </Button>
            <Button variant="ghost" onClick={resetFileState} disabled={isImporting}>
              Limpar selecao
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>Reiniciar orcamento</CardTitle>
            <Badge variant="secondary">Avancado</Badge>
          </div>
          <CardDescription>
            Apaga receitas, despesas fixas e despesas variaveis do orcamento familiar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Uso recomendado para usuarios experientes. Essa acao e irreversivel.
          </div>
          <Button variant="destructive" onClick={() => setResetOpen(true)}>
            Reiniciar orcamento
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Substituir todos os dados?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao substituira todos os dados atuais do orcamento. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void runImport()}>
              Confirmar importacao
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reiniciar orcamento familiar</AlertDialogTitle>
            <AlertDialogDescription>
              Essa acao vai apagar receitas, despesas fixas e despesas variaveis. Digite
              "REINICIAR" para confirmar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label>Confirmacao</Label>
            <Input
              value={resetText}
              onChange={(event) => setResetText(event.target.value)}
              placeholder="Digite REINICIAR"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setResetText("")}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetBudget}
              disabled={resetText.trim() !== "REINICIAR"}
            >
              Reiniciar orcamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
