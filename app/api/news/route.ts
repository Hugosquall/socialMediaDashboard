import Parser from "rss-parser"
import { NextResponse } from "next/server"

export const revalidate = 1800 // revalida a cada 30 minutos

export type NewsItem = {
  id: string
  title: string
  source: string
  sourceUrl: string
  link: string
  publishDate: string
  publishDateRaw: string
  summary: string
  topic: "tools" | "engineering" | "quality" | "research" | "business" | "general"
  trending: boolean
}

const FEEDS: { url: string; source: string; sourceUrl: string }[] = [
  {
    url: "https://openai.com/news/rss.xml",
    source: "OpenAI",
    sourceUrl: "https://openai.com/news",
  },
  {
    url: "https://github.blog/ai-and-ml/feed/",
    source: "GitHub AI & ML",
    sourceUrl: "https://github.blog/ai-and-ml",
  },
  {
    url: "https://github.blog/engineering/feed/",
    source: "GitHub Engineering",
    sourceUrl: "https://github.blog/engineering",
  },
  {
    url: "https://huggingface.co/blog/feed.xml",
    source: "Hugging Face",
    sourceUrl: "https://huggingface.co/blog",
  },
  {
    url: "https://vercel.com/blog/rss.xml",
    source: "Vercel",
    sourceUrl: "https://vercel.com/blog",
  },
  {
    url: "https://stackoverflow.blog/feed/",
    source: "Stack Overflow",
    sourceUrl: "https://stackoverflow.blog",
  },
  {
    url: "https://martinfowler.com/feed.atom",
    source: "Martin Fowler",
    sourceUrl: "https://martinfowler.com",
  },
  {
    url: "https://www.thoughtworks.com/rss/insights.xml",
    source: "Thoughtworks",
    sourceUrl: "https://www.thoughtworks.com/insights",
  },
]

// Palavras-chave para categorização por tópico
const TOPIC_KEYWORDS: Record<Exclude<NewsItem["topic"], "general">, string[]> = {
  tools: [
    "agent", "agents", "ai agent", "copilot", "codex", "cursor", "devin", "mcp",
    "model context protocol", "langchain", "langgraph", "llamaindex", "rag",
    "retrieval", "vector", "embedding", "embeddings", "sdk", "framework", "tool",
    "tools", "workflow", "automation", "automação", "ide", "prompt", "prompts",
    "fine-tuning", "fine tuning", "inference", "serverless ai", "ai app",
  ],
  engineering: [
    "software engineering", "engenharia de software", "architecture", "arquitetura",
    "system design", "developer experience", "developer productivity", "devex",
    "platform engineering", "backend", "frontend", "api", "apis", "ci/cd", "cicd",
    "devops", "cloud", "database", "data engineering", "distributed systems",
    "migration", "refactoring", "code review", "pull request", "repository",
    "monorepo", "release", "deployment", "deploy", "performance", "scalability",
    "scalable",
  ],
  quality: [
    "testing", "test", "tests", "qa", "quality", "qualidade", "e2e", "end-to-end",
    "playwright", "cypress", "selenium", "evaluation", "evaluations", "eval",
    "evals", "benchmark", "benchmarks", "observability", "monitoring", "tracing",
    "reliability", "incident", "sre", "security", "secure", "vulnerability",
    "safety", "guardrail", "guardrails", "hallucination", "regression",
    "regressions", "validation", "verification",
  ],
  research: [
    "research", "paper", "papers", "arxiv", "model", "models", "llm", "llms",
    "large language model", "multimodal", "reasoning", "alignment", "transformer",
    "dataset", "datasets", "training", "post-training", "pretraining", "token",
    "tokens", "sota", "state of the art", "open source model", "weights",
    "benchmark", "academic", "university", "lab", "deep learning", "machine learning",
  ],
  business: [
    "startup", "enterprise", "market", "funding", "investment", "investor",
    "valuation", "revenue", "pricing", "product launch", "partnership", "acquisition",
    "regulation", "compliance", "policy", "governance", "copyright", "privacy",
    "customer", "customers", "adoption", "business", "commercial", "company",
    "companies", "openai", "anthropic", "google", "microsoft", "meta", "nvidia",
  ],
}

function classifyTopic(title: string, summary: string): NewsItem["topic"] {
  const text = `${title} ${summary}`.toLowerCase()

  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw))) {
      return topic as NewsItem["topic"]
    }
  }

  return "general"
}

function formatDate(dateStr: string | undefined): { display: string; raw: string } {
  if (!dateStr) return { display: "Data desconhecida", raw: "" }

  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffH = Math.floor(diffMs / (1000 * 60 * 60))
    const diffD = Math.floor(diffH / 24)

    let display: string
    if (diffH < 1) display = "Agora mesmo"
    else if (diffH < 24) display = `${diffH}h atrás`
    else if (diffD === 1) display = "Ontem"
    else if (diffD < 7) display = `${diffD}d atrás`
    else display = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })

    return { display, raw: date.toISOString() }
  } catch {
    return { display: dateStr, raw: dateStr }
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300)
}

