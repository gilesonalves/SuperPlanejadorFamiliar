import type { ShoppingCategory, ShoppingItem } from "./types";

export const defaultCategories: ShoppingCategory[] = [
  { id: "carnes", nome: "Carnes", icon: "Beef", ordem: 1 },
  { id: "hortifruti", nome: "Hortifruti", icon: "Carrot", ordem: 2 },
  { id: "padaria", nome: "Padaria", icon: "Croissant", ordem: 3 },
  { id: "mercearia", nome: "Mercearia", icon: "ShoppingBasket", ordem: 4 },
  { id: "bebidas", nome: "Bebidas", icon: "Beer", ordem: 5 },
  { id: "laticinios", nome: "Laticinios", icon: "Milk", ordem: 6 },
  { id: "peixaria", nome: "Peixaria", icon: "Fish", ordem: 7 },
  { id: "ovos", nome: "Ovos", icon: "Egg", ordem: 8 },
  { id: "limpeza", nome: "Limpeza", icon: "Soap", ordem: 9 },
  { id: "higiene", nome: "Higiene", icon: "HandSoap", ordem: 10 }
];

export const sampleItems: Partial<ShoppingItem>[] = [
  {
    nome: "Picanha",
    categoriaId: "carnes",
    quantidade: 1,
    unidade: "kg",
    preco: 45.9,
    dicaReceita: "Tempere com sal grosso 30min antes do preparo",
    nutricao: "Rica em proteinas e ferro"
  },
  {
    nome: "Banana Prata",
    categoriaId: "hortifruti",
    quantidade: 1,
    unidade: "kg",
    preco: 4.5,
    nutricao: "Rica em potassio e vitaminas"
  },
  {
    nome: "Pao Frances",
    categoriaId: "padaria",
    quantidade: 10,
    unidade: "un",
    preco: 0.6
  },
  {
    nome: "Leite Integral",
    categoriaId: "laticinios",
    quantidade: 1,
    unidade: "l",
    preco: 4.2,
    marca: "Itambe"
  }
];