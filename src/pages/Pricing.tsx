import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Crown, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createCheckoutSession } from "@/lib/billing";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

type PaidPlanId = "pro" | "premium";

type Plan = {
  id: "free" | PaidPlanId;
  title: string;
  description: string;
  priceLabel: string;
  badge?: string;
  bullets: string[];
  actionLabel: string;
};

const plans: Plan[] = [
  {
    id: "free",
    title: "Free",
    description: "Ferramentas essenciais para organizar finanças e compras.",
    priceLabel: "R$ 0 / mês",
    bullets: [
      "Investimentos e orçamento locais",
      "Até 3 listas de compras",
      "Exportação básica (CSV)",
    ],
    actionLabel: "Começar grátis",
  },
  {
    id: "pro",
    title: "Pro",
    description: "Automação de carteira + limites avançados e relatórios.",
    priceLabel: "R$ 29 / mês",
    badge: "Mais popular",
    bullets: [
      "Integração com BRAPI e Open Finance",
      "Cartões e metas liberados",
      "Exportações inteligentes e relatórios",
    ],
    actionLabel: "Assinar Pro",
  },
  {
    id: "premium",
    title: "Premium",
    description: "Tudo do Pro com multi perfis, forecasts e suporte prioritário.",
    priceLabel: "R$ 59 / mês",
    badge: "Completo",
    bullets: [
      "Cenários de fluxo de caixa",
      "Multi perfis familiares",
      "Prioridade no suporte e roadmap",
    ],
    actionLabel: "Assinar Premium",
  },
];

const planSectionId = "pricing-plans";

const PricingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<PaidPlanId | null>(null);

  const handleCheckout = async (planId: PaidPlanId) => {
    if (!user) {
      navigate("/register?redirect=/pricing");
      return;
    }

    setLoadingPlan(planId);
    try {
      await createCheckoutSession(planId);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Falha ao iniciar o checkout.";
      toast({
        title: "Erro no checkout",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  const scrollToPlans = () => {
    const target = document.getElementById(planSectionId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      navigate("/pricing");
    }
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6">
      <section className="text-center space-y-4">
        <Badge variant="secondary" className="inline-flex items-center gap-2 px-3 py-1">
          <Sparkles className="h-4 w-4 text-primary" />
          Novos planos SuperPlanejador
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Escale o planejamento financeiro com o plano certo
        </h1>
        <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">
          Escolha o melhor plano para desbloquear automações, relatórios e integrações com billing
          inteligente via Stripe ou Pix no checkout seguro do Vercel Functions.
        </p>
      </section>

      <section id={planSectionId} className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => {
          const isPaid = plan.id !== "free";
          const disabled = isPaid ? loadingPlan === plan.id : false;
          return (
            <Card
              key={plan.id}
              className={`flex h-full flex-col border ${
                plan.id === "premium" ? "border-primary/60" : ""
              }`}
            >
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-xl">{plan.title}</CardTitle>
                  {plan.badge ? (
                    <Badge variant="outline" className="uppercase tracking-wide">
                      {plan.badge}
                    </Badge>
                  ) : null}
                </div>
                <CardDescription>{plan.description}</CardDescription>
                <div className="text-2xl font-semibold text-foreground">{plan.priceLabel}</div>
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                <ul className="space-y-2">
                  {plan.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 text-primary" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                {isPaid ? (
                  <Button
                    className="w-full"
                    onClick={() => handleCheckout(plan.id)}
                    disabled={disabled}
                  >
                    {loadingPlan === plan.id ? "Redirecionando..." : plan.actionLabel}
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => navigate(user ? "/home" : "/register")}
                  >
                    {plan.actionLabel}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </section>

      <section className="rounded-2xl border bg-muted/40 p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
              <Crown className="h-4 w-4 text-primary" />
              Benefícios Pro e Premium
            </div>
            <p className="max-w-xl text-sm text-muted-foreground">
              Assinaturas dão acesso aos webhooks de billing, sincronização automática dos
              entitlements e liberações instantâneas das flags premium para todos os módulos.
            </p>
          </div>
          <Button size="lg" variant="secondary" onClick={scrollToPlans}>
            Comparar planos em detalhes
          </Button>
        </div>
      </section>
    </div>
  );
};

export default PricingPage;
