import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const missingConfigMessage = "Configure VITE_SUPABASE_URL/ANON_KEY";

const RegisterPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const notifyMissingConfig = () =>
    toast({
      variant: "destructive",
      title: "Supabase nao configurado",
      description: missingConfigMessage,
    });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      toast({ variant: "destructive", description: "As senhas precisam coincidir." });
      return;
    }

    if (!supabase) {
      notifyMissingConfig();
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        toast({ variant: "destructive", title: "Falha no cadastro", description: error.message });
        return;
      }
      toast({
        title: "Cadastro realizado",
        description: "Enviamos um e-mail para confirmar sua conta.",
      });
      navigate("/login");
    } catch (error) {
      const description = error instanceof Error ? error.message : "Erro inesperado";
      toast({ variant: "destructive", title: "Falha no cadastro", description });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Criar conta</CardTitle>
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
                minLength={6}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirm">Confirmar senha</Label>
              <Input
                id="confirm"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Enviando..." : "Criar conta"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-sm">
          <span className="text-muted-foreground">
            Ja possui conta?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Acesse sua conta
            </Link>
          </span>
        </CardFooter>
      </Card>
    </div>
  );
};

export default RegisterPage;
