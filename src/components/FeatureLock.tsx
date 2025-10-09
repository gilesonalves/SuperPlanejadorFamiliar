import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";

export type FeatureLockProps = {
  title: string;
  description?: string;
  variant?: "card" | "inline";
};

const CTA_TEXT = "Desbloquear no plano Pro/Premium";

const FeatureLock = ({ title, description, variant = "card" }: FeatureLockProps) => {
  if (variant === "inline") {
    return (
      <div className="flex flex-col items-end gap-2 text-right">
        <Badge variant="outline" className="border-primary/40 text-primary">
          {CTA_TEXT}
        </Badge>
        <Button asChild size="sm" variant="ghost">
          <Link to="/pricing">Ver planos</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4">
      <div className="flex items-center gap-2">
        <Crown className="h-4 w-4 text-primary" />
        <Badge variant="secondary" className="bg-primary/10 text-primary">
          {CTA_TEXT}
        </Badge>
      </div>
      <div>
        <p className="font-semibold leading-tight">{title}</p>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      <div>
        <Button asChild size="sm">
          <Link to="/pricing">Ver planos</Link>
        </Button>
      </div>
    </div>
  );
};

export default FeatureLock;
