import { ReactNode } from "react";
import { Link } from "react-router-dom";
import MainNav from "./MainNav";
import { cn } from "@/lib/utils";

const AppShell = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen bg-background text-foreground">
    <header className="sticky top-0 z-50 border-b bg-card/30 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <span
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-lg"
            )}
          >
            SP
          </span>
          <span className="text-lg">SuperPlanejador</span>
        </Link>
        <MainNav />
      </div>
    </header>
    <main className="pt-16">
      <div className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">{children}</div>
    </main>
  </div>
);

export default AppShell;
