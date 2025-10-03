// src/components/layout/MainNav.tsx
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth, signOut } from "@/hooks/useAuth";
import {
  BarChart3,
  Wallet,
  Calculator,
  ShoppingBasket,
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
  { to: "/budget", label: "Orçamento", icon: Calculator },
  { to: "/shopping", label: "Lista de Compras", icon: ShoppingBasket },
] as const;

export default function MainNav() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      {/* NAV LINKS */}
      <nav className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              cn(
                buttonVariants({ variant: isActive ? "default" : "ghost", size: "sm" }),
                "btn-financial flex items-center gap-2"
              )
            }
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* USER MENU */}
      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "sm:ml-1 flex items-center gap-2"
            )}
          >
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-primary/10 text-primary">
                {user.email?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium sm:inline">
              {user.email?.split("@")[0] || "Conta"}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="gap-2" onClick={() => navigate("/profile")}>
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
      ) : (
        <NavLink
          to="/login"
          className={cn(buttonVariants({ variant: "default", size: "sm" }), "sm:ml-1")}
        >
          Entrar
        </NavLink>
      )}
    </div>
  );
}
