type AssetClass = "FII" | "ACAO" | "CRYPTO";

export type InvestmentAiPortfolioItem = {
  symbol: string;
  name?: string;
  sector?: string;
  assetClass: AssetClass;
  qty: number;
  price: number;
  totalValue: number;
};

export type InvestmentAiInput = {
  items: InvestmentAiPortfolioItem[];
  totalValue: number;
  allocationPct: {
    fii: number;
    acao: number;
    crypto: number;
  };
  availableAmount: number;
  riskProfile: "conservador" | "moderado" | "arrojado";
  goal: "crescimento" | "renda-passiva" | "preservacao";
  baseCurrency: "BRL";
  sectorSummary: Array<{ sector: string; pct: number }>;
};

type GroqMessage = {
  role: "system" | "user";
  content: string;
};

type GroqResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
};

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_API_KEY = (import.meta.env.VITE_GROQ_API_KEY as string | undefined)?.trim();
const GROQ_MODEL = (import.meta.env.VITE_GROQ_MODEL as string | undefined) ?? "llama-3.1-8b-instant";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

const goalLabels: Record<InvestmentAiInput["goal"], string> = {
  crescimento: "Crescimento",
  "renda-passiva": "Renda passiva",
  preservacao: "Preservação de capital",
};

const riskLabels: Record<InvestmentAiInput["riskProfile"], string> = {
  conservador: "Conservador",
  moderado: "Moderado",
  arrojado: "Arrojado",
};

const buildPrompt = (input: InvestmentAiInput) => {
  const items = input.items.slice(0, 30);
  const hasPortfolio = items.length > 0;
  const listLines = hasPortfolio
    ? items
        .map(
          (item) =>
            `- ${item.symbol}: ${item.qty} @ ${formatCurrency(item.price)} (total ${formatCurrency(item.totalValue)})`,
        )
        .join("\n")
    : "Usuário ainda não possui investimentos cadastrados";

  const sectorLines = input.sectorSummary.length
    ? input.sectorSummary
        .map((row) => `- ${row.sector}: ${row.pct.toFixed(1)}%`)
        .join("\n")
    : "Sem dados de setor";

  return [
    `Valor disponível para investir: ${formatCurrency(input.availableAmount)}`,
    "",
    `Perfil de risco: ${riskLabels[input.riskProfile] ?? "não informado"}`,
    `Objetivo principal: ${goalLabels[input.goal] ?? "não informado"}`,
    `Moeda base: ${input.baseCurrency}`,
    "",
    "Ativos atuais da carteira:",
    listLines,
    "",
    "Resumo por setor:",
    sectorLines,
    "",
    "Tarefa:",
    "- Gerar sugestões de investimento educacionais.",
    "- Se a carteira estiver vazia, sugerir uma estratégia inicial simples.",
    "- Se houver ativos, sugerir diversificação ou reforço.",
    "- Considerar o valor informado.",
    "- Considerar o perfil e objetivo quando disponíveis.",
  ].join("\n");
};

export async function requestInvestmentTips(input: InvestmentAiInput): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error("IA não configurada no ambiente.");
  }

  const messages: GroqMessage[] = [
    {
      role: "system",
      content: [
        "Você é um assistente financeiro educacional integrado ao app SuperPlanejador.",
        "",
        "Regras importantes:",
        "- Suas respostas NÃO são recomendações financeiras.",
        "- Todas as sugestões são apenas educacionais.",
        "- Sempre inclua um aviso de que o usuário deve avaliar seu perfil de risco ou consultar um profissional.",
        "",
        "Contexto do app:",
        "- Usuário pode ou não ter investimentos cadastrados.",
        "- Usuário informa um valor disponível para investir.",
        "- Usuário pode ter preferências de carteira:",
        "  - Perfil de risco: Conservador, Moderado ou Arrojado",
        "  - Objetivo: Crescimento, Renda Passiva ou Preservação",
        "  - Moeda base: BRL",
        "",
        "Seu papel:",
        "- Analisar a carteira atual (se existir).",
        "- Se não houver ativos, sugerir uma estratégia inicial simples.",
        "- Distribuir o valor informado de forma lógica e diversificada.",
        "- Usar linguagem clara, acessível e em português do Brasil.",
        "- Evitar jargões excessivos.",
        "- Estruturar a resposta em tópicos curtos.",
        "",
        "Formato da resposta:",
        "- Título curto",
        "- Lista de sugestões com valores aproximados",
        "- Pequena explicação de cada item",
        "- Aviso legal no final",
      ].join("\n"),
    },
    {
      role: "user",
      content: buildPrompt(input),
    },
  ];

  let response: Response;
  try {
    response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature: 0.3,
        max_tokens: 220,
      }),
    });
  } catch (error) {
    const err = new Error("Falha ao conectar com a IA") as Error & { cause?: unknown };
    err.cause = error;
    throw err;
  }

  if (!response.ok) {
    const raw = (await response.json().catch(() => null)) as GroqResponse | null;
    if (response.status === 401 || response.status === 403) {
      const err = new Error("IA não configurada no ambiente.") as Error & { cause?: unknown };
      err.cause = raw;
      throw err;
    }
    if (response.status === 429 || response.status >= 500) {
      const err = new Error("Serviço temporariamente indisponível") as Error & { cause?: unknown };
      err.cause = raw;
      throw err;
    }
    const err = new Error("Falha ao conectar com a IA") as Error & { cause?: unknown };
    err.cause = raw;
    throw err;
  }

  const data = (await response.json()) as GroqResponse;
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("Serviço temporariamente indisponível");
  }
  return content;
}

export async function requestShoppingHints(input: string): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error("IA não configurada no ambiente.");
  }

  const prompt = [
    `O usuário digitou: ${input}`,
    "",
    "Gere uma receita ou explicacao culinaria clara, com:",
    "- titulo da receita",
    "- ingredientes",
    "- modo de preparo",
    "- dicas opcionais (tempo, variacoes)",
    "",
    "Seja direto e didatico.",
  ].join("\n");

  const messages: GroqMessage[] = [
    {
      role: "system",
      content: [
        "Voce e um assistente culinario.",
        "",
        "Regras importantes:",
        "- Gere receitas simples, claras e seguras.",
        "- Nunca de conselhos medicos.",
        "- Sempre responda em portugues do Brasil.",
      "",
        "Formato da resposta:",
        "- Titulo curto",
        "- Lista de ingredientes",
        "- Modo de preparo",
        "- Dicas opcionais (tempo, variacoes)",
      ].join("\n"),
    },
    {
      role: "user",
      content: prompt,
    },
  ];

  let response: Response;
  try {
    response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature: 0.4,
        max_tokens: 600,
      }),
    });
  } catch (error) {
    const err = new Error("Falha ao conectar com a IA") as Error & { cause?: unknown };
    err.cause = error;
    throw err;
  }

  if (!response.ok) {
    const raw = (await response.json().catch(() => null)) as GroqResponse | null;
    if (response.status === 401 || response.status === 403) {
      const err = new Error("IA não configurada no ambiente.") as Error & { cause?: unknown };
      err.cause = raw;
      throw err;
    }
    if (response.status === 429 || response.status >= 500) {
      const err = new Error("Serviço temporariamente indisponível") as Error & { cause?: unknown };
      err.cause = raw;
      throw err;
    }
    const err = new Error("Falha ao conectar com a IA") as Error & { cause?: unknown };
    err.cause = raw;
    throw err;
  }

  const data = (await response.json()) as GroqResponse;
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("Serviço temporariamente indisponível");
  }
  return content;
}
