import * as L from "lucide-react";
import { ReactNode } from "react";

export function getIcon(name?: string): ReactNode {
  if (!name) return null;
  const Icon = (L as any)[name];
  return Icon ? <Icon className="h-4 w-4" /> : null;
}