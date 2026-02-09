
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Copy, Archive } from "lucide-react";
import { useShoppingStore } from "@/contexts/ShoppingContext";
import { useToast } from "@/hooks/use-toast";

const ListPicker = () => {
  const {
    state,
    activeList,
    createList,
    duplicateList,
    archiveList,
    setActiveList,

  } = useShoppingStore();
  const { toast } = useToast();

  const [showDialog, setShowDialog] = useState(false);
  const [listName, setListName] = useState("");

  const activeLists = state.listas.filter((lista) => !lista.arquivada);

  const handleCreate = () => {
    if (!listName.trim()) {
      return;
    }
    createList(listName.trim());
    toast({
      title: "Lista salva",
      description: "A nova lista foi criada.",
    });
    setListName("");
    setShowDialog(false);
  };

  const handleDuplicate = () => {
    if (activeList) {
      duplicateList(activeList.id);
    }
  };

  const handleArchive = () => {
    if (!activeList) {
      return;
    }
    archiveList(activeList.id);
    const remaining = activeLists.filter((lista) => lista.id !== activeList.id);
    if (remaining.length > 0) {
      setActiveList(remaining[0].id);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={activeList?.id || ""} onValueChange={setActiveList}>
        <SelectTrigger className="w-[220px]">
          <SelectValue placeholder="Selecione uma lista" />
        </SelectTrigger>
        <SelectContent>
          {activeLists.map((lista) => (
            <SelectItem key={lista.id} value={lista.id}>
              <div className="flex w-full items-center justify-between">
                <span>{lista.nome}</span>
                <Badge variant="secondary" className="ml-2 text-xs">
                  {lista.itens.length}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"

            className="relative"
          >
            <Plus className="mr-1 h-4 w-4" /> Nova Lista
            
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Criar nova lista</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Nome da lista"
              value={listName}
              onChange={(event) => setListName(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && handleCreate()}
              autoFocus
            />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button className="flex-1" disabled={!listName.trim()} onClick={handleCreate}>
                Criar lista
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Button
        variant="outline"
        size="sm"
        onClick={handleDuplicate}
        disabled={!activeList}
        className="relative"
      >
        <Copy className="mr-1 h-4 w-4" /> Duplicar

      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleArchive}
        disabled={!activeList || activeLists.length <= 1}
      >
        <Archive className="mr-1 h-4 w-4" /> Arquivar
      </Button>
    </div>
  );
};

export default ListPicker;

