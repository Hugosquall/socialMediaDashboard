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
  topic: "tools" | "research" | "business" | "general"
  trending: boolean
}

const FEEDS: { url: string; source: string; sourceUrl: string }[] = [
  {
    url: "https://feeds.archdaily.com/archdaily",
    source: "ArchDaily",
    sourceUrl: "https://www.archdaily.com",
  },
  {
    url: "https://www.archdaily.com.br/br/feed",
    source: "ArchDaily Brasil",
    sourceUrl: "https://www.archdaily.com.br",
  },
  {
    url: "https://www.dezeen.com/architecture/feed/",
    source: "Dezeen",
    sourceUrl: "https://www.dezeen.com",
  },
  {
    url: "https://www.archinect.com/rss/news",
    source: "Archinect",
    sourceUrl: "https://www.archinect.com",
  },
  {
    url: "https://www.bustler.net/rss/news",
    source: "Bustler",
    sourceUrl: "https://www.bustler.net",
  },
]

// Palavras-chave para categorização por tópico
const TOPIC_KEYWORDS: Record<"tools" | "research" | "business", string[]> = {
  tools: [
    "bim", "revit", "autocad", "software", "plugin", "render", "rhino", "grasshopper",
    "sketch", "3d", "cad", "parametric", "parametrico", "digital", "technology",
    "tecnologia", "ferramenta", "ai", "artificial intelligence", "inteligência artificial",
    "vr", "ar", "virtual reality", "visualization", "visualização",
  ],
  research: [
    "study", "research", "estudo", "pesquisa", "sustainable", "sustentável",
    "sustainability", "sustentabilidade", "material", "innovation", "inovação",
    "urban", "urbano", "housing", "habitação", "social", "education", "educação",
    "academic", "acadêmico", "university", "universidade", "award", "prêmio",
    "competition", "concurso", "museum", "museu", "cultural", "heritage", "patrimônio",
  ],
  business: [
    "market", "mercado", "firm", "escritório", "contract", "contrato", "economy",
    "economia", "invest", "investimento", "real estate", "imóvel", "construction",
    "construção", "revenue", "receita", "profit", "lucro", "acquisition", "aquisição",
    "partnership", "parceria", "commission", "comissão", "hire", "contratação",
    "development", "desenvolvimento", "project cost", "custo", "budget", "orçamento",
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
      title: "BIM ganha adoção global: 78% dos grandes escritórios usam modelagem integrada em 2026",
      source: "ArchDaily",
      sourceUrl: "https://www.archdaily.com",
      link: "#",
      publishDate: "1h atrás",
      publishDateRaw: new Date(Date.now() - 3600000).toISOString(),
      summary:
        "Novo relatório da AIA aponta que Building Information Modeling tornou-se padrão na indústria, com integração nativa em fluxos de obra e colaboração em tempo real entre equipes multidisciplinares.",
      topic: "tools",
      trending: true,
    },
    {
      id: "mock-2",
      title: "Zaha Hadid Architects anuncia expansão no mercado latino-americano com três novos projetos",
      source: "Dezeen",
      sourceUrl: "https://www.dezeen.com",
      link: "#",
      publishDate: "3h atrás",
      publishDateRaw: new Date(Date.now() - 10800000).toISOString(),
      summary:
        "O escritório confirma projetos em São Paulo, Bogotá e Cidade do México, totalizando investimentos de US$ 2,4 bilhões. É a maior expansão do estúdio na região em uma década.",
      topic: "business",
      trending: true,
    },
    {
      id: "mock-3",
      title: "Pesquisa MIT: fachadas de concreto bioativo reduzem temperatura urbana em até 4°C",
      source: "Archinect",
      sourceUrl: "https://www.archinect.com",
      link: "#",
      publishDate: "5h atrás",
      publishDateRaw: new Date(Date.now() - 18000000).toISOString(),
      summary:
        "Estudo publicado no Journal of Sustainable Architecture demonstra que painéis de concreto inoculados com algas criam microclimas benéficos e reduzem o efeito de ilha de calor em centros urbanos.",
      topic: "research",
      trending: false,
    },
    {
      id: "mock-4",
      title: "Revit 2026 traz geração automática de pranchas com IA e compatibilidade nativa com IFC 4.3",
      source: "ArchDaily Brasil",
      sourceUrl: "https://www.archdaily.com.br",
      link: "#",
      publishDate: "8h atrás",
      publishDateRaw: new Date(Date.now() - 28800000).toISOString(),
      summary:
        "A Autodesk lança atualização major do Revit com assistente de IA para documentação técnica, redução de 60% no tempo de geração de pranchas e interoperabilidade total com o padrão IFC 4.3.",
      topic: "tools",
      trending: false,
    },
    {
      id: "mock-5",
      title: "Mercado imobiliário de alto padrão cresce 23% no Brasil impulsionado por projetos assinados",
      source: "Dezeen",
      sourceUrl: "https://www.dezeen.com",
      link: "#",
      publishDate: "12h atrás",
      publishDateRaw: new Date(Date.now() - 43200000).toISOString(),
      summary:
        "Incorporadoras reportam aumento expressivo na demanda por projetos com autoria arquitetônica reconhecida. Compradores de alto poder aquisitivo pagam até 40% a mais por assinaturas renomadas.",
      topic: "business",
      trending: false,
    },
    {
      id: "mock-6",
      title: "Habitação social sustentável: projeto brasileiro vence prêmio Aga Khan de Arquitetura 2026",
      source: "Bustler",
      sourceUrl: "https://www.bustler.net",
      link: "#",
      publishDate: "1d atrás",
      publishDateRaw: new Date(Date.now() - 86400000).toISOString(),
      summary:
        "O conjunto habitacional Caçapava do Sul, em São Paulo, foi premiado por integrar energia solar, captação de água pluvial e técnicas construtivas vernaculares para famílias de baixa renda.",
      topic: "research",
      trending: false,
    },
    {
      id: "mock-7",
      title: "Grasshopper 2.0: interface visual para arquitetura paramétrica chega ao web browser",
      source: "ArchDaily",
      sourceUrl: "https://www.archdaily.com",
      link: "#",
      publishDate: "1d atrás",
      publishDateRaw: new Date(Date.now() - 90000000).toISOString(),
      summary:
        "McNeel & Associates anuncia versão web do Grasshopper com colaboração em tempo real, biblioteca de 800 componentes nativos e exportação direta para Revit, SketchUp e formatos IFC.",
      topic: "tools",
      trending: false,
    },
    {
      id: "mock-8",
      title: "Grandes construtoras europeias formam consórcio para descarbonização total até 2035",
      source: "Dezeen",
      sourceUrl: "https://www.dezeen.com",
      link: "#",
      publishDate: "2d atrás",
      publishDateRaw: new Date(Date.now() - 172800000).toISOString(),
      summary:
        "Vinte e dois grupos de construção europeus assinam compromisso coletivo de neutralidade de carbono, com fundo de 3 bilhões de euros para pesquisa em materiais e métodos construtivos limpos.",
      topic: "business",
      trending: false,
    },
  ]
}
