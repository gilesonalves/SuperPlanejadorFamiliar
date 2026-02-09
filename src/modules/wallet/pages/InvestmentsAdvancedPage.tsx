import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { cloneDefaultState, loadLocal, saveLocal, type AppState } from "@/services/storage";

export default function InvestmentsAdvancedPage() {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingImport, setPendingImport] = useState<unknown | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState<string | undefined>(
    isMobile ? undefined : "advanced",
  );

  useEffect(() => {
    setAdvancedOpen(isMobile ? undefined : "advanced");
  }, [isMobile]);

  const handleExportJSON = () => {
    const state = loadLocal() as AppState;
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "superplanejador_carteira.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (payload: unknown) => {
    try {
      if (!payload || typeof payload !== "object") throw new Error("Formato inválido");
      const base = cloneDefaultState();
      const data = payload as Partial<AppState>;
      const nextState: AppState = {
        portfolio: Array.isArray(data.portfolio) ? data.portfolio : base.portfolio,
        budget: Array.isArray(data.budget) ? data.budget : base.budget,
        settings: {
          ...base.settings,
          ...(typeof data.settings === "object" && data.settings ? data.settings : {}),
        },
      };
      saveLocal(nextState);
      toast({
        title: "Dados importados",
        description: "A carteira foi atualizada com sucesso",
      });
    } catch (err) {
      console.error("Erro ao importar JSON", err);
      toast({
        title: "Falha na importação",
        description: "Não foi possível ler o arquivo selecionado",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result ?? "{}"));
        setPendingImport(parsed);
        setConfirmOpen(true);
      } catch (error) {
        console.error("Falha ao importar JSON", error);
        toast({
          title: "Falha na importação",
          description: "Não foi possível ler o arquivo selecionado",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const confirmImport = () => {
    if (!pendingImport) return;
    handleImportJSON(pendingImport);
    setPendingImport(null);
    setConfirmOpen(false);
  };

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
            <BreadcrumbPage>Investimentos (Avancado)</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold">Configuracoes avancadas de investimentos</h1>
          <Badge variant="secondary">Avancado</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Uso recomendado para usuarios experientes. Use com cuidado.
        </p>
      </header>

      <Accordion
        type="single"
        collapsible
        value={advancedOpen}
        onValueChange={setAdvancedOpen}
        className="space-y-3"
      >
        <AccordionItem value="advanced" className="border-none">
          <Card className="w-full p-0">
            <AccordionTrigger className="px-6 py-4 no-underline hover:no-underline">
              <div className="flex flex-wrap items-center gap-2 text-left">
                <CardTitle>Configuracoes avancadas de investimentos</CardTitle>
                <Badge variant="secondary">Avancado</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <CardDescription>
                Esses recursos sao indicados para usuarios avancados. Use com cuidado.
              </CardDescription>
              <CardContent className="space-y-4 px-0 pt-4">
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  Importar dados substitui a carteira atual por completo. Revise o arquivo antes de continuar.
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button variant="outline" onClick={handleExportJSON}>
                    Exportar investimentos (JSON)
                  </Button>
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    Importar investimentos (JSON)
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <Label>Importacao</Label>
                  <p>A importacao exige confirmacao explicita e pode sobrescrever dados existentes.</p>
                </div>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>
      </Accordion>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Importar investimentos</AlertDialogTitle>
            <AlertDialogDescription>
              Este processo substitui os dados atuais da carteira de investimentos. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmImport}>Confirmar importacao</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
