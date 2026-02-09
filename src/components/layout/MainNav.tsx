// src/components/layout/MainNav.tsx
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth, signOut } from "@/hooks/useAuth";
import {
  BarChart3,
  Wallet,
  Calculator,
  ShoppingBasket,
  Settings,
  User,
  LogOut,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navItems = [
  { to: "/home", label: "Resumo", icon: BarChart3 },
  { to: "/wallet", label: "Carteira", icon: Wallet },
  { to: "/budget-familiar", label: "Orçamento", icon: Calculator },
  { to: "/shopping", label: "Lista de Compras", icon: ShoppingBasket },
] as const;



type Props = { direction?: "row" | "col"; showUserMenu?: boolean };

export function UserMenu({ className, showName = false }: { className?: string; showName?: boolean }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) {
    return (
      <NavLink
        to="/login"
        className={cn(buttonVariants({ variant: "default", size: "sm" }), className)}
      >
        Entrar
      </NavLink>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "h-11 w-11 p-0",
          className,
        )}
        aria-label="Abrir menu do usuario"
      >
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-primary/10 text-primary">
            {user.email?.charAt(0)?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {showName ? (
          <div className="px-2 pb-2 text-xs text-muted-foreground">
            {user.email?.split("@")[0] || "Conta"}
          </div>
        ) : null}
        <DropdownMenuItem
          className="gap-2"
          onClick={() => navigate("/settings/data/import-budget-familiar")}
        >
          <Settings className="h-4 w-4" /> Configuracoes
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2" onClick={() => navigate("/profile")}
        >
          <User className="h-4 w-4" /> Perfil
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-2 text-destructive focus:text-destructive"
          onClick={() => { void signOut(); }}
        >
          <LogOut className="h-4 w-4" /> Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function MainNav({ direction = "row", showUserMenu = true }: Props) {
  const navClass =
  direction === "row"
    ? "flex flex-row items-center gap-2"
    : "flex flex-col gap-2";

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      {/* NAV LINKS */}
      <nav className={navClass}>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              cn(
                buttonVariants({ variant: isActive ? "default" : "ghost", size: "sm" }),
                "btn-financial flex items-center gap-2 justify-start",
                direction === "col" && "w-full"
              )
            }
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* USER MENU */}
      {showUserMenu ? <UserMenu showName={direction === "row"} className="sm:ml-1" /> : null}
    </div>
  );
}
