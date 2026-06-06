"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Check, Copy, FileText, History, Loader2, Plus, Save, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  growthPromptFieldLabels,
  growthPrompts,
  type GrowthPromptInputKey,
} from "@/lib/growth-prompts"
import type { Json, Tables } from "@/lib/database.types"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

const initialInput: Record<GrowthPromptInputKey, string> = {
  niche: "",
  audience: "",
  goal: "",
  idea: "",
  tone: "",
  voice: "",
  content: "",
}

const defaultBriefValues: Record<GrowthPromptInputKey, string> = {
  niche: "IA aplicada, desenvolvimento de sistemas com IA, QA e automacao de software",
  audience: "Desenvolvedores, QAs, tech leads, founders e pessoas criando produtos com IA",
  goal: "Gerar autoridade, salvamentos, compartilhamentos e conversas qualificadas",
  idea: "",
  tone: "Inteligente, claro e sem exagero",
  voice: "Especialista tecnico, pragmatico, direto e didatico",
  content: "",
}

type ProfileRow = {
  name: string | null
  handle: string | null
  bio: string | null
}

type InstagramTokenRow = {
  instagram_username: string | null
}

type GrowthExperimentRow = Tables<"growth_experiments">

function normalizeHandle(value: string | null | undefined) {
  const trimmed = value?.trim().replace(/^@/, "")
  return trimmed ? `@${trimmed}` : ""
}

function buildUserBrief(profile: ProfileRow | null, instagram: InstagramTokenRow | null): Record<GrowthPromptInputKey, string> {
  const name = profile?.name?.trim() ?? ""
  const handle = normalizeHandle(instagram?.instagram_username || profile?.handle)
  const bio = profile?.bio?.trim() ?? ""
  const identity = [name, handle].filter(Boolean).join(" ")

  return {
    ...defaultBriefValues,
    niche: bio || defaultBriefValues.niche,
    audience: "Desenvolvedores, QAs, tech leads, founders e criadores interessados em IA aplicada",
    goal: "Atrair audiencia qualificada para conteudos de IA, desenvolvimento, qualidade e automacao",
    voice: identity
      ? `Voz de ${identity}: especialista tecnico, pragmatico, direto e didatico`
      : defaultBriefValues.voice,
    content: bio,
  }
}

function parseExperimentInput(value: Json): Partial<Record<GrowthPromptInputKey, string>> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {}
  }

  const source = value as Record<string, Json>
  return Object.keys(initialInput).reduce<Partial<Record<GrowthPromptInputKey, string>>>((acc, key) => {
    const fieldKey = key as GrowthPromptInputKey
    const fieldValue = source[fieldKey]
    if (typeof fieldValue === "string") {
      acc[fieldKey] = fieldValue
    }
    return acc
  }, {})
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

