import * as L from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** Nome de ícone válido do lucide-react (ex.: "ShoppingCart", "Plus", "Trash2"...). */
export type IconName = keyof typeof L;

/** Type guard para strings vindas do backend/props. */
function isIconName(name: string): name is IconName {
  return name in L;
}

/**
 * Retorna o componente de ícone do lucide-react, já com tamanho padrão.
 * - Evita `any`
 * - Seguro para strings dinâmicas (só renderiza se for um ícone válido)
 */
export function getIcon(name?: string): ReactNode {
  if (!name || !isIconName(name)) return null;
  const Icon = L[name] as LucideIcon; // já garantido pelo type guard
  return <Icon className="h-4 w-4" />;
}
