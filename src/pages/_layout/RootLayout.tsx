// src/pages/_layout/RootLayout.tsx
import { Outlet, NavLink } from "react-router-dom";

const linkCls = (active: boolean) =>
  [
    "px-3 py-2 rounded-md text-sm font-medium",
    active ? "bg-emerald-600 text-white" : "text-emerald-300 hover:bg-emerald-700 hover:text-white",
  ].join(" ");

export default function RootLayout() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <img
              src="/sp-textured-24.png"   // ajuste o nome se for diferente
              alt="SP"
              width={24}
              height={24}
              className="rounded"
            />
            <span className="font-bold">SuperPlanejador</span>
          </div>

          <nav className="flex gap-2">
            <NavLink to="/home" className={({ isActive }) => linkCls(isActive)}>Resumo</NavLink>
            <NavLink to="/WalletManager" className={({ isActive }) => linkCls(isActive)}>Carteira</NavLink>
            <NavLink to="/BudgetManager" className={({ isActive }) => linkCls(isActive)}>Orçamento</NavLink>
            <NavLink to="/shopping" className={({ isActive }) => linkCls(isActive)}>Lista de Compras</NavLink>
          </nav>

          {/* aqui fica perfil/sair, se tiver */}
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
