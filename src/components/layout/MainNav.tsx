import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import {
  BarChart3,
  Wallet,
  Calculator,
  ShoppingBasket,
  User,
  LogOut,
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

const navItems = [
  { to: "/", label: "Resumo", icon: BarChart3 },
  { to: "/wallet", label: "Carteira", icon: Wallet },
  { to: "/budget", label: "Orcamento", icon: Calculator },
  { to: "/shopping", label: "Lista de Compras", icon: ShoppingBasket },
] as const;

const MainNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      <nav className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname === to;
          return (
            <Button
              key={to}
              asChild
              size="sm"
              variant={isActive ? "default" : "ghost"}
              className="btn-financial"
            >
              <NavLink to={to} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </NavLink>
            </Button>
          );
        })}
      </nav>

      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="sm:ml-1">
              <div className="flex items-center gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {user.email?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium sm:inline">
                  {user.email?.split("@")[0] || "Conta"}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="gap-2" onClick={() => navigate("/profile")}>
              <User className="h-4 w-4" /> Perfil
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 text-destructive focus:text-destructive"
              onClick={() => {
                void signOut();
              }}
            >
              <LogOut className="h-4 w-4" /> Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button asChild size="sm" className="sm:ml-1">
          <NavLink to="/login">Entrar</NavLink>
        </Button>
      )}
    </div>
  );
};

export default MainNav;
