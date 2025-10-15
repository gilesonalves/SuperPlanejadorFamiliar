import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { ensureTrial } from "@/lib/ensureTrial";

const missingConfigMessage = "Configure VITE_SUPABASE_URL/ANON_KEY";

const LoginPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const notifyMissingConfig = () =>
    toast({
      variant: "destructive",
      title: "Supabase nao configurado",
      description: missingConfigMessage,
    });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) {
      notifyMissingConfig();
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ variant: "destructive", title: "Falha no login", description: error.message });
        return;
      }
      if (data?.user) {
        await ensureTrial(supabase, data.user.id);
      }
      toast({ title: "Bem-vindo de volta" });
      navigate("/");
    } catch (error) {
      const description = error instanceof Error ? error.message : "Erro inesperado";
      toast({ variant: "destructive", title: "Falha no login", description });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (!supabase) {
      notifyMissingConfig();
      return;
    }

    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
    } catch (error) {
      const description = error instanceof Error ? error.message : "Erro inesperado";
      toast({ variant: "destructive", title: "Falha no login", description });
    }
  };

  const supabaseMissing = !supabase;

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Entrar</CardTitle>
          {supabaseMissing && (
            <p className="text-sm text-muted-foreground">{missingConfigMessage}</p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
          <Button type="button" variant="outline" className="mt-4 w-full" onClick={handleGoogle}>
            Entrar com Google
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 text-sm">
          <div className="flex w-full justify-between">
            <Link to="/register" className="text-primary hover:underline">
              Criar conta
            </Link>
            <Link to="/forgot" className="text-primary hover:underline">
              Esqueci minha senha
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginPage;
