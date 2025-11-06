import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import FeatureLock from "@/components/FeatureLock";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { usePremiumAccess } from "@/hooks/usePremiumAccess";
import { useAuth, signOut } from "@/hooks/useAuth";
import { useEntitlements } from "@/hooks/useEntitlements";

const ProfilePage = () => {
  const { user } = useAuth();
  const { flags } = useFeatureFlags();
  const { allowed: premiumAllowed, loading: premiumLoading } = usePremiumAccess();
  const { effectiveTier, trialExpiresAt } = useEntitlements();
  const multiProfileEnabled = premiumAllowed || flags.MULTI_PROFILE;
  const multiProfileLocked = !multiProfileEnabled && !premiumLoading;
  const trialActive = effectiveTier === "trial";
  const trialExpiryLabel =
    trialActive && trialExpiresAt
      ? new Date(trialExpiresAt).toLocaleDateString()
      : null;
  const multiProfileLockDescription = trialActive
    ? `Teste gratuito ativo até ${trialExpiryLabel ?? "o fim do período"}.`
    : "Disponível nos planos Premium para gerenciar finanças familiares e de clientes.";

  useEffect(() => {
    if (!user || !multiProfileLocked) return;

    console.warn("[Gate] closed", {
      userId: user.id,
      plan: effectiveTier,
      trialEndsAt: trialExpiresAt,
      now: new Date().toISOString(),
      gateKey: "profile-multi",
    });
  }, [user, multiProfileLocked, effectiveTier, trialExpiresAt]);

  if (!user) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-10 text-center">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Conta</CardTitle>
            <CardDescription>Entre para acessar os detalhes da sua conta.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild>
              <Link to="/login">Entrar</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
          <CardDescription>Gerencie as informações da sua conta.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div>
            <p className="text-sm text-muted-foreground">E-mail</p>
            <p className="text-lg font-semibold">{user.email}</p>
          </div>
          <Button variant="outline" onClick={() => signOut()}>
            Sair
          </Button>
        </CardContent>
      </Card>

      {multiProfileLocked ? (
        <FeatureLock
          title="Multi perfis bloqueado"
          description={multiProfileLockDescription}
        />
      ) : !multiProfileEnabled ? null : (
        <Card>
          <CardHeader>
            <CardTitle>Perfis adicionais</CardTitle>
            <CardDescription>Convide outras pessoas para acessar o SuperPlanejador.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button variant="secondary">Adicionar novo perfil</Button>
            <p className="text-xs text-muted-foreground">
              Multi perfis habilitado. Configure acessos personalizados para cada pessoa.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProfilePage;
