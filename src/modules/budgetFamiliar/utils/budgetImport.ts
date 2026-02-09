import {
  loadBudgetFamiliarState,
  setBudgetFamiliarState,
  type BudgetFamiliarState,
  type DespesaFixa,
  type DespesaVariavel,
  type PerfilOrcamento,
  type Receita,
} from "@/modules/budgetFamiliar/hooks/useBudgetFamiliar";

type BudgetExportData = {
  receitas: Receita[];
  despesasFixas: DespesaFixa[];
  despesasVariaveis: DespesaVariavel[];
};

export type BudgetImportStrategy = "merge" | "replace";

export class ImportCollisionError extends Error {
  collisions: { receitas: number; despesasFixas: number; despesasVariaveis: number };

  constructor(collisions: { receitas: number; despesasFixas: number; despesasVariaveis: number }) {
    super("Import collision detected");
    this.name = "ImportCollisionError";
    this.collisions = collisions;
  }
}

const EXPECTED_SCHEMA = "budget_familiar";
const EXPECTED_VERSION = 1;

const createId = () => `bf-import-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const toRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

const readString = (record: Record<string, unknown>, key: string, fallback = "") => {
  const value = record[key];
  if (typeof value === "string") return value;
  return fallback;
};

const readNumber = (record: Record<string, unknown>, key: string, fallback = 0) => {
  const value = record[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const readBoolean = (record: Record<string, unknown>, key: string, fallback = false) => {
  const value = record[key];
  if (typeof value === "boolean") return value;
  return fallback;
};

// Export values are in centavos; internal budget uses reais.
const readMoney = (record: Record<string, unknown>, key: string, fallback = 0) =>
  readNumber(record, key, fallback) / 100;

const asPerfil = (value: unknown): PerfilOrcamento => (value === "pessoal" ? "pessoal" : "familiar");

const normalizeReceita = (item: unknown): Receita => {
  const record = toRecord(item);
  const rawTipo = readString(record, "tipo", "Fixa");
  const tipo: Receita["tipo"] = rawTipo === "Variável" ? "Variável" : "Fixa";
  return {
    id: readString(record, "id", createId()),
    data: readString(record, "data"),
    fonte: readString(record, "fonte"),
    tipo,
    valor: readMoney(record, "valor"),
    perfil: asPerfil(record.perfil),
  };
};

const normalizeDespesaFixa = (item: unknown): DespesaFixa => {
  const record = toRecord(item);
  return {
    id: readString(record, "id", createId()),
    dataVencimento: readString(record, "dataVencimento"),
    conta: readString(record, "conta"),
    categoria: readString(record, "categoria"),
    valorPrevisto: readMoney(record, "valorPrevisto"),
    valorPago: readMoney(record, "valorPago"),
    recorrente: readBoolean(record, "recorrente"),
    perfil: asPerfil(record.perfil),
  };
};

const normalizeDespesaVariavel = (item: unknown): DespesaVariavel => {
  const record = toRecord(item);
  return {
    id: readString(record, "id", createId()),
    data: readString(record, "data"),
    categoria: readString(record, "categoria"),
    descricao: readString(record, "descricao"),
    formaPagamento: readString(record, "formaPagamento"),
    valor: readMoney(record, "valor"),
    essencial: readBoolean(record, "essencial", true),
    perfil: asPerfil(record.perfil),
  };
};

const ensureArrayOfRecords = (value: unknown) =>
  Array.isArray(value) && value.every((item) => typeof item === "object" && item !== null);

const readSampleNumbers = (items: unknown, key: string) => {
  if (!Array.isArray(items)) return [] as number[];
  return items.slice(0, 2).map((item) => readNumber(toRecord(item), key, 0));
};

const readSampleFixedNumbers = (items: unknown) => {
  if (!Array.isArray(items)) return { valorPrevisto: [] as number[], valorPago: [] as number[] };
  return {
    valorPrevisto: items.slice(0, 2).map((item) => readNumber(toRecord(item), "valorPrevisto", 0)),
    valorPago: items.slice(0, 2).map((item) => readNumber(toRecord(item), "valorPago", 0)),
  };
};

const cloneForLog = <T>(value: T) => JSON.parse(JSON.stringify(value)) as T;

const sampleItems = <T extends { id: string }>(items: T[], limit = 2) =>
  items.slice(0, limit).map((item) => cloneForLog(item));

const sampleIds = <T extends { id: string }>(items: T[], limit = 5) =>
  items.slice(0, limit).map((item) => item.id);

export const normalizeImportedBudgetData = (payload: unknown): BudgetFamiliarState => {
  const record = toRecord(payload);
  const schema = readString(record, "schema");
  const version = readNumber(record, "version", Number.NaN);

  console.log(
    "[IMPORT][SCHEMA]",
    `schema=${schema} version=${Number.isFinite(version) ? String(version) : "NaN"} keys=${JSON.stringify(Object.keys(record))}`,
  );

  if (schema !== EXPECTED_SCHEMA || version !== EXPECTED_VERSION) {
    throw new Error(`Arquivo não reconhecido. Schema: ${schema}, versão: ${version}`);
  }

  const dataPayload = toRecord(record.data);
  const receitasRaw = dataPayload.receitas;
  const despesasFixasRaw = dataPayload.despesasFixas;
  const despesasVariaveisRaw = dataPayload.despesasVariaveis;
  const categoriasRaw = dataPayload.categorias;
  const periodosRaw = dataPayload.periodos;

  console.log("[IMPORT][NORMALIZED][RAW][COUNTS]", {
    periodos: Array.isArray(periodosRaw) ? periodosRaw.length : 0,
    categorias: Array.isArray(categoriasRaw) ? categoriasRaw.length : 0,
    receitas: Array.isArray(receitasRaw) ? receitasRaw.length : 0,
    despesasFixas: Array.isArray(despesasFixasRaw) ? despesasFixasRaw.length : 0,
    despesasVariaveis: Array.isArray(despesasVariaveisRaw) ? despesasVariaveisRaw.length : 0,
  });

  console.log("[IMPORT][NORMALIZED][RAW][EXAMPLES]", {
    periodos: Array.isArray(periodosRaw) ? cloneForLog(periodosRaw[0]) : null,
    categorias: Array.isArray(categoriasRaw) ? cloneForLog(categoriasRaw[0]) : null,
    receitas: Array.isArray(receitasRaw) ? cloneForLog(receitasRaw[0]) : null,
    despesasFixas: Array.isArray(despesasFixasRaw) ? cloneForLog(despesasFixasRaw[0]) : null,
    despesasVariaveis: Array.isArray(despesasVariaveisRaw) ? cloneForLog(despesasVariaveisRaw[0]) : null,
  });

  console.log("[IMPORT][NORMALIZED][RAW][SAMPLE_VALUES]", {
    receitasValor: readSampleNumbers(receitasRaw, "valor"),
    despesasFixas: readSampleFixedNumbers(despesasFixasRaw),
    despesasVariaveisValor: readSampleNumbers(despesasVariaveisRaw, "valor"),
  });

  if (!ensureArrayOfRecords(receitasRaw) || !ensureArrayOfRecords(despesasFixasRaw) || !ensureArrayOfRecords(despesasVariaveisRaw)) {
    throw new Error("Estrutura invalida. Verifique se o arquivo e uma exportacao do Orcamento Familiar.");
  }

  const data: BudgetExportData = {
    receitas: receitasRaw.map((item) => normalizeReceita(item)),
    despesasFixas: despesasFixasRaw.map((item) => normalizeDespesaFixa(item)),
    despesasVariaveis: despesasVariaveisRaw.map((item) => normalizeDespesaVariavel(item)),
  };

  console.log("[IMPORT][NORMALIZED][FINAL][COUNTS]", {
    periodos: Array.isArray(periodosRaw) ? periodosRaw.length : 0,
    categorias: Array.isArray(categoriasRaw) ? categoriasRaw.length : 0,
    receitas: data.receitas.length,
    despesasFixas: data.despesasFixas.length,
    despesasVariaveis: data.despesasVariaveis.length,
  });

  console.log("[IMPORT][NORMALIZED][FINAL][EXAMPLES]", {
    receitas: sampleItems(data.receitas, 1),
    despesasFixas: sampleItems(data.despesasFixas, 1),
    despesasVariaveis: sampleItems(data.despesasVariaveis, 1),
  });

  console.log("[IMPORT][NORMALIZED][FINAL][SAMPLE_VALUES]", {
    receitasValor: data.receitas.slice(0, 2).map((item) => item.valor),
    despesasFixas: {
      valorPrevisto: data.despesasFixas.slice(0, 2).map((item) => item.valorPrevisto),
      valorPago: data.despesasFixas.slice(0, 2).map((item) => item.valorPago),
    },
    despesasVariaveisValor: data.despesasVariaveis.slice(0, 2).map((item) => item.valor),
  });

  return data;
};

const mergeById = <T extends { id: string }>(current: T[], incoming: T[]) => {
  const next = current.map((item) => ({ ...item }));
  const indexById = new Map<string, number>();

  next.forEach((item, index) => {
    indexById.set(item.id, index);
  });

  incoming.forEach((item) => {
    const index = indexById.get(item.id);
    if (index === undefined) {
      indexById.set(item.id, next.length);
      next.push(item);
    } else {
      next[index] = item;
    }
  });

  return next;
};

const countCollisions = <T extends { id: string }>(current: T[], incoming: T[]) => {
  const currentIds = new Set(current.map((item) => item.id));
  return incoming.reduce((count, item) => (currentIds.has(item.id) ? count + 1 : count), 0);
};

export const applyImportedBudgetData = (
  strategy: BudgetImportStrategy,
  imported: BudgetFamiliarState,
): BudgetFamiliarState => {
  const current = loadBudgetFamiliarState();
  const beforeCounts = {
    receitas: current.receitas.length,
    despesasFixas: current.despesasFixas.length,
    despesasVariaveis: current.despesasVariaveis.length,
  };
  const importCounts = {
    receitas: imported.receitas.length,
    despesasFixas: imported.despesasFixas.length,
    despesasVariaveis: imported.despesasVariaveis.length,
  };
  const collisionCounts = {
    receitas: countCollisions(current.receitas, imported.receitas),
    despesasFixas: countCollisions(current.despesasFixas, imported.despesasFixas),
    despesasVariaveis: countCollisions(current.despesasVariaveis, imported.despesasVariaveis),
  };
  const currentIds = {
    receitas: new Set(current.receitas.map((item) => item.id)),
    despesasFixas: new Set(current.despesasFixas.map((item) => item.id)),
    despesasVariaveis: new Set(current.despesasVariaveis.map((item) => item.id)),
  };
  const importedIds = {
    receitas: sampleIds(imported.receitas, 5),
    despesasFixas: sampleIds(imported.despesasFixas, 5),
    despesasVariaveis: sampleIds(imported.despesasVariaveis, 5),
  };
  const collisions = {
    receitas: imported.receitas.filter((item) => currentIds.receitas.has(item.id)).slice(0, 5).map((item) => item.id),
    despesasFixas: imported.despesasFixas.filter((item) => currentIds.despesasFixas.has(item.id)).slice(0, 5).map((item) => item.id),
    despesasVariaveis: imported.despesasVariaveis.filter((item) => currentIds.despesasVariaveis.has(item.id)).slice(0, 5).map((item) => item.id),
  };

  if (strategy === "merge") {
    console.log("[IMPORT][MERGE][BEFORE]", {
      current: beforeCounts,
      imported: importCounts,
      collisions: collisionCounts,
      importedSampleIds: importedIds,
      collisions,
    });
  }

  if (strategy === "merge") {
    const hasCollision =
      collisionCounts.receitas > 0 ||
      collisionCounts.despesasFixas > 0 ||
      collisionCounts.despesasVariaveis > 0;
    if (hasCollision) {
      throw new ImportCollisionError(collisionCounts);
    }
  }

  const next: BudgetFamiliarState =
    strategy === "replace"
      ? imported
      : {
          receitas: mergeById(current.receitas, imported.receitas),
          despesasFixas: mergeById(current.despesasFixas, imported.despesasFixas),
          despesasVariaveis: mergeById(current.despesasVariaveis, imported.despesasVariaveis),
        };

  const afterCounts = {
    receitas: next.receitas.length,
    despesasFixas: next.despesasFixas.length,
    despesasVariaveis: next.despesasVariaveis.length,
  };

  if (strategy === "merge") {
    console.log("[IMPORT][MERGE][AFTER]", {
      next: afterCounts,
      delta: {
        receitas: afterCounts.receitas - beforeCounts.receitas,
        despesasFixas: afterCounts.despesasFixas - beforeCounts.despesasFixas,
        despesasVariaveis: afterCounts.despesasVariaveis - beforeCounts.despesasVariaveis,
      },
      samples: {
        receitas: sampleItems(next.receitas, 2),
        despesasFixas: sampleItems(next.despesasFixas, 2),
        despesasVariaveis: sampleItems(next.despesasVariaveis, 2),
      },
    });
  }

  const totals = {
    totalReceitas: next.receitas.reduce((sum, item) => sum + (item.valor || 0), 0),
    totalDespesasFixas: next.despesasFixas.reduce((sum, item) => sum + (item.valorPrevisto || 0), 0),
    totalDespesasVariaveis: next.despesasVariaveis.reduce((sum, item) => sum + (item.valor || 0), 0),
  };

  console.log("[IMPORT][APPLY]", {
    strategy,
    totals: {
      ...totals,
      totalDespesas: totals.totalDespesasFixas + totals.totalDespesasVariaveis,
      saldo: totals.totalReceitas - (totals.totalDespesasFixas + totals.totalDespesasVariaveis),
    },
  });

  setBudgetFamiliarState(next);
  return next;
};
