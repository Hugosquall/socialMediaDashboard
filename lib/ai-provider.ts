import { generateText } from "ai"

export type AiProviderName = "gateway" | "openai" | "gemini" | "mock"

export type GenerateContentResult = {
  text: string
  provider: AiProviderName
  model: string
}

type OpenAIResponse = {
  output_text?: string
  output?: Array<{
    content?: Array<{
      text?: string
      type?: string
    }>
  }>
}

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string
      }>
    }
  }>
}

function configuredProvider(): AiProviderName {
  const provider = process.env.AI_PROVIDER?.trim().toLowerCase()
  if (
    provider === "gateway" ||
    provider === "openai" ||
    provider === "gemini" ||
    provider === "mock"
  ) {
    return provider
  }

  if (process.env.AI_GATEWAY_API_KEY?.trim() || process.env.VERCEL_OIDC_TOKEN?.trim()) {
    return "gateway"
  }
  if (process.env.OPENAI_API_KEY?.trim()) {
    return "openai"
  }
  if (process.env.GEMINI_API_KEY?.trim()) {
    return "gemini"
  }

  return "mock"
}

function extractOpenAIText(data: OpenAIResponse): string {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim()
  }

  return (data.output ?? [])
    .flatMap((item) => item.content ?? [])
    .map((content) => content.text)
    .filter((text): text is string => typeof text === "string" && text.trim().length > 0)
    .join("\n")
    .trim()
}

function extractGeminiText(data: GeminiResponse): string {
  return (data.candidates ?? [])
    .flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => part.text)
    .filter((text): text is string => typeof text === "string" && text.trim().length > 0)
    .join("\n")
    .trim()
}

function mockGenerate(prompt: string): GenerateContentResult {
  const ideaLine = prompt
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.toLowerCase().startsWith("noticia/ideia:") || line.toLowerCase().startsWith("ideia:"))

  const idea = ideaLine?.split(":").slice(1).join(":").trim() || "tema de IA aplicada"

  return {
    provider: "mock",
    model: "deterministic-local",
    text: [
      `## Angulo editorial`,
      `Use "${idea}" para mostrar uma mudança prática no trabalho de engenharia com IA, sem tratar a notícia como repost.`,
      "",
      "## Hook",
      "A parte importante dessa notícia não é a ferramenta. É o que ela muda no jeito de construir software.",
      "",
      "## Carrossel de 7 slides",
      "1. O que aconteceu",
      "2. Por que isso importa para devs e QAs",
      "3. O erro comum ao interpretar essa tendência",
      "4. O impacto em produto, teste e arquitetura",
      "5. Como aplicar isso em um projeto real",
      "6. Um checklist pragmático",
      "7. CTA: salve para revisar no próximo planejamento técnico",
      "",
      "## Legenda",
      "Notícias de IA só viram vantagem quando entram no processo de engenharia. O ponto não é adotar tudo rápido; é entender o que muda em qualidade, velocidade e risco.",
    ].join("\n"),
  }
}

export async function generateContent(prompt: string): Promise<GenerateContentResult> {
  const provider = configuredProvider()

  if (provider === "mock") {
    return mockGenerate(prompt)
  }

  if (provider === "gateway") {
    const hasGatewayCredentials =
      process.env.AI_GATEWAY_API_KEY?.trim() || process.env.VERCEL_OIDC_TOKEN?.trim()
    if (!hasGatewayCredentials) {
      return mockGenerate(prompt)
    }

    const model = process.env.AI_GATEWAY_MODEL?.trim() || "openai/gpt-5.4"
    const result = await generateText({
      model,
      system: "Responda em português do Brasil. Seja prático, claro e orientado a conteúdo para Instagram técnico.",
      prompt,
    })

    const text = result.text.trim()
    if (!text) {
      throw new Error("AI Gateway não retornou texto.")
    }

    return { text, provider, model }
  }

  if (provider === "openai") {
    const apiKey = process.env.OPENAI_API_KEY?.trim()
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY não configurada.")
    }

    const model = process.env.OPENAI_MODEL?.trim() || "gpt-4.1-mini"
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        instructions: "Responda em português do Brasil. Seja prático, claro e orientado a conteúdo para Instagram técnico.",
        input: prompt,
      }),
    })

    if (!response.ok) {
      const details = await response.text()
      throw new Error(`OpenAI falhou (${response.status}): ${details.slice(0, 240)}`)
    }

    const data = (await response.json()) as OpenAIResponse
    const text = extractOpenAIText(data)
    if (!text) {
      throw new Error("OpenAI não retornou texto.")
    }

    return { text, provider, model }
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim()
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY não configurada.")
  }

  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash"
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: "Responda em português do Brasil. Seja prático, claro e orientado a conteúdo para Instagram técnico.",
            },
          ],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      }),
    }
  )

  if (!response.ok) {
    const details = await response.text()
    throw new Error(`Gemini falhou (${response.status}): ${details.slice(0, 240)}`)
  }

  const data = (await response.json()) as GeminiResponse
  const text = extractGeminiText(data)
  if (!text) {
    throw new Error("Gemini não retornou texto.")
  }

  return { text, provider, model }
}
