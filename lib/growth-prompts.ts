import type { LucideIcon } from "lucide-react"
import { BadgeCheck, Captions, Eye, Lightbulb, Newspaper, PanelsTopLeft } from "lucide-react"

export type GrowthPromptId =
  | "news-to-post"
  | "pattern-breaker"
  | "hook-lab"
  | "faceless-formats"
  | "retention-pass"
  | "authority-voice"

export type GrowthPromptInputKey =
  | "niche"
  | "audience"
  | "goal"
  | "idea"
  | "tone"
  | "voice"
  | "content"

export type GrowthPrompt = {
  id: GrowthPromptId
  step: string
  title: string
  summary: string
  Icon: LucideIcon
  accent: string
  fields: GrowthPromptInputKey[]
  template: (input: Record<GrowthPromptInputKey, string>) => string
}

const fallback: Record<GrowthPromptInputKey, string> = {
  niche: "[NICHO]",
  audience: "[AUDIENCIA]",
  goal: "[OBJETIVO]",
  idea: "[IDEIA]",
  tone: "[TOM]",
  voice: "[VOZ]",
  content: "[CONTEUDO]",
}

function field(input: Record<GrowthPromptInputKey, string>, key: GrowthPromptInputKey) {
  return input[key]?.trim() || fallback[key]
}

export const growthPromptFieldLabels: Record<GrowthPromptInputKey, string> = {
  niche: "Nicho",
  audience: "Audiência",
  goal: "Objetivo",
  idea: "Ideia",
  tone: "Tom",
  voice: "Voz da marca",
  content: "Conteúdo base",
}

export const growthPrompts: GrowthPrompt[] = [
  {
    id: "news-to-post",
    step: "Prompt 0",
    title: "Noticia para post",
    summary: "Transforma uma noticia do AI Dev Radar em carrossel, reel textual, legenda e CTA para o seu nicho.",
    Icon: Newspaper,
    accent: "text-cyan-400 bg-cyan-500/10 border-cyan-500/25",
    fields: ["idea", "content", "audience", "tone"],
    template: (input) => `Atue como estrategista de conteudo tecnico para Instagram.

Transforme a noticia abaixo em um post publicavel para um perfil sobre IA aplicada, desenvolvimento de sistemas com IA, QA e automacao.

Entregue:
- angulo editorial
- hook principal
- carrossel de 7 slides com titulo e texto curto por slide
- versao reel textual de ate 35 segundos
- legenda completa
- CTA
- observacao sobre como citar a fonte sem parecer apenas repost

Noticia/ideia: ${field(input, "idea")}
Contexto e fonte: ${field(input, "content")}
Audiencia: ${field(input, "audience")}
Tom: ${field(input, "tone")}`,
  },
  {
    id: "pattern-breaker",
    step: "Prompt 1",
    title: "Ideias fora do padrao saturado",
    summary: "Mapeia formatos previsiveis do nicho e gera ideias com potencial de salvamento e compartilhamento.",
    Icon: Lightbulb,
    accent: "text-amber-400 bg-amber-500/10 border-amber-500/25",
    fields: ["niche", "audience", "goal"],
    template: (input) => `Atue como estrategista senior de crescimento no Instagram.

Analise meu nicho, encontre os 7 padroes de conteudo mais saturados e crie 10 ideias que quebrem esses padroes sem perder compatibilidade com o algoritmo.

Para cada ideia, entregue:
- conceito
- hook inicial
- formato ideal
- por que parece nova
- por que tende a gerar salvamentos ou compartilhamentos

Nicho: ${field(input, "niche")}
Audiencia: ${field(input, "audience")}
Objetivo: ${field(input, "goal")}`,
  },
  {
    id: "hook-lab",
    step: "Prompt 2",
    title: "Hooks que param o scroll",
    summary: "Transforma uma ideia em aberturas com curiosidade, contraste, tensao emocional, especificidade e autoridade sutil.",
    Icon: Captions,
    accent: "text-sky-400 bg-sky-500/10 border-sky-500/25",
    fields: ["idea", "audience", "tone"],
    template: (input) => `Atue como copywriter viral especializado em Instagram.

Gere 15 hooks de abertura para esta ideia, divididos nestas categorias:
- curiosidade
- contrarian
- tensao emocional
- especificidade
- autoridade sutil

Cada hook deve interromper o scroll sem parecer clickbait. Mantenha um tom inteligente, natural e forte.

No final, ranqueie os 5 melhores.

Ideia: ${field(input, "idea")}
Audiencia: ${field(input, "audience")}
Tom: ${field(input, "tone")}`,
  },
  {
    id: "faceless-formats",
    step: "Prompt 3",
    title: "Versoes faceless",
    summary: "Converte uma ideia em formatos publicaveis sem rosto, sem voz e sem edicao complexa.",
    Icon: PanelsTopLeft,
    accent: "text-violet-400 bg-violet-500/10 border-violet-500/25",
    fields: ["idea", "audience", "goal"],
    template: (input) => `Atue como estrategista de conteudo faceless para Instagram.

Transforme esta ideia em 3 versoes:
- carrossel
- reel apenas com texto
- post visual silencioso

Para cada versao, entregue:
- estrutura
- texto na tela
- direcao visual
- legenda
- CTA

Ideia: ${field(input, "idea")}
Audiencia: ${field(input, "audience")}
Objetivo: ${field(input, "goal")}`,
  },
  {
    id: "retention-pass",
    step: "Prompt 4",
    title: "Passe de retencao",
    summary: "Reescreve o conteudo para aumentar watch time, taxa de conclusao, salvamentos e compartilhamentos.",
    Icon: Eye,
    accent: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
    fields: ["content", "voice", "audience"],
    template: (input) => `Atue como especialista em retencao para Instagram.

Reescreva este conteudo para maximizar tempo de visualizacao, conclusao, salvamentos e compartilhamentos.

Cada linha deve puxar a proxima. Remova partes fracas, deixe o texto natural, direto e preciso, sem soar promocional.

Depois, explique brevemente por que a nova versao funciona melhor.

Conteudo: ${field(input, "content")}
Voz: ${field(input, "voice")}
Audiencia: ${field(input, "audience")}`,
  },
  {
    id: "authority-voice",
    step: "Prompt 5",
    title: "Autoridade sem pose",
    summary: "Ajusta o posicionamento para transmitir competencia com clareza, sem arrogancia ou autopromocao.",
    Icon: BadgeCheck,
    accent: "text-rose-400 bg-rose-500/10 border-rose-500/25",
    fields: ["content", "audience", "voice"],
    template: (input) => `Atue como especialista em posicionamento de marca.

Reescreva meu conteudo para comunicar competencia e autoridade sem parecer guru, sem ostentar numeros e sem soar arrogante.

Use linguagem precisa, confianca sutil e clareza.

Entregue 3 versoes:
- elegante
- direta
- premium

Conteudo: ${field(input, "content")}
Audiencia: ${field(input, "audience")}
Voz da marca: ${field(input, "voice")}`,
  },
]
