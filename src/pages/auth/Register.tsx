import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const APP_PROD_URL = "https://app.heygar.com.br";

const RegisterPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      navigate("/login", { replace: false });
    }, 10_000);
    return () => window.clearTimeout(timer);
  }, [navigate]);

  const redirectTo =
    import.meta.env.DEV
      ? import.meta.env.VITE_APP_ORIGIN ?? window.location.origin
      : APP_PROD_URL;

  const handleSignInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: { prompt: "select_account" },
      },
    });

    if (error) {
      console.error("[Register] Google OAuth error:", error.message);
      toast({
        variant: "destructive",
        title: "Não foi possível iniciar o cadastro",
        description: error.message,
      });
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Criar conta</CardTitle>
          <CardDescription>
            Use o botão abaixo para continuar com sua conta Google.
            Vamos redirecionar você para a tela de login automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="w-full" onClick={handleSignInWithGoogle}>
            Entrar com Google
          </Button>
          <p className="text-xs text-muted-foreground">
            Preferimos OAuth para garantir que o trial seja ativado imediatamente e sem
            trocas de senha.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPage;
