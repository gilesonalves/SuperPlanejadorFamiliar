// src/components/shopping/AddItemAccordion.tsx
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { useShoppingStore } from "@/contexts/ShoppingContext";
import type { Unit, ShoppingItem } from "@/services/shopping/types";

const UNITS: Unit[] = ["un", "kg", "g", "ml", "l", "pct", "cx"];
const CATEGORIAS = [
    "Carnes",
    "Hortifruti",
    "Padaria",
    "Mercearia",
    "Bebidas",
    "Laticínios",
    "Peixaria",
    "Ovos",
    "Limpeza",
    "Higiene",
    "Outros",
];

export default function AddItemAccordion() {
    const { addItem } = useShoppingStore();

    const [nome, setNome] = useState("");
    const [categoria, setCategoria] = useState<string | undefined>();
    const [qtd, setQtd] = useState(1);
    const [un, setUn] = useState<Unit>("un");
    const [preco, setPreco] = useState<number | undefined>();
    const [marca, setMarca] = useState("");

    function onAdd() {
        const n = nome.trim();
        if (!n) return;

        // Payload canônico + aliases (compatibilidade com código legado)
        const payload: Omit<ShoppingItem, "id"> = {
            // canônicos
            name: n,
            category: categoria ?? "Outros",
            qty: qtd,
            unit: un,
            price: preco ?? 0,
            brand: marca || undefined,
            status: "pendente",

            // aliases/legado (se ainda existirem no store)
            nome: n,
            categoriaId: categoria ?? "Outros",
            quantidade: qtd,
            unidade: un,
            preco: preco ?? 0,
            marca: marca || undefined,
        } as Omit<ShoppingItem, "id">;

        addItem(payload);

        // limpa
        setNome("");
        setMarca("");
        setPreco(undefined);
        setQtd(1);
        setUn("un");
        setCategoria(undefined);
    }

    return (
        <Accordion type="single" collapsible className="rounded-xl border bg-card">
            <AccordionItem value="add">
                <AccordionTrigger className="px-4 text-base font-semibold">
                    Adicionar Item
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                    <div className="grid gap-3 md:grid-cols-2">
                        <Input
                            placeholder="Nome do item"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                        />

                        <Select value={categoria} onValueChange={(v) => setCategoria(v)}>
                            <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
                            {/* 👇 limita a altura e usa popper (sem travar a tela) */}
                            <SelectContent position="popper" className="max-h-72 overflow-y-auto">
                                {CATEGORIAS.map((c) => (
                                    <SelectItem key={c} value={c}>
                                        {c}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <div className="flex gap-2">
                            <Input
                                type="number"
                                min={1}
                                value={qtd}
                                onChange={(e) => setQtd(parseInt(e.target.value || "1", 10))}
                            />

                            <Select
                                value={un}
                                onValueChange={(v) => setUn(v as Unit)} // cast para Unit
                            >
                                <SelectTrigger className="w-[110px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {UNITS.map((u) => (
                                        <SelectItem key={u} value={u}>
                                            {u}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex gap-2">
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="Preço (R$)"
                                value={preco ?? ""}
                                onChange={(e) =>
                                    setPreco(e.target.value ? Number(e.target.value) : undefined)
                                }
                            />
                            <Input
                                placeholder="Marca (opcional)"
                                value={marca}
                                onChange={(e) => setMarca(e.target.value)}
                            />
                        </div>

                        <Textarea
                            className="md:col-span-2"
                            placeholder="Observações, dicas de receita ou informações nutricionais"
                        />
                    </div>

                    <div className="pt-3">
                        <Button className="w-full" onClick={onAdd}>
                            + Adicionar Item
                        </Button>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}
