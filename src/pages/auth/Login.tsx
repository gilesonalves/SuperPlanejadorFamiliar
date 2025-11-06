import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const APP_PROD_URL = "https://app.heygar.com.br";

const LoginPage = () => {
  const { toast } = useToast();

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
      console.error("[Login] Google OAuth error:", error.message);
      toast({
        variant: "destructive",
        title: "Falha ao entrar",
        description: error.message,
      });
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Entrar</CardTitle>
          <CardDescription>Use sua conta Google para continuar.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            className="w-full"
            onClick={handleSignInWithGoogle}
          >
            Entrar com Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
