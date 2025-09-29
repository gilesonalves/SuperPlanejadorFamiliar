
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Crown, Check } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  feature: "item" | "lista";
  currentCount?: number;
  maxCount?: number;
  featurePlural?: string;
  openUpgrade?: () => void;
};

const featureLabels = {
  item: { singular: "item", plural: "itens" },
  lista: { singular: "lista", plural: "listas" },
} as const;

const ProGateModal = ({
  open,
  onOpenChange,
  feature,
  currentCount,
  maxCount,
  featurePlural,
  openUpgrade,
}: Props) => {
  const label = featureLabels[feature];
  const plural = featurePlural ?? label.plural;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Crown className="h-6 w-6 text-primary" />
            Libere recursos PRO
          </DialogTitle>
          <DialogDescription>
            Voce atingiu o limite do plano gratuito. Atualize para continuar adicionando {plural}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border/80 bg-muted/40 p-4">
            <div className="text-sm font-semibold text-muted-foreground">Plano Atual</div>
            <p className="mt-2 text-xl font-semibold">Free</p>
            <p className="mt-3 text-sm text-muted-foreground">
              {currentCount ?? 0}/{maxCount ?? 0} {plural}
            </p>
            <Badge variant="outline" className="mt-4 text-xs">
              Ideal para testar o produto
            </Badge>
          </div>

          <div className="rounded-xl border border-primary/40 bg-primary/10 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Crown className="h-4 w-4" /> Plano PRO
            </div>
            <p className="mt-2 text-xl font-semibold">Ilimitado</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                Listas ilimitadas
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                Itens ilimitados por lista
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                Planilhas e exportacoes exclusivas
              </li>
            </ul>
            <Button className="mt-4 w-full" onClick={openUpgrade}>
              Conhecer planos
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProGateModal;
