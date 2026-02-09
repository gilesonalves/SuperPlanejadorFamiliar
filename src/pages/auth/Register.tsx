import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUpWithEmail } from "@/hooks/useAuth";

const RegisterPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    if (password.length < 6) {
      setErrorMessage("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("As senhas precisam coincidir.");
      return;
    }

    setLoading(true);
    const result = await signUpWithEmail(email, password);
    setLoading(false);

    if (!result.ok) {
      setErrorMessage(result.message ?? "Nao foi possivel criar sua conta.");
      return;
    }

    setInfoMessage("Enviamos um link para confirmar seu cadastro. Verifique seu e-mail.");
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md space-y-4">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Criar conta</CardTitle>
          <CardDescription>Cadastre-se com e-mail e senha.</CardDescription>
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
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirm-password">Confirmar senha</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                minLength={6}
              />
            </div>
            {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
            {infoMessage ? <p className="text-sm text-primary">{infoMessage}</p> : null}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Cadastrando..." : "Criar conta"}
            </Button>
          </form>

        </CardContent>
        <CardFooter className="justify-center text-sm">
          <span className="text-muted-foreground">
            Ja possui conta?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Entrar
            </Link>
          </span>
        </CardFooter>
      </Card>
    </div>
  );
};

export default RegisterPage;
