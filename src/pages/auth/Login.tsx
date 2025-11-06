import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { signInWithGoogle, signInWithPassword } from "@/hooks/useAuth";

const LoginPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    const result = await signInWithPassword(email, password);

    if (!result.ok) {
      setErrorMessage(result.message ?? "Nao foi possivel entrar.");
      setLoading(false);
      return;
    }

    navigate("/home", { replace: true });
  };

  const handleGoogle = async () => {
    const message = await signInWithGoogle();
    if (message) {
      toast({
        variant: "destructive",
        title: "Falha ao entrar com Google",
        description: message,
      });
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md space-y-4">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Entrar</CardTitle>
          <CardDescription>Acesse com seu e-mail e senha ou continue com o Google.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-3" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
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
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
              />
            </div>
            {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <div className="flex items-center gap-2">
            <span className="h-px flex-1 bg-muted" />
            <span className="text-xs uppercase text-muted-foreground">ou</span>
            <span className="h-px flex-1 bg-muted" />
          </div>

          <Button type="button" variant="outline" className="w-full" onClick={handleGoogle}>
            Entrar com Google
          </Button>
        </CardContent>
        <CardFooter className="flex justify-between text-sm">
          <Link to="/register" className="text-primary hover:underline">
            Criar conta
          </Link>
          <Link to="/forgot" className="text-primary hover:underline">
            Esqueci minha senha
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginPage;
