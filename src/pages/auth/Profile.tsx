import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

const ProfilePage = () => {
  const { user, signOut } = useAuth();

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
          <CardDescription>Gerencie as informacoes da sua conta.</CardDescription>
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
    </div>
  );
};

export default ProfilePage;