export default function GrowthLabPage() {
  const [activeId, setActiveId] = useState(growthPrompts[0].id)
  const [input, setInput] = useState<Record<GrowthPromptInputKey, string>>({
    ...initialInput,
    ...defaultBriefValues,
  })
  const [copied, setCopied] = useState(false)
  const [loadingContext, setLoadingContext] = useState(true)
  const [userBrief, setUserBrief] = useState<Record<GrowthPromptInputKey, string> | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [history, setHistory] = useState<GrowthExperimentRow[]>([])
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [savingExperiment, setSavingExperiment] = useState(false)
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null)

  const supabase = useMemo(() => createClient(), [])

  const activePrompt = growthPrompts.find((prompt) => prompt.id === activeId) ?? growthPrompts[0]
  const generatedPrompt = useMemo(() => activePrompt.template(input), [activePrompt, input])

  function updateField(key: GrowthPromptInputKey, value: string) {
    setInput((prev) => ({ ...prev, [key]: value }))
    setCopied(false)
    setSaveFeedback(null)
  }

  async function copyPrompt() {
    await navigator.clipboard.writeText(generatedPrompt)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  const loadUserBrief = useCallback(async () => {
    setLoadingContext(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const [{ data: profile }, { data: instagram }, { data: experiments, error: experimentsError }] = await Promise.all([
        supabase
          .from("profiles")
          .select("name, handle, bio")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("instagram_tokens")
          .select("instagram_username")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("growth_experiments")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5),
      ])

      const brief = buildUserBrief(profile, instagram)
      setUserBrief(brief)
      setInput((prev) => ({ ...prev, ...brief }))
      if (experimentsError) {
        setHistory([])
        setHistoryError("Histórico indisponível até aplicar a migration `growth_experiments`.")
      } else {
        setHistory((experiments ?? []) as GrowthExperimentRow[])
        setHistoryError(null)
      }
      setCopied(false)
    } finally {
      setLoadingContext(false)
    }
  }, [supabase])

  useEffect(() => {
    loadUserBrief()
  }, [loadUserBrief])

  function fillUserBrief() {
    setInput((prev) => ({ ...prev, ...(userBrief ?? defaultBriefValues) }))
    setCopied(false)
    setSaveFeedback(null)
  }

  function restoreExperiment(experiment: GrowthExperimentRow) {
    const matchingPrompt = growthPrompts.find((prompt) => prompt.id === experiment.prompt_id)
    setActiveId(matchingPrompt?.id ?? growthPrompts[0].id)
    setInput((prev) => ({ ...prev, ...parseExperimentInput(experiment.input) }))
    setCopied(false)
    setSaveFeedback("Experimento carregado no brief.")
  }

  async function saveExperiment() {
    if (!userId) {
      setSaveFeedback("Faça login para salvar experimentos.")
      return
    }

    setSavingExperiment(true)
    setSaveFeedback(null)
    try {
      const { data, error } = await supabase
        .from("growth_experiments")
        .insert({
          user_id: userId,
          prompt_id: activePrompt.id,
          prompt_title: activePrompt.title,
          input: input as unknown as Json,
          generated_prompt: generatedPrompt,
        })
        .select()
        .single()

      if (error || !data) {
        setSaveFeedback("Não foi possível salvar. Verifique se a migration `growth_experiments` foi aplicada.")
        return
      }

      setHistory((prev) => [data as GrowthExperimentRow, ...prev].slice(0, 5))
      setHistoryError(null)
      setSaveFeedback("Experimento salvo no histórico.")
    } finally {
      setSavingExperiment(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary)]/15">
                  <Sparkles size={17} className="text-[var(--primary)]" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[var(--foreground)]">Growth Lab</h2>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    Prompts para transformar ideias em posts com hook, formato, retencao e posicionamento.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={fillUserBrief} disabled={loadingContext}>
                {loadingContext ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                {loadingContext ? "Carregando..." : "Usar meus dados"}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={saveExperiment} disabled={savingExperiment}>
                {savingExperiment ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {savingExperiment ? "Salvando..." : "Salvar experimento"}
              </Button>
              <Button asChild size="sm">
                <Link href="/instagram">
                  <Plus size={14} />
                  Criar post
                </Link>
              </Button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {growthPrompts.map((prompt) => {
              const Icon = prompt.Icon
              const isActive = prompt.id === activePrompt.id
              return (
                <button
                  key={prompt.id}
                  type="button"
                  onClick={() => {
                    setActiveId(prompt.id)
                    setCopied(false)
                  }}
                  className={cn(
                    "min-h-36 rounded-xl border p-4 text-left transition-all",
                    isActive
                      ? "border-[var(--primary)] bg-[var(--primary)]/10 shadow-lg shadow-[var(--primary)]/5"
                      : "border-[var(--border)] bg-[var(--secondary)]/35 hover:border-[var(--primary)]/35"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
                      {prompt.step}
                    </span>
                    <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg border", prompt.accent)}>
                      <Icon size={15} />
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-semibold leading-snug text-[var(--foreground)]">{prompt.title}</p>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--muted-foreground)]">{prompt.summary}</p>
                </button>
              )
            })}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pipeline</CardTitle>
            <CardDescription>Da ruptura de padroes ao refinamento final de autoridade.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {growthPrompts.map((prompt, index) => (
              <div key={prompt.id} className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold",
                    prompt.id === activePrompt.id
                      ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                      : "border-[var(--border)] bg-[var(--secondary)] text-[var(--muted-foreground)]"
                  )}
                >
                  {index + 1}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--foreground)]">{prompt.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-[var(--muted-foreground)]">{prompt.summary}</p>
                </div>
              </div>
            ))}

            <div className="border-t border-[var(--border)] pt-4">
              <div className="mb-2 flex items-center gap-2">
                <History size={14} className="text-[var(--muted-foreground)]" />
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
                  Histórico salvo
                </p>
              </div>
              {historyError ? (
                <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-200">
                  {historyError}
                </p>
              ) : history.length === 0 ? (
                <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">
                  Salve prompts bons para reaproveitar ângulos, hooks e briefs depois.
                </p>
              ) : (
                <div className="space-y-2">
                  {history.map((experiment) => (
                    <button
                      key={experiment.id}
                      type="button"
                      onClick={() => restoreExperiment(experiment)}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--secondary)]/35 px-3 py-2 text-left transition-colors hover:border-[var(--primary)]/40"
                    >
                      <p className="truncate text-xs font-medium text-[var(--foreground)]">
                        {experiment.prompt_title}
                      </p>
                      <p className="mt-0.5 text-[10px] text-[var(--muted-foreground)]">
                        {formatDateTime(experiment.created_at)}
                      </p>
                    </button>
                  ))}
                </div>
              )}
              {saveFeedback && (
                <p className="mt-2 text-xs text-[var(--muted-foreground)]">{saveFeedback}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)]">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base">Brief</CardTitle>
                <CardDescription>
                  {loadingContext
                    ? "Carregando perfil e Instagram conectados..."
                    : "Campos usados no prompt selecionado."}
                </CardDescription>
              </div>
              <Badge variant="secondary">{activePrompt.step}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {activePrompt.fields.map((fieldKey) => {
              const isLongField = fieldKey === "content" || fieldKey === "idea"
              return (
                <div key={fieldKey} className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--muted-foreground)]">
                    {growthPromptFieldLabels[fieldKey]}
                  </label>
                  {isLongField ? (
                    <textarea
                      value={input[fieldKey]}
                      onChange={(event) => updateField(fieldKey, event.target.value)}
                      rows={fieldKey === "content" ? 7 : 4}
                      className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-2.5 text-sm leading-relaxed text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/30"
                      placeholder={`Preencha ${growthPromptFieldLabels[fieldKey].toLowerCase()}`}
                    />
                  ) : (
                    <input
                      value={input[fieldKey]}
                      onChange={(event) => updateField(fieldKey, event.target.value)}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/30"
                      placeholder={`Preencha ${growthPromptFieldLabels[fieldKey].toLowerCase()}`}
                    />
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-base">{activePrompt.title}</CardTitle>
                <CardDescription>{activePrompt.summary}</CardDescription>
              </div>
              <Button type="button" size="sm" onClick={copyPrompt}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copiado" : "Copiar prompt"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="max-h-[620px] overflow-auto rounded-xl border border-[var(--border)] bg-[#10101a] p-4 text-sm leading-relaxed text-[var(--foreground)] whitespace-pre-wrap">
              {generatedPrompt}
            </pre>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