export async function GET() {
  const parser = new Parser({
    timeout: 8000,
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; NewsAggregator/1.0)",
    },
    customFields: {
      item: [["media:content", "mediaContent"], ["enclosure", "enclosure"]],
    },
  })

  const results: NewsItem[] = []
  const seenTitles = new Set<string>()

  await Promise.allSettled(
    FEEDS.map(async (feed) => {
      try {
        const data = await parser.parseURL(feed.url)

        for (const item of (data.items || []).slice(0, 8)) {
          const title = item.title?.trim() || ""
          if (!title || seenTitles.has(title.toLowerCase())) continue
          seenTitles.add(title.toLowerCase())

          const rawSummary =
            item.contentSnippet || item.content || item.summary || ""
          const summary = stripHtml(rawSummary) || "Clique para ler o artigo completo."

          const { display: publishDate, raw: publishDateRaw } = formatDate(
            item.pubDate || item.isoDate
          )

          const topic = classifyTopic(title, summary)

          results.push({
            id: `${feed.source}-${item.guid || item.link || title}`,
            title,
            source: feed.source,
            sourceUrl: feed.sourceUrl,
            link: item.link || feed.sourceUrl,
            publishDate,
            publishDateRaw,
            summary,
            topic,
            trending: false,
          })
        }
      } catch {
        // feed falhou silenciosamente
      }
    })
  )

  // Ordenar por data mais recente
  results.sort((a, b) => {
    if (!a.publishDateRaw) return 1
    if (!b.publishDateRaw) return -1
    return new Date(b.publishDateRaw).getTime() - new Date(a.publishDateRaw).getTime()
  })

  // Marcar os 2 primeiros como trending
  results.slice(0, 2).forEach((item) => {
    item.trending = true
  })

  // Se nenhuma notícia real foi obtida, retornar mock
  if (results.length === 0) {
    return NextResponse.json({ items: getMockNews(), source: "mock" })
  }

  return NextResponse.json({ items: results, source: "live" })
}

function getMockNews(): NewsItem[] {
  return [
    {
      id: "mock-1",
      title: "Times adotam evals contínuos para reduzir regressões em produtos com IA",
      source: "AI Dev Radar",
      sourceUrl: "#",
      link: "#",
      publishDate: "1h atrás",
      publishDateRaw: new Date(Date.now() - 3600000).toISOString(),
      summary:
        "Pipelines de avaliação automática passam a rodar junto com CI/CD, medindo groundedness, segurança, latência e regressões de comportamento antes de cada release.",
      topic: "quality",
      trending: true,
    },
    {
      id: "mock-2",
      title: "Agentes de desenvolvimento ganham memória, tracing e execução supervisionada",
      source: "AI Dev Radar",
      sourceUrl: "#",
      link: "#",
      publishDate: "3h atrás",
      publishDateRaw: new Date(Date.now() - 10800000).toISOString(),
      summary:
        "Novas ferramentas de agentic coding combinam contexto de repositório, execução em sandbox e checkpoints humanos para tornar automações de engenharia mais auditáveis.",
      topic: "tools",
      trending: true,
    },
    {
      id: "mock-3",
      title: "Arquiteturas RAG migram de busca vetorial simples para context engineering",
      source: "AI Dev Radar",
      sourceUrl: "#",
      link: "#",
      publishDate: "5h atrás",
      publishDateRaw: new Date(Date.now() - 18000000).toISOString(),
      summary:
        "Equipes de produto estão tratando contexto como camada de arquitetura: roteamento, ranking, compressão, caching e testes passam a ser decisões centrais do sistema.",
      topic: "engineering",
      trending: false,
    },
    {
      id: "mock-4",
      title: "Modelos multimodais aceleram fluxos de QA para interfaces e documentação",
      source: "AI Dev Radar",
      sourceUrl: "#",
      link: "#",
      publishDate: "8h atrás",
      publishDateRaw: new Date(Date.now() - 28800000).toISOString(),
      summary:
        "Combinações de Playwright, visão computacional e LLMs já permitem detectar regressões visuais, textos quebrados e inconsistências entre especificação e produto.",
      topic: "quality",
      trending: false,
    },
    {
      id: "mock-5",
      title: "Empresas criam políticas internas para uso de copilotos e dados sensíveis",
      source: "AI Dev Radar",
      sourceUrl: "#",
      link: "#",
      publishDate: "12h atrás",
      publishDateRaw: new Date(Date.now() - 43200000).toISOString(),
      summary:
        "Governança de IA entra no fluxo de engenharia com regras para prompts, telemetria, privacidade, revisão humana e uso seguro de código proprietário.",
      topic: "business",
      trending: false,
    },
    {
      id: "mock-6",
      title: "Novos benchmarks medem raciocínio de agentes em tarefas reais de software",
      source: "AI Dev Radar",
      sourceUrl: "#",
      link: "#",
      publishDate: "1d atrás",
      publishDateRaw: new Date(Date.now() - 86400000).toISOString(),
      summary:
        "Avaliações passam a considerar tarefas longas em repositórios, uso de ferramentas, leitura de logs e capacidade de corrigir falhas sem degradar comportamento existente.",
      topic: "research",
      trending: false,
    },
    {
      id: "mock-7",
      title: "Plataformas serverless otimizam inferência para apps com IA em produção",
      source: "AI Dev Radar",
      sourceUrl: "#",
      link: "#",
      publishDate: "1d atrás",
      publishDateRaw: new Date(Date.now() - 90000000).toISOString(),
      summary:
        "Novos runtimes combinam cache, streaming, filas e observabilidade para reduzir custo e latência de features baseadas em LLMs.",
      topic: "engineering",
      trending: false,
    },
    {
      id: "mock-8",
      title: "Open source models aumentam pressão por stack própria de avaliação e deploy",
      source: "AI Dev Radar",
      sourceUrl: "#",
      link: "#",
      publishDate: "2d atrás",
      publishDateRaw: new Date(Date.now() - 172800000).toISOString(),
      summary:
        "Com mais modelos disponíveis, times precisam comparar custo, qualidade, latência, segurança e manutenção antes de escolher entre APIs hospedadas e infraestrutura própria.",
      topic: "research",
      trending: false,
    },
  ]
}
