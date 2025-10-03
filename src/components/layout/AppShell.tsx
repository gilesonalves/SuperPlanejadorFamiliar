// src/components/layout/AppShell.tsx
import { ReactNode } from "react";
import { Link, Outlet } from "react-router-dom";
import MainNav from "./MainNav";
import { cn } from "@/lib/utils";

export default function AppShell() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b bg-card/30 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-6">
          <Link to="/home" className="flex items-center gap-2 font-semibold">
            <img
              src="/sp-textured-48.png"     // troque pelo nome do seu arquivo
              alt="SuperPlanejador"
              className="h-9 w-9 rounded-xl"
            />
            <span className="text-lg">SuperPlanejador</span>
          </Link>
          <MainNav />
        </div>
      </header>

      <main className="pt-16">
        <div className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
          <Outlet /> {/* 👈 renderiza Dashboard/Wallet/Budget/Shopping */}
        </div>
      </main>
    </div>
  );
}
