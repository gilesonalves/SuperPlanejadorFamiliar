
// src/components/layout/AppShell.tsx

import { buttonVariants } from "@/components/ui/button";


// 👇 shadcn Sheet (menu lateral)
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
// src/components/layout/AppShell.tsx
import { ReactNode } from "react";
import { Link, Outlet } from "react-router-dom";
import MainNav, { UserMenu } from "./MainNav";
import { cn } from "@/lib/utils";

export default function AppShell() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b bg-card/30 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link to="/home" className="flex items-center gap-2">
            <img src="/sp-primary-48.png" alt="SuperPlanejador" className="h-9 w-9 rounded-xl" />
            <span className="text-lg font-semibold">SuperPlanejador</span>
          </Link>

          {/* --- DESKTOP NAV (igual ao que você já usa) --- */}
          <div className="hidden sm:flex flex-1 items-center justify-center">
            <MainNav showUserMenu={false} />
          </div>

          <div className="flex items-center gap-2">
            <UserMenu />

            {/* --- MOBILE NAV (Sheet) --- */}
            <div className="sm:hidden">
              {/* imports necessários no topo:
         import { buttonVariants } from "@/components/ui/button";
         import { cn } from "@/lib/utils";
         import { Menu } from "lucide-react";
         import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
      */}
              <Sheet>
                <SheetTrigger
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "p-2")}
                  aria-label="Abrir menu"
                >
                  <Menu className="h-5 w-5" />
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <img src="/sp-primary-48.png" alt="SP" className="h-6 w-6 rounded-md" />
                      Menu
                    </SheetTitle>
                  </SheetHeader>

                  <div className="mt-4">
                    {/* Reaproveita o mesmo MainNav, versão em coluna (ver passo 2) */}
                    <MainNav direction="col" showUserMenu={false} />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <main className="md:pt-16">
        <div className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
          <Outlet /> {/* 👈 renderiza Dashboard/Wallet/Budget/Shopping */}
        </div>
      </main>
    </div>
  );
}
