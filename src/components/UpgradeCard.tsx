import { Button } from "@/components/ui/button";

type UpgradeCardProps = {
  title: string;
  description: string;
  onPro: () => void;
  onPremium: () => void;
};

export function UpgradeCard({ title, description, onPro, onPremium }: UpgradeCardProps) {
  return (
    <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-6">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={onPro}>Assinar Pro</Button>
        <Button variant="outline" onClick={onPremium}>
          Assinar Premium
        </Button>
      </div>
    </div>
  );
}
